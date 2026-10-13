import { constants } from 'node:fs';
import { access, mkdir, open, readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { APP_SCHEMA_VERSION, DEFAULT_SETTINGS } from '../core/types';
import type { RecoveryEnvelope, SessionRecord, Settings } from '../core/types';
import { dailyHeader, inspectRecordMarkers, serializeRecord } from '../core/markdown';
import { readJson, removeIfPresent, writeJsonAtomic } from './json-store';

const FOLDER_MARKER = '.focus-timer-folder.json';

export class SettingsStore {
  private readonly path: string;

  public constructor(userDataPath: string) {
    this.path = join(userDataPath, 'settings.v1.json');
  }

  public async load(): Promise<Settings> {
    try {
      const candidate = await readJson<unknown>(this.path);
      const settings = parseSettings(candidate);
      return settings ?? DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public async save(settings: Settings): Promise<void> {
    await writeJsonAtomic(this.path, settings);
  }
}

export interface RecoveryLoadResult {
  readonly envelope: RecoveryEnvelope | null;
  readonly recoveredFromBackup: boolean;
  readonly corrupt: boolean;
}

export class RecoveryStore {
  private readonly primary: string;
  private readonly backup: string;

  public constructor(userDataPath: string) {
    this.primary = join(userDataPath, 'session-state.v1.json');
    this.backup = join(userDataPath, 'session-state.v1.backup.json');
  }

  public async load(): Promise<RecoveryLoadResult> {
    let primaryCorrupt = false;
    try {
      const envelope = await readJson<unknown>(this.primary);
      if (isRecoveryEnvelope(envelope)) {
        return { envelope, recoveredFromBackup: false, corrupt: false };
      }
      if (envelope !== null) primaryCorrupt = true;
    } catch {
      primaryCorrupt = true;
    }
    try {
      const envelope = await readJson<unknown>(this.backup);
      if (isRecoveryEnvelope(envelope)) {
        return { envelope, recoveredFromBackup: true, corrupt: primaryCorrupt };
      }
      return { envelope: null, recoveredFromBackup: false, corrupt: primaryCorrupt || envelope !== null };
    } catch {
      return { envelope: null, recoveredFromBackup: false, corrupt: true };
    }
  }

  public async save(envelope: RecoveryEnvelope): Promise<void> {
    await writeJsonAtomic(this.primary, envelope, this.backup);
  }

  public async clear(): Promise<void> {
    await removeIfPresent(this.primary);
    await removeIfPresent(this.backup);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseSettings(value: unknown): Settings | null {
  if (!isRecord(value)) return null;
  const valid = value['schemaVersion'] === APP_SCHEMA_VERSION
    && (value['dataFolder'] === null || typeof value['dataFolder'] === 'string')
    && (value['skin'] === 'avocado' || value['skin'] === 'cat' || value['skin'] === 'dog' || value['skin'] === 'tomato')
    && typeof value['soundEnabled'] === 'boolean'
    && typeof value['notificationsEnabled'] === 'boolean'
    && typeof value['alwaysOnTop'] === 'boolean'
    && isWindowPosition(value['windowPosition']);
  if (!valid) return null;
  return {
    schemaVersion: APP_SCHEMA_VERSION,
    dataFolder: value['dataFolder'] as string | null,
    skin: value['skin'] as Settings['skin'],
    soundEnabled: value['soundEnabled'] as boolean,
    notificationsEnabled: value['notificationsEnabled'] as boolean,
    alwaysOnTop: value['alwaysOnTop'] as boolean,
    windowPosition: value['windowPosition'] === undefined
      ? null
      : value['windowPosition'] as Settings['windowPosition'],
  };
}

function isWindowPosition(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  return isRecord(value)
    && typeof value['x'] === 'number'
    && Number.isFinite(value['x'])
    && typeof value['y'] === 'number'
    && Number.isFinite(value['y']);
}

function isSession(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return typeof value['id'] === 'string'
    && typeof value['taskLabel'] === 'string'
    && typeof value['plannedSeconds'] === 'number'
    && typeof value['startedAtUtc'] === 'string'
    && typeof value['startedAtLocal'] === 'string'
    && typeof value['localStartDate'] === 'string'
    && typeof value['focusedMilliseconds'] === 'number'
    && typeof value['pausedMilliseconds'] === 'number'
    && typeof value['segmentStartedAtUtc'] === 'string'
    && typeof value['segmentStartedMonotonicMilliseconds'] === 'number'
    && typeof value['utcDeadline'] === 'string'
    && (value['pauseStartedAtUtc'] === null || typeof value['pauseStartedAtUtc'] === 'string');
}

function isCompletion(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return typeof value['sessionId'] === 'string'
    && typeof value['taskLabel'] === 'string'
    && typeof value['plannedSeconds'] === 'number'
    && typeof value['focusedSeconds'] === 'number'
    && typeof value['pausedSeconds'] === 'number'
    && typeof value['startedAtUtc'] === 'string'
    && typeof value['startedAtLocal'] === 'string'
    && typeof value['localStartDate'] === 'string'
    && typeof value['endedAtUtc'] === 'string'
    && typeof value['endedAtLocal'] === 'string'
    && (value['outcome'] === 'timer_elapsed' || value['outcome'] === 'finished_early');
}

function isRecoveryState(value: unknown): boolean {
  if (!isRecord(value) || typeof value['status'] !== 'string') return false;
  switch (value['status']) {
    case 'RUNNING':
    case 'PAUSED':
      return isSession(value['session']);
    case 'TIME_CONFLICT':
      return isSession(value['session'])
        && typeof value['wallElapsedMilliseconds'] === 'number'
        && typeof value['monotonicElapsedMilliseconds'] === 'number';
    case 'COMPLETION_REVIEW':
      return isCompletion(value['completion'])
        && typeof value['soundAttempted'] === 'boolean'
        && typeof value['notificationAttempted'] === 'boolean';
    case 'NOTE_ENTRY':
      return isCompletion(value['completion']) && typeof value['draft'] === 'string';
    case 'SAVE_FAILED':
      return isCompletion(value['completion'])
        && (value['draft'] === null || typeof value['draft'] === 'string')
        && typeof value['message'] === 'string';
    default:
      return false;
  }
}

function isRecoveryEnvelope(value: unknown): value is RecoveryEnvelope {
  if (!isRecord(value)) return false;
  return value['schemaVersion'] === APP_SCHEMA_VERSION
    && isRecoveryState(value['state'])
    && typeof value['lastObservedUtc'] === 'string'
    && typeof value['lastObservedMonotonicMilliseconds'] === 'number'
    && typeof value['bootTimeUtc'] === 'string';
}

export type FolderValidation = { readonly ok: true } | { readonly ok: false; readonly message: string };

export class MarkdownStore {
  private queue: Promise<void> = Promise.resolve();

  public async initializeFolder(folder: string): Promise<FolderValidation> {
    await mkdir(folder, { recursive: true });
    const markerPath = join(folder, FOLDER_MARKER);
    const names = await readdir(folder);
    if (names.length === 0) {
      await writeJsonAtomic(markerPath, { product: 'Focus Timer', schemaVersion: APP_SCHEMA_VERSION });
      return { ok: true };
    }
    if (!names.includes(FOLDER_MARKER)) {
      return { ok: false, message: 'Choose an empty folder or a folder previously created by Focus Timer.' };
    }
    try {
      const marker = await readJson<{ product?: string; schemaVersion?: number }>(markerPath);
      if (marker?.product !== 'Focus Timer' || marker.schemaVersion !== APP_SCHEMA_VERSION) {
        return { ok: false, message: 'This folder uses an unsupported Focus Timer format.' };
      }
      return { ok: true };
    } catch {
      return { ok: false, message: 'The Focus Timer folder marker cannot be read.' };
    }
  }

  public append(folder: string, record: SessionRecord): Promise<void> {
    const operation = this.queue.then(() => this.appendInternal(folder, record));
    this.queue = operation.catch(() => undefined);
    return operation;
  }

  private async appendInternal(folder: string, record: SessionRecord): Promise<void> {
    const validation = await this.initializeFolder(folder);
    if (!validation.ok) throw new Error(validation.message);
    const path = join(folder, `${record.localStartDate}.md`);
    let content: string;
    try {
      content = await readFile(path, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      content = '';
    }
    const markerStatus = inspectRecordMarkers(content, record.sessionId);
    if (markerStatus === 'complete') return;
    if (markerStatus === 'malformed') {
      throw new Error(`Session ${record.sessionId} has partial or malformed Markdown markers.`);
    }
    const section = serializeRecord(record);
    if (content === '') {
      const handle = await open(path, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
      try {
        await handle.writeFile(`${dailyHeader(record.localStartDate)}\n${section}`, 'utf8');
        await handle.sync();
      } finally {
        await handle.close();
      }
      return;
    }
    if (!content.startsWith(`---\nschema_version: 1\ndate: ${record.localStartDate}\n---\n`)) {
      throw new Error(`Daily file ${basename(path)} has missing or incompatible frontmatter.`);
    }
    const handle = await open(path, constants.O_APPEND | constants.O_WRONLY);
    try {
      const separator = content.endsWith('\n') ? '\n' : '\n\n';
      await handle.writeFile(`${separator}${section}`, 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }
  }

  public async canAccess(folder: string): Promise<boolean> {
    try {
      await access(folder, constants.R_OK | constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }
}
