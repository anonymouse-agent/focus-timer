import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { SessionRecord } from '../src/core/types';
import { MarkdownStore } from '../src/main/stores';

const created: string[] = [];
afterEach(async () => {
  for (const folder of created.splice(0)) await rm(folder, { recursive: true, force: true });
});

async function folder(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), 'focus-timer-test-'));
  created.push(path);
  return path;
}

const record: SessionRecord = {
  sessionId: '22222222-2222-4222-8222-222222222222', taskLabel: 'Unicode 🍅', plannedSeconds: 60,
  focusedSeconds: 60, pausedSeconds: 0, startedAtUtc: '2026-10-13T18:29:30.000Z',
  startedAtLocal: '2026-10-13T23:59:30.000+05:30', localStartDate: '2026-10-13',
  endedAtUtc: '2026-10-13T18:30:30.000Z', endedAtLocal: '2026-10-14T00:00:30.000+05:30',
  confirmedAtLocal: '2026-10-14T00:01:00.000+05:30', outcome: 'timer_elapsed', recoveryProvenance: 'none',
  accomplishment: 'Crossed midnight.', appVersion: '0.1.0',
};

describe('MarkdownStore', () => {
  it('initializes, appends, and makes retry idempotent', async () => {
    const path = await folder();
    const store = new MarkdownStore();
    await store.append(path, record);
    const first = await readFile(join(path, '2026-10-13.md'), 'utf8');
    await store.append(path, record);
    const second = await readFile(join(path, '2026-10-13.md'), 'utf8');
    expect(second).toBe(first);
    expect(second.match(/focus-timer:session:start/gu)).toHaveLength(1);
  });

  it('preserves compatible external content', async () => {
    const path = await folder();
    const store = new MarkdownStore();
    await store.initializeFolder(path);
    const initial = '---\nschema_version: 1\ndate: 2026-10-13\n---\n\nMy own note.\n';
    await writeFile(join(path, '2026-10-13.md'), initial, 'utf8');
    await store.append(path, record);
    expect(await readFile(join(path, '2026-10-13.md'), 'utf8')).toMatch(/^---[\s\S]+My own note\.\n/u);
  });

  it('rejects a non-empty unowned folder without modifying it', async () => {
    const path = await folder();
    await writeFile(join(path, 'mine.txt'), 'keep', 'utf8');
    const result = await new MarkdownStore().initializeFolder(path);
    expect(result.ok).toBe(false);
    expect(await readFile(join(path, 'mine.txt'), 'utf8')).toBe('keep');
  });
});
