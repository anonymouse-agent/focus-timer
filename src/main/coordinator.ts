import { randomUUID } from 'node:crypto';
import type { AppCommand, CommandResponse, PublicSnapshot } from '../shared/ipc';
import { reduce } from '../core/reducer';
import { reconcileRecovery, runningTiming } from '../core/timing';
import { APP_SCHEMA_VERSION, DEFAULT_SETTINGS } from '../core/types';
import type { RecoveryEnvelope, SessionRecord, SessionState, Settings } from '../core/types';
import { bootTimeUtc, localDateNow, localIsoNow, monotonicMilliseconds, utcNow } from './clock';
import { DiagnosticSink } from './diagnostics';
import { MarkdownStore, RecoveryStore, SettingsStore } from './stores';

interface CoordinatorIntegrations {
  readonly publish: (snapshot: PublicSnapshot) => void;
  readonly chooseDataFolder: () => Promise<string | null>;
  readonly notify: (title: string, body: string) => void;
  readonly playSound: () => void;
  readonly setAlwaysOnTop: (enabled: boolean) => void;
  readonly openFolder: (path: string) => Promise<string>;
}

export class Coordinator {
  private state: SessionState = { status: 'SETUP_REQUIRED', reason: 'Choose a folder for your focus records.' };
  private settings: Settings = DEFAULT_SETTINGS;
  private readonly settingsStore: SettingsStore;
  private readonly recoveryStore: RecoveryStore;
  private readonly markdownStore = new MarkdownStore();
  private readonly diagnostics: DiagnosticSink;
  private tickHandle: NodeJS.Timeout | null = null;
  private tickInProgress = false;

  public constructor(
    userDataPath: string,
    private readonly version: string,
    private readonly integrations: CoordinatorIntegrations,
  ) {
    this.settingsStore = new SettingsStore(userDataPath);
    this.recoveryStore = new RecoveryStore(userDataPath);
    this.diagnostics = new DiagnosticSink(userDataPath);
  }

  public async initialize(): Promise<void> {
    this.settings = await this.settingsStore.load();
    this.integrations.setAlwaysOnTop(this.settings.alwaysOnTop);
    const recovered = await this.recoveryStore.load();
    if (recovered.envelope !== null) {
      this.state = await this.restore(recovered.envelope);
      this.diagnostics.info('state-restored', { backup: recovered.recoveredFromBackup });
    } else if (recovered.corrupt) {
      this.state = {
        status: 'SETUP_REQUIRED',
        reason: 'Recovery files could not be read. They were preserved for inspection; choose your data folder to continue.',
      };
      this.diagnostics.info('recovery-corrupt');
    } else {
      this.state = this.settings.dataFolder === null
        ? { status: 'SETUP_REQUIRED', reason: 'Choose a folder for your focus records.' }
        : { status: 'IDLE' };
    }
    this.publish();
    this.startTicker();
    if (this.state.status === 'COMPLETION_REVIEW') await this.attemptAlerts();
  }

  public stop(): void {
    if (this.tickHandle !== null) clearInterval(this.tickHandle);
    this.tickHandle = null;
  }

  public getSnapshot(): PublicSnapshot {
    let remainingMilliseconds: number | null = null;
    if (this.state.status === 'RUNNING') {
      remainingMilliseconds = runningTiming(this.state.session, monotonicMilliseconds()).remainingMilliseconds;
    } else if (this.state.status === 'PAUSED' || this.state.status === 'TIME_CONFLICT') {
      remainingMilliseconds = Math.max(
        0,
        this.state.session.plannedSeconds * 1_000 - this.state.session.focusedMilliseconds,
      );
    }
    return { state: this.state, settings: this.settings, remainingMilliseconds, version: this.version };
  }

  public hasUnresolvedWork(): boolean {
    return this.state.status !== 'IDLE' && this.state.status !== 'SETUP_REQUIRED';
  }

  public async checkpoint(): Promise<void> {
    if (this.hasUnresolvedWork()) await this.persist(this.state);
  }

  public async saveWindowPosition(x: number, y: number): Promise<void> {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const position = { x: Math.round(x), y: Math.round(y) } as const;
    if (this.settings.windowPosition?.x === position.x && this.settings.windowPosition.y === position.y) return;
    await this.updateSettings({ ...this.settings, windowPosition: position });
  }

  public async command(command: AppCommand): Promise<CommandResponse> {
    try {
      const message = await this.execute(command);
      return message === undefined
        ? { ok: true, snapshot: this.getSnapshot() }
        : { ok: true, snapshot: this.getSnapshot(), message };
    } catch (error) {
      this.diagnostics.error('command-failed', error);
      return {
        ok: false,
        snapshot: this.getSnapshot(),
        message: error instanceof Error ? error.message : 'The command failed.',
      };
    }
  }

