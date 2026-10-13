import { describe, expect, it } from 'vitest';
import { validateDurationMinutes, validateTaskLabel } from '../src/core/validation';

describe('task validation', () => {
  it('accepts and trims a Unicode label', () => {
    expect(validateTaskLabel('  深い仕事 🧠  ')).toEqual({ ok: true, value: '深い仕事 🧠' });
  });

  it('counts Unicode code points and accepts boundaries', () => {
    expect(validateTaskLabel('a').ok).toBe(true);
    expect(validateTaskLabel('🍅'.repeat(200)).ok).toBe(true);
    expect(validateTaskLabel('🍅'.repeat(201)).ok).toBe(false);
  });

  it.each(['', '   ', 'line one\nline two', 'line\u2028two'])('rejects invalid label %j', (label) => {
    expect(validateTaskLabel(label).ok).toBe(false);
  });
});

describe('duration validation', () => {
  it.each([1, 240, '025'])('accepts whole-minute value %s', (value) => {
    expect(validateDurationMinutes(value).ok).toBe(true);
  });

  it.each([0, 241, -1, 1.5, '', '1.5', 'abc', '+5'])('rejects invalid value %s', (value) => {
    expect(validateDurationMinutes(value).ok).toBe(false);
  });
});
