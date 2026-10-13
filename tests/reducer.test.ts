import { describe, expect, it } from 'vitest';
import { reduce } from '../src/core/reducer';
import type { DomainResult, SessionState } from '../src/core/types';

const idle: SessionState = { status: 'IDLE' };

function start(): Extract<SessionState, { status: 'RUNNING' }> {
  const result = reduce(idle, {
    type: 'Start',
    id: '11111111-1111-4111-8111-111111111111',
    taskLabel: 'Write tests',
    durationMinutes: 25,
    nowUtc: '2026-10-13T04:00:00.000Z',
    nowLocal: '2026-10-13T09:30:00.000+05:30',
    localDate: '2026-10-13',
    nowMonotonicMilliseconds: 10_000,
  });
  if (!result.ok || result.state.status !== 'RUNNING') throw new Error('fixture failed');
  return result.state;
}

describe('domain reducer', () => {
  it('starts, pauses, resumes, and expires without tick drift', () => {
    const running = start();
    const paused = reduce(running, { type: 'Pause', nowUtc: '2026-10-13T04:10:00.000Z', nowMonotonicMilliseconds: 610_000 });
    expect(paused.ok && paused.state.status === 'PAUSED' && paused.state.session.focusedMilliseconds).toBe(600_000);
    if (!paused.ok || paused.state.status !== 'PAUSED') return;

    const resumed = reduce(paused.state, { type: 'Resume', nowUtc: '2026-10-13T04:15:00.000Z', nowMonotonicMilliseconds: 910_000 });
    expect(resumed.ok && resumed.state.status === 'RUNNING' && resumed.state.session.pausedMilliseconds).toBe(300_000);
    if (!resumed.ok || resumed.state.status !== 'RUNNING') return;

    const completed = reduce(resumed.state, {
      type: 'Expire',
      nowUtc: '2026-10-13T04:30:00.000Z',
      nowLocal: '2026-10-13T10:00:00.000+05:30',
      nowMonotonicMilliseconds: 1_810_000,
    });
    expect(completed.ok && completed.state.status === 'COMPLETION_REVIEW' && completed.state.completion).toMatchObject({
      outcome: 'timer_elapsed', focusedSeconds: 1500, pausedSeconds: 300,
    });
  });

  it('records an early finish while paused including current pause time', () => {
    const running = start();
    const paused = reduce(running, { type: 'Pause', nowUtc: '2026-10-13T04:05:00.000Z', nowMonotonicMilliseconds: 310_000 });
    if (!paused.ok) throw new Error('pause failed');
    const completed = reduce(paused.state, {
      type: 'FinishEarly',
      nowUtc: '2026-10-13T04:07:00.000Z',
      nowLocal: '2026-10-13T09:37:00.000+05:30',
      nowMonotonicMilliseconds: 430_000,
    });
    expect(completed.ok && completed.state.status === 'COMPLETION_REVIEW' && completed.state.completion).toMatchObject({
      outcome: 'finished_early', focusedSeconds: 300, pausedSeconds: 120,
    });
  });

  it('rejects invalid transitions without changing state', () => {
    const result = reduce(idle, { type: 'Pause', nowUtc: '2026-10-13T04:00:00.000Z', nowMonotonicMilliseconds: 1 });
    expect(result).toMatchObject({ ok: false, code: 'INVALID_STATE' });
    expect(idle).toEqual({ status: 'IDLE' });
  });

  it('discards only a draft and returns to review', () => {
    const completed = reduce(start(), {
      type: 'FinishEarly', nowUtc: '2026-10-13T04:02:00.000Z', nowLocal: '2026-10-13T09:32:00.000+05:30', nowMonotonicMilliseconds: 130_000,
    });
    if (!completed.ok) throw new Error('complete failed');
    const note = reduce(completed.state, { type: 'ConfirmCompletion' });
    if (!note.ok) throw new Error('note failed');
    const edited = reduce(note.state, { type: 'UpdateDraft', draft: 'Done.' });
    if (!edited.ok) throw new Error('edit failed');
    const discarded = reduce(edited.state, { type: 'Discard' });
    expect(discarded.ok && discarded.state.status).toBe('COMPLETION_REVIEW');
  });

  it('resolves an expired wall-clock conflict into timer completion', () => {
    const running = start();
    const conflicted: SessionState = {
      status: 'TIME_CONFLICT', session: running.session,
      wallElapsedMilliseconds: 1_600_000, monotonicElapsedMilliseconds: 40_000,
    };
    const result = reduce(conflicted, {
      type: 'ResolveTimeConflict', choice: 'wall_clock',
      nowUtc: '2026-10-13T04:30:00.000Z', nowLocal: '2026-10-13T10:00:00.000+05:30',
      nowMonotonicMilliseconds: 50_000,
    });
    expect(result.ok && result.state.status === 'COMPLETION_REVIEW' && result.state.completion.outcome).toBe('timer_elapsed');
  });

  it('preserves invariants across 10,000 deterministic transitions', () => {
    let state: SessionState = idle;
    let seed = 123456789;
    let utc = Date.parse('2026-10-13T04:00:00.000Z');
    let monotonic = 10_000;
    for (let index = 0; index < 10_000; index += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const choice = seed % 5;
      utc += 1_000 + (seed % 8_000);
      monotonic += 1_000 + (seed % 8_000);
      if (state.status === 'IDLE') {
        const result = reduce(state, {
          type: 'Start', id: `11111111-1111-4111-8111-${String(index).padStart(12, '0')}`,
          taskLabel: `Task ${index}`, durationMinutes: 1 + (choice % 4),
          nowUtc: new Date(utc).toISOString(), nowLocal: new Date(utc).toISOString().replace('Z', '+00:00'),
          localDate: '2026-10-13', nowMonotonicMilliseconds: monotonic,
        });
        if (result.ok) state = result.state;
      } else if (state.status === 'RUNNING') {
        const command = choice < 2
          ? { type: 'Pause' as const, nowUtc: new Date(utc).toISOString(), nowMonotonicMilliseconds: monotonic }
          : choice === 2
            ? { type: 'Cancel' as const }
            : { type: 'FinishEarly' as const, nowUtc: new Date(utc).toISOString(), nowLocal: new Date(utc).toISOString().replace('Z', '+00:00'), nowMonotonicMilliseconds: monotonic };
        const result = reduce(state, command);
        if (result.ok) state = result.state;
      } else if (state.status === 'PAUSED') {
        const result: DomainResult = choice < 3
          ? reduce(state, { type: 'Resume', nowUtc: new Date(utc).toISOString(), nowMonotonicMilliseconds: monotonic })
          : reduce(state, { type: 'Cancel' });
        if (result.ok) state = result.state;
      } else if (state.status === 'COMPLETION_REVIEW') {
        const result = reduce(state, { type: 'ConfirmCompletion' });
        if (result.ok) state = result.state;
      } else if (state.status === 'NOTE_ENTRY') {
        if (choice === 0) state = idle;
        else {
          const result = reduce(state, { type: 'UpdateDraft', draft: `Progress ${index}` });
          if (result.ok) state = result.state;
        }
      }
      if (state.status === 'RUNNING' || state.status === 'PAUSED' || state.status === 'TIME_CONFLICT') {
        expect(state.session.focusedMilliseconds).toBeGreaterThanOrEqual(0);
        expect(state.session.pausedMilliseconds).toBeGreaterThanOrEqual(0);
        expect(state.session.plannedSeconds).toBeGreaterThan(0);
      }
    }
  });
});
