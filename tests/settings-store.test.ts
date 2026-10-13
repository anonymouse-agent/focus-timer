import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { SettingsStore } from '../src/main/stores';

const created: string[] = [];
afterEach(async () => {
  for (const path of created.splice(0)) await rm(path, { recursive: true, force: true });
});

async function fixture(): Promise<{ path: string; store: SettingsStore }> {
  const path = await mkdtemp(join(tmpdir(), 'focus-settings-test-'));
  created.push(path);
  return { path, store: new SettingsStore(path) };
}

describe('SettingsStore', () => {
  it('pins new profiles by default', async () => {
    const { store } = await fixture();
    expect((await store.load()).alwaysOnTop).toBe(true);
  });

  it('migrates a compatible v1 file that predates remembered position', async () => {
    const { path, store } = await fixture();
    await writeFile(join(path, 'settings.v1.json'), JSON.stringify({
      schemaVersion: 1,
      dataFolder: 'C:\\Focus Records',
      skin: 'cat',
      soundEnabled: true,
      notificationsEnabled: false,
      alwaysOnTop: true,
    }), 'utf8');

    expect(await store.load()).toMatchObject({ skin: 'cat', windowPosition: null });
  });

  it('round-trips a finite remembered position', async () => {
    const { store } = await fixture();
    await store.save({
      schemaVersion: 1,
      dataFolder: null,
      skin: 'tomato',
      soundEnabled: true,
      notificationsEnabled: true,
      alwaysOnTop: false,
      windowPosition: { x: -240, y: 180 },
    });

    expect((await store.load()).windowPosition).toEqual({ x: -240, y: 180 });
  });

  it('rejects non-finite or malformed positions without trusting partial settings', async () => {
    const { path, store } = await fixture();
    await writeFile(join(path, 'settings.v1.json'), JSON.stringify({
      schemaVersion: 1,
      dataFolder: null,
      skin: 'dog',
      soundEnabled: true,
      notificationsEnabled: true,
      alwaysOnTop: false,
      windowPosition: { x: 'left', y: 20 },
    }), 'utf8');

    expect(await store.load()).toMatchObject({ skin: 'avocado', alwaysOnTop: true, windowPosition: null });
  });
});
