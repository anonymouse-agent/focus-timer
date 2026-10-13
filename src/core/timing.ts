import type { Session } from './types';

export interface ClockEvidence {
  readonly utc: string;
  readonly monotonicMilliseconds: number;
}

export interface TimingSnapshot {
  readonly elapsedMilliseconds: number;
  readonly remainingMilliseconds: number;
  readonly expired: boolean;
}

export type RecoveryDecision =
  | { readonly kind: 'same_boot'; readonly elapsedMilliseconds: number }
  | { readonly kind: 'reboot'; readonly elapsedMilliseconds: number }
  | {
      readonly kind: 'conflict';
      readonly wallElapsedMilliseconds: number;
      readonly monotonicElapsedMilliseconds: number;
    };

const MAX_CLOCK_DISAGREEMENT_MS = 5_000;

export function runningTiming(session: Session, nowMonotonicMilliseconds: number): TimingSnapshot {
  const segmentElapsed = Math.max(0, nowMonotonicMilliseconds - session.segmentStartedMonotonicMilliseconds);
  const elapsedMilliseconds = session.focusedMilliseconds + segmentElapsed;
  const plannedMilliseconds = session.plannedSeconds * 1_000;
  return {
    elapsedMilliseconds,
    remainingMilliseconds: Math.max(0, plannedMilliseconds - elapsedMilliseconds),
    expired: elapsedMilliseconds >= plannedMilliseconds,
  };
}

export function reconcileRecovery(
  session: Session,
  persisted: ClockEvidence,
  current: ClockEvidence,
  rebootEvident: boolean,
): RecoveryDecision {
  const wallElapsed = Date.parse(current.utc) - Date.parse(session.segmentStartedAtUtc);
  const monotonicElapsed = current.monotonicMilliseconds - session.segmentStartedMonotonicMilliseconds;
  if (!Number.isFinite(wallElapsed) || wallElapsed < 0) {
    return {
      kind: 'conflict',
      wallElapsedMilliseconds: wallElapsed,
      monotonicElapsedMilliseconds: monotonicElapsed,
    };
  }
  if (rebootEvident || current.monotonicMilliseconds < persisted.monotonicMilliseconds) {
    return { kind: 'reboot', elapsedMilliseconds: wallElapsed };
  }
  if (monotonicElapsed < 0 || Math.abs(wallElapsed - monotonicElapsed) > MAX_CLOCK_DISAGREEMENT_MS) {
    return {
      kind: 'conflict',
      wallElapsedMilliseconds: wallElapsed,
      monotonicElapsedMilliseconds: monotonicElapsed,
    };
  }
  return { kind: 'same_boot', elapsedMilliseconds: monotonicElapsed };
}

export function formatRemaining(milliseconds: number): string {
  const totalSeconds = Math.ceil(Math.max(0, milliseconds) / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
