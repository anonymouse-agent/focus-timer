import { describe, expect, it } from 'vitest';
import { reconcileRecovery, runningTiming } from '../src/core/timing';
import type { Session } from '../src/core/types';

const session: Session = {
  id: '11111111-1111-4111-8111-111111111111', taskLabel: 'Test', plannedSeconds: 60,
  startedAtUtc: '2026-10-13T00:00:00.000Z', startedAtLocal: '2026-10-13T05:30:00.000+05:30', localStartDate: '2026-10-13',
  focusedMilliseconds: 10_000, pausedMilliseconds: 0, segmentStartedAtUtc: '2026-10-13T00:00:10.000Z',
  segmentStartedMonotonicMilliseconds: 1_000, utcDeadline: '2026-10-13T00:01:00.000Z', pauseStartedAtUtc: null,
  recoveryProvenance: 'none',
};

describe('timing arithmetic', () => {
  it('derives time from the anchor rather than tick count', () => {
    expect(runningTiming(session, 21_000)).toEqual({ elapsedMilliseconds: 30_000, remainingMilliseconds: 30_000, expired: false });
    expect(runningTiming(session, 51_000).expired).toBe(true);
  });

  it('uses consistent same-boot monotonic evidence', () => {
    expect(reconcileRecovery(
      session,
      { utc: '2026-10-13T00:00:15.000Z', monotonicMilliseconds: 6_000 },
      { utc: '2026-10-13T00:00:30.000Z', monotonicMilliseconds: 21_000 },
      false,
    )).toEqual({ kind: 'same_boot', elapsedMilliseconds: 20_000 });
  });

  it('uses UTC after evident reboot', () => {
    expect(reconcileRecovery(
      session,
      { utc: '2026-10-13T00:00:15.000Z', monotonicMilliseconds: 6_000 },
      { utc: '2026-10-13T00:00:30.000Z', monotonicMilliseconds: 200 },
      true,
    )).toEqual({ kind: 'reboot', elapsedMilliseconds: 20_000 });
  });

  it('surfaces contradictory clocks', () => {
    expect(reconcileRecovery(
      session,
      { utc: '2026-10-13T00:00:15.000Z', monotonicMilliseconds: 6_000 },
      { utc: '2026-10-13T00:01:30.000Z', monotonicMilliseconds: 21_000 },
      false,
    ).kind).toBe('conflict');
  });
});
