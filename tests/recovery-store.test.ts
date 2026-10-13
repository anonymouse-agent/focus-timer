import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { RecoveryEnvelope } from '../src/core/types';
import { RecoveryStore } from '../src/main/stores';

const created: string[] = [];
afterEach(async () => {
  for (const path of created.splice(0)) await rm(path, { recursive: true, force: true });
});

async function fixture(): Promise<{ path: string; store: RecoveryStore }> {
  const path = await mkdtemp(join(tmpdir(), 'focus-recovery-test-'));
  created.push(path);
  return { path, store: new RecoveryStore(path) };
}

const envelope: RecoveryEnvelope = {
  schemaVersion: 1,
  state: {
    status: 'RUNNING',
    session: {
      id: '11111111-1111-4111-8111-111111111111', taskLabel: 'Recover', plannedSeconds: 60,
      startedAtUtc: '2026-10-13T00:00:00.000Z', startedAtLocal: '2026-10-13T05:30:00.000+05:30', localStartDate: '2026-10-13',
      focusedMilliseconds: 0, pausedMilliseconds: 0, segmentStartedAtUtc: '2026-10-13T00:00:00.000Z',
      segmentStartedMonotonicMilliseconds: 1_000, utcDeadline: '2026-10-13T00:01:00.000Z', pauseStartedAtUtc: null,
      recoveryProvenance: 'none',
    },
  },
  lastObservedUtc: '2026-10-13T00:00:00.000Z', lastObservedMonotonicMilliseconds: 1_000,
  bootTimeUtc: '2026-10-12T00:00:00.000Z',
};

describe('RecoveryStore', () => {
  it('flushes valid state and maintains a recovery backup', async () => {
    const { path, store } = await fixture();
    await store.save(envelope);
    await store.save({ ...envelope, lastObservedMonotonicMilliseconds: 2_000 });
    expect(JSON.parse(await readFile(join(path, 'session-state.v1.json'), 'utf8')).lastObservedMonotonicMilliseconds).toBe(2_000);
    expect(JSON.parse(await readFile(join(path, 'session-state.v1.backup.json'), 'utf8')).lastObservedMonotonicMilliseconds).toBe(1_000);
  });

  it('recovers from a corrupt primary without overwriting it during load', async () => {
    const { path, store } = await fixture();
    await store.save(envelope);
    await store.save({ ...envelope, lastObservedMonotonicMilliseconds: 2_000 });
    await writeFile(join(path, 'session-state.v1.json'), '{broken', 'utf8');
    const loaded = await store.load();
    expect(loaded.recoveredFromBackup).toBe(true);
    expect(loaded.corrupt).toBe(true);
    expect(loaded.envelope?.lastObservedMonotonicMilliseconds).toBe(1_000);
    expect(await readFile(join(path, 'session-state.v1.json'), 'utf8')).toBe('{broken');
  });

  it('surfaces an unsupported envelope as corrupt', async () => {
    const { path, store } = await fixture();
    await writeFile(join(path, 'session-state.v1.json'), '{"schemaVersion":99}', 'utf8');
    expect(await store.load()).toMatchObject({ envelope: null, corrupt: true });
  });
});
