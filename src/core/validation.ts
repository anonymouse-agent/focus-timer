export interface ValidationResult<T> {
  readonly ok: boolean;
  readonly value?: T;
  readonly message?: string;
}

export function validateTaskLabel(raw: string): ValidationResult<string> {
  const normalized = raw.normalize('NFC');
  if (/\r|\n|\u2028|\u2029/u.test(normalized)) {
    return { ok: false, message: 'Task label must be a single line.' };
  }
  const trimmed = normalized.trim();
  const length = Array.from(trimmed).length;
  if (length < 1 || length > 200) {
    return { ok: false, message: 'Task label must contain 1–200 characters.' };
  }
  return { ok: true, value: trimmed };
}

export function validateDurationMinutes(raw: string | number): ValidationResult<number> {
  const text = String(raw).trim();
  if (!/^\d+$/u.test(text)) {
    return { ok: false, message: 'Duration must be a whole number of minutes.' };
  }
  const value = Number(text);
  if (!Number.isSafeInteger(value) || value < 1 || value > 240) {
    return { ok: false, message: 'Duration must be between 1 and 240 minutes.' };
  }
  return { ok: true, value };
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}
