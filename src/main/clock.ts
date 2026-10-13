import { uptime } from 'node:os';

export function monotonicMilliseconds(): number {
  return Number(process.hrtime.bigint() / 1_000_000n);
}

export function utcNow(): string {
  return new Date().toISOString();
}

export function localIsoNow(date = new Date()): string {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  const offset = `${sign}${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(absolute % 60).padStart(2, '0')}`;
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, -1);
  return `${local}${offset}`;
}

export function localDateNow(date = new Date()): string {
  return localIsoNow(date).slice(0, 10);
}

export function bootTimeUtc(): string {
  return new Date(Date.now() - uptime() * 1_000).toISOString();
}
