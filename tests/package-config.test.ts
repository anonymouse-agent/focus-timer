import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface PackageConfig {
  version: string;
  scripts: { 'package:win': string };
  build: {
    extraFiles: Array<{ from: string; to: string }>;
    win: { target: Array<{ target: string; arch: string[] }> };
    nsis: {
      oneClick: boolean;
      perMachine: boolean;
      allowToChangeInstallationDirectory: boolean;
      createDesktopShortcut: boolean;
      createStartMenuShortcut: boolean;
    };
  };
}

describe('Windows package configuration', () => {
  it('builds a user-friendly installer and portable ZIP with license notices', () => {
    const config = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
    ) as PackageConfig;

    expect(config.version).toBe('0.1.0-beta.1');
    expect(config.scripts['package:win']).toContain('--publish never');
    expect(config.scripts['package:win']).not.toContain('electronDist');
    expect(config.build.win.target).toEqual([
      { target: 'nsis', arch: ['x64'] },
      { target: 'zip', arch: ['x64'] },
    ]);
    expect(config.build.nsis).toMatchObject({
      oneClick: false,
      perMachine: false,
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
    });
    expect(config.build.extraFiles.map(({ to }) => to)).toEqual(
      expect.arrayContaining(['LICENSE', 'ASSET_LICENSE.md', 'LICENSES/CC-BY-4.0.txt']),
    );
  });
});
