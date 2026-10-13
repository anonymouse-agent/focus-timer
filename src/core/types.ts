export const APP_SCHEMA_VERSION = 1 as const;

export type SkinId = 'avocado' | 'cat' | 'dog' | 'tomato';
export type CompletionOutcome = 'timer_elapsed' | 'finished_early';
export type RecoveryProvenance =
  | 'none'
  | 'same_boot_monotonic'
  | 'reboot_utc'
  | 'user_resolved';

export interface Settings {
  readonly schemaVersion: 1;
  readonly dataFolder: string | null;
  readonly skin: SkinId;
  readonly soundEnabled: boolean;
  readonly notificationsEnabled: boolean;
  readonly alwaysOnTop: boolean;
  readonly windowPosition: { readonly x: number; readonly y: number } | null;
}

export const DEFAULT_SETTINGS: Settings = {
  schemaVersion: APP_SCHEMA_VERSION,
  dataFolder: null,
  skin: 'avocado',
  soundEnabled: true,
  notificationsEnabled: true,
  alwaysOnTop: true,
  windowPosition: null,
};

export interface Session {
  readonly id: string;
  readonly taskLabel: string;
  readonly plannedSeconds: number;
  readonly startedAtUtc: string;
  readonly startedAtLocal: string;
  readonly localStartDate: string;
  readonly focusedMilliseconds: number;
  readonly pausedMilliseconds: number;
  readonly segmentStartedAtUtc: string;
  readonly segmentStartedMonotonicMilliseconds: number;
  readonly utcDeadline: string;
  readonly pauseStartedAtUtc: string | null;
  readonly recoveryProvenance: RecoveryProvenance;
}

export interface Completion {
  readonly sessionId: string;
  readonly taskLabel: string;
  readonly plannedSeconds: number;
  readonly focusedSeconds: number;
  readonly pausedSeconds: number;
  readonly startedAtUtc: string;
  readonly startedAtLocal: string;
  readonly localStartDate: string;
  readonly endedAtUtc: string;
  readonly endedAtLocal: string;
  readonly outcome: CompletionOutcome;
  readonly recoveryProvenance: RecoveryProvenance;
}

export interface SetupRequiredState {
  readonly status: 'SETUP_REQUIRED';
  readonly reason: string;
}

export interface IdleState {
  readonly status: 'IDLE';
}

export interface RunningState {
  readonly status: 'RUNNING';
  readonly session: Session;
}

export interface PausedState {
  readonly status: 'PAUSED';
  readonly session: Session;
}

export interface TimeConflictState {
  readonly status: 'TIME_CONFLICT';
  readonly session: Session;
  readonly wallElapsedMilliseconds: number;
  readonly monotonicElapsedMilliseconds: number;
}

export interface CompletionReviewState {
  readonly status: 'COMPLETION_REVIEW';
  readonly completion: Completion;
  readonly soundAttempted: boolean;
  readonly notificationAttempted: boolean;
}

export interface NoteEntryState {
  readonly status: 'NOTE_ENTRY';
  readonly completion: Completion;
  readonly draft: string;
}

export interface SaveFailedState {
  readonly status: 'SAVE_FAILED';
  readonly completion: Completion;
  readonly draft: string | null;
  readonly message: string;
}

export type SessionState =
  | SetupRequiredState
  | IdleState
  | RunningState
  | PausedState
  | TimeConflictState
  | CompletionReviewState
  | NoteEntryState
  | SaveFailedState;

export interface RecoveryEnvelope {
  readonly schemaVersion: 1;
  readonly state: Exclude<SessionState, IdleState | SetupRequiredState>;
  readonly lastObservedUtc: string;
  readonly lastObservedMonotonicMilliseconds: number;
  readonly bootTimeUtc: string;
}

export interface SessionRecord extends Completion {
  readonly confirmedAtLocal: string;
  readonly accomplishment: string | null;
  readonly appVersion: string;
}

export type DomainFailureCode =
  | 'INVALID_STATE'
  | 'INVALID_LABEL'
  | 'INVALID_DURATION'
  | 'INVALID_CLOCK';

export interface DomainFailure {
  readonly ok: false;
  readonly code: DomainFailureCode;
  readonly message: string;
}

export interface DomainSuccess {
  readonly ok: true;
  readonly state: SessionState;
}

export type DomainResult = DomainSuccess | DomainFailure;
