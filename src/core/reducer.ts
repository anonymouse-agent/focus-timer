import type {
  Completion,
  DomainFailure,
  DomainResult,
  RecoveryProvenance,
  Session,
  SessionState,
} from './types';
import { validateDurationMinutes, validateTaskLabel } from './validation';

export type DomainCommand =
  | {
      readonly type: 'Start';
      readonly id: string;
      readonly taskLabel: string;
      readonly durationMinutes: number;
      readonly nowUtc: string;
      readonly nowLocal: string;
      readonly localDate: string;
      readonly nowMonotonicMilliseconds: number;
    }
  | { readonly type: 'Pause'; readonly nowUtc: string; readonly nowMonotonicMilliseconds: number }
  | { readonly type: 'Resume'; readonly nowUtc: string; readonly nowMonotonicMilliseconds: number }
  | { readonly type: 'Cancel' }
  | {
      readonly type: 'FinishEarly' | 'Expire';
      readonly nowUtc: string;
      readonly nowLocal: string;
      readonly nowMonotonicMilliseconds: number;
    }
  | { readonly type: 'ConfirmCompletion' }
  | { readonly type: 'UpdateDraft'; readonly draft: string }
  | { readonly type: 'Discard' }
  | { readonly type: 'MarkAlertsAttempted'; readonly sound: boolean; readonly notification: boolean }
  | { readonly type: 'SaveFailed'; readonly message: string }
  | {
      readonly type: 'ResolveTimeConflict';
      readonly choice: 'wall_clock' | 'pause_verified';
      readonly nowUtc: string;
      readonly nowLocal: string;
      readonly nowMonotonicMilliseconds: number;
    };

function failure(message: string): DomainFailure {
  return { ok: false, code: 'INVALID_STATE', message };
}

function complete(
  session: Session,
  outcome: 'timer_elapsed' | 'finished_early',
  nowUtc: string,
  nowLocal: string,
  nowMonotonicMilliseconds: number,
): Completion {
  const segmentElapsed = Math.max(0, nowMonotonicMilliseconds - session.segmentStartedMonotonicMilliseconds);
  const actualFocused = session.focusedMilliseconds + (session.pauseStartedAtUtc === null ? segmentElapsed : 0);
  const currentPause = session.pauseStartedAtUtc === null
    ? 0
    : Math.max(0, Date.parse(nowUtc) - Date.parse(session.pauseStartedAtUtc));
  const focusedMilliseconds = outcome === 'timer_elapsed'
    ? session.plannedSeconds * 1_000
    : Math.min(session.plannedSeconds * 1_000, actualFocused);
  return {
    sessionId: session.id,
    taskLabel: session.taskLabel,
    plannedSeconds: session.plannedSeconds,
    focusedSeconds: Math.max(0, Math.round(focusedMilliseconds / 1_000)),
    pausedSeconds: Math.max(0, Math.round((session.pausedMilliseconds + currentPause) / 1_000)),
    startedAtUtc: session.startedAtUtc,
    startedAtLocal: session.startedAtLocal,
    localStartDate: session.localStartDate,
    endedAtUtc: nowUtc,
    endedAtLocal: nowLocal,
    outcome,
    recoveryProvenance: session.recoveryProvenance,
  };
}

