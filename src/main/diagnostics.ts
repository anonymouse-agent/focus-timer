import { mkdir, open, readdir, rename, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';

const MAX_FILE_BYTES = 1_000_000;
const MAX_FILES = 7;

export class DiagnosticSink {
  private readonly folder: string;
  private writeQueue: Promise<void> = Promise.resolve();

  public constructor(userDataPath: string) {
    this.folder = join(userDataPath, 'logs');
  }

  public info(event: string, details: Record<string, string | number | boolean> = {}): void {
    this.enqueue('INFO', event, details);
  }

  public error(event: string, error: unknown): void {
    const safe = error instanceof Error ? { name: error.name, code: (error as NodeJS.ErrnoException).code ?? 'unknown' } : {};
    this.enqueue('ERROR', event, safe);
  }

  private enqueue(level: string, event: string, details: Record<string, string | number | boolean>): void {
    this.writeQueue = this.writeQueue
      .then(() => this.write(level, event, details))
      .catch(() => undefined);
  }

  private async write(level: string, event: string, details: Record<string, string | number | boolean>): Promise<void> {
    await mkdir(this.folder, { recursive: true });
    const path = join(this.folder, 'focus-timer.log');
    try {
      const metadata = await stat(path);
      if (metadata.size >= MAX_FILE_BYTES) await this.rotate();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    const handle = await open(path, 'a', 0o600);
    try {
      await handle.writeFile(`${JSON.stringify({ at: new Date().toISOString(), level, event, ...details })}\n`, 'utf8');
    } finally {
      await handle.close();
    }
  }

  private async rotate(): Promise<void> {
    const files = (await readdir(this.folder))
      .filter((name) => /^focus-timer\.log\.\d+$/u.test(name))
      .sort((a, b) => Number(b.split('.').at(-1)) - Number(a.split('.').at(-1)));
    for (const file of files) {
      const number = Number(file.split('.').at(-1));
      if (number >= MAX_FILES - 1) await rm(join(this.folder, file), { force: true });
      else await rename(join(this.folder, file), join(this.folder, `focus-timer.log.${number + 1}`));
    }
    await rename(join(this.folder, 'focus-timer.log'), join(this.folder, 'focus-timer.log.1'));
  }
}