  public async reconcileAfterResume(): Promise<void> {
    await this.tick();
  }

  private async execute(command: AppCommand): Promise<string | undefined> {
    switch (command.type) {
      case 'chooseDataFolder': {
        const folder = await this.integrations.chooseDataFolder();
        if (folder === null) return undefined;
        const validation = await this.markdownStore.initializeFolder(folder);
        if (!validation.ok) throw new Error(validation.message);
        await this.updateSettings({ ...this.settings, dataFolder: folder });
        if (this.state.status === 'SETUP_REQUIRED') await this.transition({ status: 'IDLE' });
        return 'Data folder is ready.';
      }
      case 'start': {
        const result = reduce(this.state, {
          type: 'Start',
          id: randomUUID(),
          taskLabel: command.taskLabel,
          durationMinutes: Number(command.durationMinutes),
          nowUtc: utcNow(),
          nowLocal: localIsoNow(),
          localDate: localDateNow(),
          nowMonotonicMilliseconds: monotonicMilliseconds(),
        });
        await this.applyResult(result);
        return undefined;
      }
      case 'pause':
        await this.applyResult(reduce(this.state, { type: 'Pause', nowUtc: utcNow(), nowMonotonicMilliseconds: monotonicMilliseconds() }));
        return undefined;
      case 'resume':
        await this.applyResult(reduce(this.state, { type: 'Resume', nowUtc: utcNow(), nowMonotonicMilliseconds: monotonicMilliseconds() }));
        return undefined;
      case 'cancel':
        await this.applyResult(reduce(this.state, { type: 'Cancel' }));
        return 'Session cancelled. No history was written.';
      case 'finishEarly':
        await this.finish('FinishEarly');
        return undefined;
      case 'addNote':
        await this.applyResult(reduce(this.state, { type: 'ConfirmCompletion' }));
        return undefined;
      case 'updateDraft':
        await this.applyResult(reduce(this.state, { type: 'UpdateDraft', draft: command.draft }));
        return undefined;
      case 'save':
        await this.saveCompletion(command.includeDraft);
        return 'Session saved.';
      case 'discardDraft':
        await this.applyResult(reduce(this.state, { type: 'Discard' }));
        return undefined;
      case 'resolveTimeConflict':
        await this.applyResult(reduce(this.state, {
          type: 'ResolveTimeConflict',
          choice: command.choice,
          nowUtc: utcNow(),
          nowLocal: localIsoNow(),
          nowMonotonicMilliseconds: monotonicMilliseconds(),
        }));
        if (this.state.status === 'COMPLETION_REVIEW') await this.attemptAlerts();
        return undefined;
      case 'setSkin':
        await this.updateSettings({ ...this.settings, skin: command.skin });
        return undefined;
      case 'setSound':
        await this.updateSettings({ ...this.settings, soundEnabled: command.enabled });
        return undefined;
      case 'setNotifications':
        await this.updateSettings({ ...this.settings, notificationsEnabled: command.enabled });
        return undefined;
      case 'setAlwaysOnTop':
        await this.updateSettings({ ...this.settings, alwaysOnTop: command.enabled });
        this.integrations.setAlwaysOnTop(command.enabled);
        return undefined;
      case 'openDataFolder': {
        if (this.settings.dataFolder === null) throw new Error('Choose a data folder first.');
        const error = await this.integrations.openFolder(this.settings.dataFolder);
        if (error !== '') throw new Error('Windows could not open the data folder.');
        return undefined;
      }
    }
  }

  private async applyResult(result: ReturnType<typeof reduce>): Promise<void> {
    if (!result.ok) throw new Error(result.message);
    await this.transition(result.state);
  }

  private async finish(type: 'FinishEarly' | 'Expire'): Promise<void> {
    const result = reduce(this.state, {
      type,
      nowUtc: utcNow(),
      nowLocal: localIsoNow(),
      nowMonotonicMilliseconds: monotonicMilliseconds(),
    });
    await this.applyResult(result);
    if (type === 'Expire') await this.attemptAlerts();
  }

