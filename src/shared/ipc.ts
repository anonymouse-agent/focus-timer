import type { SessionState, Settings, SkinId } from '../core/types';

export interface PublicSnapshot {
  readonly state: SessionState;
  readonly settings: Settings;
  readonly remainingMilliseconds: number | null;
  readonly version: string;
}

export type AppCommand =
  | { readonly type: 'chooseDataFolder' }
  | { readonly type: 'start'; readonly taskLabel: string; readonly durationMinutes: string }
  | { readonly type: 'pause' }
  | { readonly type: 'resume' }
  | { readonly type: 'cancel'; readonly confirmed: true }
  | { readonly type: 'finishEarly'; readonly confirmed: true }
  | { readonly type: 'addNote' }
  | { readonly type: 'updateDraft'; readonly draft: string }
  | { readonly type: 'save'; readonly includeDraft: boolean }
  | { readonly type: 'discardDraft' }
  | { readonly type: 'resolveTimeConflict'; readonly choice: 'wall_clock' | 'pause_verified' }
  | { readonly type: 'setSkin'; readonly skin: SkinId }
  | { readonly type: 'setSound'; readonly enabled: boolean }
  | { readonly type: 'setNotifications'; readonly enabled: boolean }
  | { readonly type: 'setAlwaysOnTop'; readonly enabled: boolean }
  | { readonly type: 'openDataFolder' };

export interface CommandResponse {
  readonly ok: boolean;
  readonly snapshot: PublicSnapshot;
  readonly message?: string;
}

export type WindowMode = 'compact' | 'controls' | 'attached';

export interface FocusTimerApi {
  getSnapshot(): Promise<PublicSnapshot>;
  command(command: AppCommand): Promise<CommandResponse>;
  minimize(): Promise<void>;
  requestClose(): Promise<void>;
  setWindowMode(mode: WindowMode): Promise<void>;
  onSnapshot(listener: (snapshot: PublicSnapshot) => void): () => void;
  onPlaySound(listener: () => void): () => void;
}

export const IPC = {
  getSnapshot: 'focus:get-snapshot',
  command: 'focus:command',
  snapshot: 'focus:snapshot',
  minimize: 'focus:minimize',
  close: 'focus:close',
  setWindowMode: 'focus:set-window-mode',
  playSound: 'focus:play-sound',
} as const;