export function reduce(state: SessionState, command: DomainCommand): DomainResult {
  switch (command.type) {
    case 'Start': {
      if (state.status !== 'IDLE') return failure('A session is already unresolved.');
      const label = validateTaskLabel(command.taskLabel);
      if (!label.ok || label.value === undefined) {
        return { ok: false, code: 'INVALID_LABEL', message: label.message ?? 'Invalid task label.' };
      }
      const duration = validateDurationMinutes(command.durationMinutes);
      if (!duration.ok || duration.value === undefined) {
        return { ok: false, code: 'INVALID_DURATION', message: duration.message ?? 'Invalid duration.' };
      }
      const plannedSeconds = duration.value * 60;
      const session: Session = {
        id: command.id,
        taskLabel: label.value,
        plannedSeconds,
        startedAtUtc: command.nowUtc,
        startedAtLocal: command.nowLocal,
        localStartDate: command.localDate,
        focusedMilliseconds: 0,
        pausedMilliseconds: 0,
        segmentStartedAtUtc: command.nowUtc,
        segmentStartedMonotonicMilliseconds: command.nowMonotonicMilliseconds,
        utcDeadline: new Date(Date.parse(command.nowUtc) + plannedSeconds * 1_000).toISOString(),
        pauseStartedAtUtc: null,
        recoveryProvenance: 'none',
      };
      return { ok: true, state: { status: 'RUNNING', session } };
    }
    case 'Pause': {
      if (state.status !== 'RUNNING') return failure('Only a running session can be paused.');
      const elapsed = Math.max(0, command.nowMonotonicMilliseconds - state.session.segmentStartedMonotonicMilliseconds);
      return {
        ok: true,
        state: {
          status: 'PAUSED',
          session: {
            ...state.session,
            focusedMilliseconds: state.session.focusedMilliseconds + elapsed,
            pauseStartedAtUtc: command.nowUtc,
          },
        },
      };
    }
    case 'Resume': {
      if (state.status !== 'PAUSED') return failure('Only a paused session can be resumed.');
      const pauseStarted = state.session.pauseStartedAtUtc;
      if (pauseStarted === null) return { ok: false, code: 'INVALID_CLOCK', message: 'Pause timestamp is missing.' };
      const paused = Math.max(0, Date.parse(command.nowUtc) - Date.parse(pauseStarted));
      return {
        ok: true,
        state: {
          status: 'RUNNING',
          session: {
            ...state.session,
            pausedMilliseconds: state.session.pausedMilliseconds + paused,
            pauseStartedAtUtc: null,
            segmentStartedAtUtc: command.nowUtc,
            segmentStartedMonotonicMilliseconds: command.nowMonotonicMilliseconds,
            utcDeadline: new Date(
              Date.parse(command.nowUtc) +
                Math.max(0, state.session.plannedSeconds * 1_000 - state.session.focusedMilliseconds),
            ).toISOString(),
          },
        },
      };
    }
    case 'Cancel':
      return state.status === 'RUNNING' || state.status === 'PAUSED'
        ? { ok: true, state: { status: 'IDLE' } }
        : failure('Only an active session can be cancelled.');
    case 'FinishEarly':
    case 'Expire': {
      if (state.status !== 'RUNNING' && state.status !== 'PAUSED') {
        return failure('Only an active session can finish.');
      }
      if (command.type === 'Expire' && state.status !== 'RUNNING') return failure('A paused session cannot expire.');
      const completion = complete(
        state.session,
        command.type === 'Expire' ? 'timer_elapsed' : 'finished_early',
        command.nowUtc,
        command.nowLocal,
        command.nowMonotonicMilliseconds,
      );
      return {
        ok: true,
        state: {
          status: 'COMPLETION_REVIEW',
          completion,
          soundAttempted: false,
          notificationAttempted: false,
        },
      };
    }
    case 'ConfirmCompletion':
      return state.status === 'COMPLETION_REVIEW'
        ? { ok: true, state: { status: 'NOTE_ENTRY', completion: state.completion, draft: '' } }
        : failure('Completion review is not active.');
    case 'UpdateDraft':
      return state.status === 'NOTE_ENTRY'
        ? { ok: true, state: { ...state, draft: command.draft } }
        : failure('No accomplishment draft is active.');
    case 'Discard':
      return state.status === 'NOTE_ENTRY' || state.status === 'SAVE_FAILED'
        ? {
            ok: true,
            state: {
              status: 'COMPLETION_REVIEW',
              completion: state.completion,
              soundAttempted: true,
              notificationAttempted: true,
            },
          }
        : failure('There is no draft to discard.');
    case 'MarkAlertsAttempted':
      return state.status === 'COMPLETION_REVIEW'
        ? {
            ok: true,
            state: {
              ...state,
              soundAttempted: state.soundAttempted || command.sound,
              notificationAttempted: state.notificationAttempted || command.notification,
            },
          }
        : failure('Completion review is not active.');
    case 'SaveFailed': {
      if (state.status !== 'NOTE_ENTRY' && state.status !== 'COMPLETION_REVIEW' && state.status !== 'SAVE_FAILED') {
        return failure('There is no completion to save.');
      }
      const draft = state.status === 'NOTE_ENTRY' ? state.draft : state.status === 'SAVE_FAILED' ? state.draft : null;
      return { ok: true, state: { status: 'SAVE_FAILED', completion: state.completion, draft, message: command.message } };
    }
    case 'ResolveTimeConflict': {
      if (state.status !== 'TIME_CONFLICT') return failure('There is no time conflict to resolve.');
      const chosenElapsed = command.choice === 'wall_clock' ? Math.max(0, state.wallElapsedMilliseconds) : 0;
      const provenance: RecoveryProvenance = 'user_resolved';
      const focusedMilliseconds = state.session.focusedMilliseconds + chosenElapsed;
      const session: Session = {
        ...state.session,
        focusedMilliseconds,
        recoveryProvenance: provenance,
        pauseStartedAtUtc: command.nowUtc,
        segmentStartedAtUtc: command.nowUtc,
        segmentStartedMonotonicMilliseconds: command.nowMonotonicMilliseconds,
      };
      if (command.choice === 'wall_clock' && focusedMilliseconds >= session.plannedSeconds * 1_000) {
        return {
          ok: true,
          state: {
            status: 'COMPLETION_REVIEW',
            completion: complete(session, 'timer_elapsed', command.nowUtc, command.nowLocal, command.nowMonotonicMilliseconds),
            soundAttempted: false,
            notificationAttempted: false,
          },
        };
      }
      return { ok: true, state: { status: 'PAUSED', session } };
    }
  }
}