  private async saveCompletion(includeDraft: boolean): Promise<void> {
    const state = this.state;
    if (state.status !== 'COMPLETION_REVIEW' && state.status !== 'NOTE_ENTRY' && state.status !== 'SAVE_FAILED') {
      throw new Error('There is no completed session to save.');
    }
    if (this.settings.dataFolder === null) throw new Error('Choose a data folder before saving.');
    const draft = includeDraft
      ? state.status === 'NOTE_ENTRY'
        ? state.draft
        : state.status === 'SAVE_FAILED'
          ? state.draft
          : null
      : null;
    const record: SessionRecord = {
      ...state.completion,
      confirmedAtLocal: localIsoNow(),
      accomplishment: draft,
      appVersion: this.version,
    };
    try {
      await this.markdownStore.append(this.settings.dataFolder, record);
      await this.transition({ status: 'IDLE' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Markdown could not be saved.';
      await this.applyResult(reduce(this.state, { type: 'SaveFailed', message }));
      throw error;
    }
  }

  private async transition(next: SessionState): Promise<void> {
    if (next.status === 'IDLE') await this.recoveryStore.clear();
    else if (next.status !== 'SETUP_REQUIRED') await this.persist(next);
    this.state = next;
    this.publish();
  }

  private async persist(state: SessionState): Promise<void> {
    if (state.status === 'IDLE' || state.status === 'SETUP_REQUIRED') return;
    const envelope: RecoveryEnvelope = {
      schemaVersion: APP_SCHEMA_VERSION,
      state,
      lastObservedUtc: utcNow(),
      lastObservedMonotonicMilliseconds: monotonicMilliseconds(),
      bootTimeUtc: bootTimeUtc(),
    };
    await this.recoveryStore.save(envelope);
  }

  private async updateSettings(settings: Settings): Promise<void> {
    await this.settingsStore.save(settings);
    this.settings = settings;
    this.publish();
  }

  private publish(): void {
    this.integrations.publish(this.getSnapshot());
  }

  private startTicker(): void {
    this.tickHandle = setInterval(() => {
      if (this.tickInProgress) return;
      this.tickInProgress = true;
      void this.tick()
        .catch((error: unknown) => this.diagnostics.error('timer-tick-failed', error))
        .finally(() => { this.tickInProgress = false; });
    }, 250);
  }

  private async tick(): Promise<void> {
    if (this.state.status !== 'RUNNING') {
      this.publish();
      return;
    }
    if (runningTiming(this.state.session, monotonicMilliseconds()).expired) {
      await this.finish('Expire');
    } else {
      this.publish();
    }
  }

  private async attemptAlerts(): Promise<void> {
    if (this.state.status !== 'COMPLETION_REVIEW') return;
    const current = this.state;
    if (current.soundAttempted && current.notificationAttempted) return;
    const result = reduce(current, {
      type: 'MarkAlertsAttempted',
      sound: true,
      notification: true,
    });
    if (!result.ok) return;
    await this.transition(result.state);
    if (this.settings.soundEnabled) this.integrations.playSound();
    if (this.settings.notificationsEnabled) {
      this.integrations.notify('Focus session complete', current.completion.taskLabel);
    }
  }

  private async restore(envelope: RecoveryEnvelope): Promise<SessionState> {
    if (envelope.state.status !== 'RUNNING') return envelope.state;
    const nowUtcValue = utcNow();
    const nowMono = monotonicMilliseconds();
    const rebootEvident = Math.abs(Date.parse(envelope.bootTimeUtc) - Date.parse(bootTimeUtc())) > 60_000;
    const decision = reconcileRecovery(
      envelope.state.session,
      { utc: envelope.lastObservedUtc, monotonicMilliseconds: envelope.lastObservedMonotonicMilliseconds },
      { utc: nowUtcValue, monotonicMilliseconds: nowMono },
      rebootEvident,
    );
    if (decision.kind === 'conflict') {
      return {
        status: 'TIME_CONFLICT',
        session: envelope.state.session,
        wallElapsedMilliseconds: decision.wallElapsedMilliseconds,
        monotonicElapsedMilliseconds: decision.monotonicElapsedMilliseconds,
      };
    }
    const focusedMilliseconds = envelope.state.session.focusedMilliseconds + decision.elapsedMilliseconds;
    const provenance = decision.kind === 'reboot' ? 'reboot_utc' : 'same_boot_monotonic';
    const session = {
      ...envelope.state.session,
      focusedMilliseconds,
      recoveryProvenance: provenance,
      segmentStartedAtUtc: nowUtcValue,
      segmentStartedMonotonicMilliseconds: nowMono,
      utcDeadline: new Date(
        Date.parse(nowUtcValue) + Math.max(0, envelope.state.session.plannedSeconds * 1_000 - focusedMilliseconds),
      ).toISOString(),
    } as const;
    const running: SessionState = { status: 'RUNNING', session };
    if (focusedMilliseconds < session.plannedSeconds * 1_000) {
      await this.persist(running);
      return running;
    }
    const completed = reduce(running, {
      type: 'Expire',
      nowUtc: session.utcDeadline,
      nowLocal: localIsoNow(new Date(session.utcDeadline)),
      nowMonotonicMilliseconds: nowMono,
    });
    if (!completed.ok) return running;
    await this.persist(completed.state);
    return completed.state;
  }
}
