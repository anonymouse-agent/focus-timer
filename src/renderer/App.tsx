import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import type { SessionState, SkinId } from '../core/types';
import type { AppCommand, PublicSnapshot } from '../shared/ipc';
import { formatRemaining } from '../core/timing';
import { poseForState, SKIN_GEOMETRY, STATUS_TOAST_DURATION_MS, windowModeFor } from './presentation';
import type { CharacterPose, StatusTone } from './presentation';
import avocadoUrl from './assets/skins/avocado-friendly-pixel.png';
import catUrl from './assets/skins/cat-friendly-pixel.png';
import dogUrl from './assets/skins/dog-friendly-pixel.png';
import tomatoUrl from './assets/skins/tomato-friendly-pixel.png';

const SKINS: ReadonlyArray<{ id: SkinId; label: string; url: string }> = [
  { id: 'avocado', label: 'Avocado', url: avocadoUrl },
  { id: 'cat', label: 'Cat', url: catUrl },
  { id: 'dog', label: 'Dog', url: dogUrl },
  { id: 'tomato', label: 'Tomato', url: tomatoUrl },
];

type ConfirmKind = 'cancel' | 'finish' | null;
type StatusToast = { readonly id: number; readonly text: string; readonly tone: StatusTone };

export function App(): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<PublicSnapshot | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);
  const [toast, setToast] = useState<StatusToast | null>(null);
  const [taskLabel, setTaskLabel] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('25');
  const previousStatus = useRef<SessionState['status'] | null>(null);
  const toastSequence = useRef(0);

  useEffect(() => {
    void window.focusTimer.getSnapshot().then(setSnapshot);
    return window.focusTimer.onSnapshot(setSnapshot);
  }, []);

  useEffect(() => window.focusTimer.onPlaySound(playCompletionTone), []);

  useEffect(() => {
    if (toast === null) return;
    const timeout = window.setTimeout(() => {
      setToast((current) => current?.id === toast.id ? null : current);
    }, STATUS_TOAST_DURATION_MS[toast.tone]);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (snapshot === null) return;
    const previous = previousStatus.current;
    if (snapshot.state.status === 'IDLE' && previous !== null && previous !== 'IDLE' && previous !== 'SETUP_REQUIRED') {
      setTaskLabel('');
      setDurationMinutes('25');
    }
    previousStatus.current = snapshot.state.status;
  }, [snapshot?.state.status]);

  const overlayOpen = settingsOpen || confirmKind !== null;
  const baseWindowMode = snapshot === null ? 'compact' : windowModeFor(snapshot.state, overlayOpen);
  const desiredWindowMode = baseWindowMode === 'compact' && menuOpen ? 'controls' : baseWindowMode;

  useEffect(() => {
    void window.focusTimer.setWindowMode(desiredWindowMode);
  }, [desiredWindowMode]);

  useEffect(() => {
    if (baseWindowMode !== 'compact' && menuOpen) setMenuOpen(false);
  }, [baseWindowMode, menuOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Escape') return;
      if (confirmKind !== null) setConfirmKind(null);
      else if (settingsOpen) setSettingsOpen(false);
      else if (menuOpen) setMenuOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmKind, menuOpen, settingsOpen]);

  async function command(value: AppCommand): Promise<void> {
    const response = await window.focusTimer.command(value);
    setSnapshot(response.snapshot);
    const text = response.ok ? response.message ?? null : response.message ?? 'That action could not be completed.';
    setToast(text === null ? null : {
      id: ++toastSequence.current,
      text,
      tone: response.ok ? 'info' : 'error',
    });
  }

  if (snapshot === null) return <main className="loading" aria-busy="true">Waking up…</main>;

  const pose = poseForState(snapshot.state);
  return (
    <main className={`app-shell app-shell--${desiredWindowMode}`}>
      <CharacterShell
        snapshot={snapshot}
        pose={pose}
        taskLabel={taskLabel}
        durationMinutes={durationMinutes}
        menuOpen={menuOpen}
        setTaskLabel={setTaskLabel}
        setDurationMinutes={setDurationMinutes}
        setMenuOpen={setMenuOpen}
        openSettings={() => { setSettingsOpen(true); setMenuOpen(false); }}
        requestConfirm={(kind) => { setConfirmKind(kind); setMenuOpen(false); }}
        command={command}
      />
      <AttachedPanel
        snapshot={snapshot}
        settingsOpen={settingsOpen}
        confirmKind={confirmKind}
        command={command}
        closeSettings={() => setSettingsOpen(false)}
        closeConfirmation={() => setConfirmKind(null)}
      />
      {toast !== null && (
        <p className={`status-toast status-toast--${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
          {toast.text}
        </p>
      )}
    </main>
  );
}

function CharacterShell({ snapshot, pose, taskLabel, durationMinutes, menuOpen, setTaskLabel, setDurationMinutes, setMenuOpen, openSettings, requestConfirm, command }: {
  readonly snapshot: PublicSnapshot;
  readonly pose: CharacterPose;
  readonly taskLabel: string;
  readonly durationMinutes: string;
  readonly menuOpen: boolean;
  readonly setTaskLabel: (value: string) => void;
  readonly setDurationMinutes: (value: string) => void;
  readonly setMenuOpen: (value: boolean) => void;
  readonly openSettings: () => void;
  readonly requestConfirm: (kind: Exclude<ConfirmKind, null>) => void;
  readonly command: (command: AppCommand) => Promise<void>;
}): React.JSX.Element {
  const skin = SKINS.find((candidate) => candidate.id === snapshot.settings.skin) ?? SKINS[0]!;
  const geometry = SKIN_GEOMETRY[skin.id];
  const positions: Record<CharacterPose, string> = { idle: '0% 0%', focus: '100% 0%', paused: '0% 100%', complete: '100% 100%' };
  const style = {
    '--skin-url': `url(${skin.url})`,
    '--skin-position': positions[pose],
    '--core-x': `${geometry.coreXPercent}%`,
    '--core-offset': `${(290 * geometry.coreYPercent) / 100}px`,
    '--core-size': `${geometry.coreSizePixels}px`,
    '--menu-offset-x': `${geometry.coreSizePixels * 0.43}px`,
    '--menu-offset-y': `${geometry.coreSizePixels * 0.3}px`,
  } as CSSProperties;

  function start(event: FormEvent): void {
    event.preventDefault();
    void command({ type: 'start', taskLabel, durationMinutes });
  }

  const active = snapshot.state.status === 'RUNNING' || snapshot.state.status === 'PAUSED';
  const hasTaskTab = snapshot.state.status === 'IDLE';

  return (
    <section className={`character-shell character-shell--${pose} ${hasTaskTab ? 'has-task-tab' : 'no-task-tab'} ${menuOpen ? 'is-menu-open' : ''}`} style={style} aria-label={`${skin.label} focus timer`}>
      {snapshot.state.status === 'IDLE' ? (
        <form className="character-form" onSubmit={start}>
          <label className="task-tab">
            <span className="sr-only">Task label</span>
            <input value={taskLabel} maxLength={200} autoComplete="off" onChange={(event) => setTaskLabel(event.target.value)} placeholder="Name your focus" aria-label="Task label" />
          </label>
          <CharacterArt skin={skin.id} pose={pose} />
          <div className="clock-core clock-core--idle">
            <label className="duration-field">
              <span className="sr-only">Duration in minutes</span>
              <input value={durationMinutes} inputMode="numeric" onChange={(event) => setDurationMinutes(event.target.value)} aria-label="Duration in minutes, 1 to 240" />
            </label>
            <span className="clock-unit">MIN</span>
            <span className="core-divider" />
            <button className="core-action" type="submit">START</button>
          </div>
        </form>
      ) : (
        <>
          <CharacterArt skin={skin.id} pose={pose} />
          <ClockCore snapshot={snapshot} command={command} />
        </>
      )}

      <button type="button" className="menu-trigger no-drag" aria-label={menuOpen ? 'Hide timer controls' : 'Show timer controls'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>•••</button>

      <nav className="orbit-controls no-drag" aria-label="Timer and window controls">
        <button type="button" aria-label="Settings" title="Settings" onClick={openSettings}>⚙</button>
        <button type="button" className="pin-control" aria-label={snapshot.settings.alwaysOnTop ? 'Unpin window' : 'Pin window on top'} aria-pressed={snapshot.settings.alwaysOnTop} title={snapshot.settings.alwaysOnTop ? 'Unpin' : 'Always on top'} onClick={() => void command({ type: 'setAlwaysOnTop', enabled: !snapshot.settings.alwaysOnTop })}>PIN</button>
        {active && <button type="button" aria-label="Finish session early" title="Finish early" onClick={() => requestConfirm('finish')}>✓</button>}
        {active && <button type="button" aria-label="Cancel session" title="Cancel session" onClick={() => requestConfirm('cancel')}>↺</button>}
        <button type="button" aria-label="Minimize" title="Minimize" onClick={() => void window.focusTimer.minimize()}>—</button>
        <button type="button" aria-label="Close Focus Timer" title="Close" onClick={() => void window.focusTimer.requestClose()}>×</button>
      </nav>
    </section>
  );
}

function CharacterArt({ skin, pose }: { readonly skin: SkinId; readonly pose: CharacterPose }): React.JSX.Element {
  return <div className={`character-art character-art--${pose}`} role="img" aria-label={`${skin} timer character, ${pose}`}><span className="drag-surface" aria-hidden="true" /></div>;
}

function ClockCore({ snapshot, command }: { readonly snapshot: PublicSnapshot; readonly command: (command: AppCommand) => Promise<void> }): React.JSX.Element {
  const state = snapshot.state;
  if (state.status === 'RUNNING' || state.status === 'PAUSED') {
    const remaining = snapshot.remainingMilliseconds ?? 0;
    const paused = state.status === 'PAUSED';
    return (
      <button className={`clock-core clock-core--active ${paused ? 'is-paused' : ''}`} type="button" title={state.session.taskLabel} aria-label={`${paused ? 'Resume' : 'Pause'} ${state.session.taskLabel}, ${Math.ceil(remaining / 1000)} seconds remaining`} onClick={() => void command({ type: paused ? 'resume' : 'pause' })}>
        <span className="core-task">{state.session.taskLabel}</span><strong>{formatRemaining(remaining)}</strong><span className="core-state">{paused ? 'PAUSED' : 'FOCUSING'}</span><span className="core-divider" /><em>{paused ? 'RESUME' : 'PAUSE'}</em>
      </button>
    );
  }
  if (state.status === 'TIME_CONFLICT') return <div className="clock-core clock-core--status"><strong>?</strong><span>CHECK TIME</span></div>;
  if (state.status === 'COMPLETION_REVIEW' || state.status === 'NOTE_ENTRY' || state.status === 'SAVE_FAILED') {
    return <div className="clock-core clock-core--status"><strong>✓</strong><span>{state.status === 'SAVE_FAILED' ? 'SAFE' : 'DONE'}</span></div>;
  }
  return <div className="clock-core clock-core--status"><strong>♥</strong><span>HELLO</span></div>;
}

function AttachedPanel({ snapshot, settingsOpen, confirmKind, command, closeSettings, closeConfirmation }: {
  readonly snapshot: PublicSnapshot;
  readonly settingsOpen: boolean;
  readonly confirmKind: ConfirmKind;
  readonly command: (command: AppCommand) => Promise<void>;
  readonly closeSettings: () => void;
  readonly closeConfirmation: () => void;
}): React.JSX.Element | null {
  if (settingsOpen) return <Settings snapshot={snapshot} command={command} close={closeSettings} />;
  if (confirmKind !== null) {
    const cancelling = confirmKind === 'cancel';
    return (
      <Panel labelledBy="confirm-heading">
        <p className="eyebrow">PLEASE CONFIRM</p><h1 id="confirm-heading">{cancelling ? 'Cancel this session?' : 'Finish early?'}</h1>
        <p>{cancelling ? 'No history entry will be written.' : 'Your focused time will be saved as an early finish.'}</p>
        <div className="panel-actions">
          <button className="button" type="button" autoFocus onClick={closeConfirmation}>Keep focusing</button>
          <button className="button button--danger" type="button" onClick={async () => { await command({ type: cancelling ? 'cancel' : 'finishEarly', confirmed: true }); closeConfirmation(); }}>{cancelling ? 'Cancel session' : 'Finish early'}</button>
        </div>
      </Panel>
    );
  }

  const state = snapshot.state;
  switch (state.status) {
    case 'SETUP_REQUIRED':
      return <Panel labelledBy="setup-heading"><p className="eyebrow">YOUR NOTES, YOUR FOLDER</p><h1 id="setup-heading">Set up Focus Timer</h1><p>{state.reason}</p><button className="button button--primary" type="button" autoFocus onClick={() => void command({ type: 'chooseDataFolder' })}>Choose data folder</button><small>Choose an empty folder. Nothing is uploaded.</small></Panel>;
    case 'TIME_CONFLICT':
      return <Panel labelledBy="conflict-heading"><p className="eyebrow eyebrow--error">RECOVERY NEEDS YOU</p><h1 id="conflict-heading">The clocks disagree</h1><p>Your computer’s time changed unexpectedly. Focus Timer will not guess.</p><button className="button button--primary" type="button" onClick={() => void command({ type: 'resolveTimeConflict', choice: 'wall_clock' })}>Use elapsed wall time</button><button className="button" type="button" onClick={() => void command({ type: 'resolveTimeConflict', choice: 'pause_verified' })}>Pause at verified progress</button></Panel>;
    case 'COMPLETION_REVIEW':
      return <Panel labelledBy="complete-heading"><p className="eyebrow">{state.completion.outcome === 'timer_elapsed' ? 'TIME IS UP!' : 'FINISHED EARLY'}</p><h1 id="complete-heading">Nice focus.</h1><p className="task-summary">{state.completion.taskLabel}</p><p>{Math.round(state.completion.focusedSeconds / 60)} focused minutes</p><button className="button button--primary" type="button" onClick={() => void command({ type: 'addNote' })}>Add accomplishment</button><button className="button" type="button" onClick={() => void command({ type: 'save', includeDraft: false })}>Skip &amp; save</button></Panel>;
    case 'NOTE_ENTRY': return <NoteForm draft={state.draft} command={command} />;
    case 'SAVE_FAILED':
      return <Panel labelledBy="save-failed-heading"><p className="eyebrow eyebrow--error">SAVE FAILED</p><h1 id="save-failed-heading">Your session is safe.</h1><p>{state.message}</p><button className="button button--primary" type="button" onClick={() => void command({ type: 'save', includeDraft: state.draft !== null })}>Retry save</button><button className="button" type="button" onClick={() => void command({ type: 'discardDraft' })}>Back to review</button></Panel>;
    default: return null;
  }
}

function Panel({ labelledBy, children }: { readonly labelledBy: string; readonly children: React.ReactNode }): React.JSX.Element {
  return <section className="attached-panel no-drag" role="dialog" aria-modal="false" aria-labelledby={labelledBy}><span className="panel-pointer" aria-hidden="true" />{children}</section>;
}

function NoteForm({ draft, command }: { readonly draft: string; readonly command: (command: AppCommand) => Promise<void> }): React.JSX.Element {
  const [value, setValue] = useState(draft);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);
  function update(next: string): void {
    setValue(next);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void command({ type: 'updateDraft', draft: next }), 450);
  }
  return (
    <Panel labelledBy="note-heading"><p className="eyebrow">ONE LAST THING</p><h1 id="note-heading">What did you accomplish?</h1><label htmlFor="note">Optional Markdown note</label><textarea id="note" rows={5} value={value} autoFocus onChange={(event) => update(event.target.value)} placeholder="A small win is still a win…" /><button className="button button--primary" type="button" onClick={async () => { if (timer.current !== null) window.clearTimeout(timer.current); await command({ type: 'updateDraft', draft: value }); await command({ type: 'save', includeDraft: true }); }}>Save session</button><button className="button" type="button" onClick={() => void command({ type: 'discardDraft' })}>Back</button></Panel>
  );
}

function Settings({ snapshot, command, close }: { readonly snapshot: PublicSnapshot; readonly command: (command: AppCommand) => Promise<void>; readonly close: () => void }): React.JSX.Element {
  return (
    <section className="attached-panel settings no-drag" role="dialog" aria-modal="false" aria-labelledby="settings-heading">
      <span className="panel-pointer" aria-hidden="true" />
      <div className="settings-heading"><div><p className="eyebrow">MAKE IT YOURS</p><h1 id="settings-heading">Settings</h1></div><button className="panel-close" type="button" aria-label="Close settings" onClick={close}>×</button></div>
      <fieldset><legend>Timer character</legend><div className="skin-grid">{SKINS.map((skin) => <button className={`skin-choice ${snapshot.settings.skin === skin.id ? 'is-selected' : ''}`} type="button" key={skin.id} aria-pressed={snapshot.settings.skin === skin.id} onClick={() => void command({ type: 'setSkin', skin: skin.id })}><span className="skin-thumb" style={{ '--skin-url': `url(${skin.url})` } as CSSProperties} />{skin.label}</button>)}</div></fieldset>
      <label className="toggle"><input type="checkbox" checked={snapshot.settings.soundEnabled} onChange={(event) => void command({ type: 'setSound', enabled: event.target.checked })} /> Sound</label>
      <label className="toggle"><input type="checkbox" checked={snapshot.settings.notificationsEnabled} onChange={(event) => void command({ type: 'setNotifications', enabled: event.target.checked })} /> Windows notification</label>
      <label className="toggle"><input type="checkbox" checked={snapshot.settings.alwaysOnTop} onChange={(event) => void command({ type: 'setAlwaysOnTop', enabled: event.target.checked })} /> Always on top</label>
      <div className="folder-actions"><button className="button" type="button" onClick={() => void command({ type: 'chooseDataFolder' })}>Change data folder</button><button className="button" type="button" disabled={snapshot.settings.dataFolder === null} onClick={() => void command({ type: 'openDataFolder' })}>Open data folder</button></div>
      <p className="privacy-note">Offline • no account • no telemetry<br />Version {snapshot.version}</p>
    </section>
  );
}

function playCompletionTone(): void {
  const AudioContextClass = window.AudioContext;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(660, context.currentTime);
  oscillator.frequency.setValueAtTime(880, context.currentTime + 0.16);
  gain.gain.setValueAtTime(0.08, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.42);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.42);
  oscillator.addEventListener('ended', () => void context.close());
}
