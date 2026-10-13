# Focus Timer — Behavioral Specification

Status: **CONFIRMED** (Gate B character-first revision approved, 2026-10-13)

## Durable states

| State | Meaning | Allowed user actions |
|---|---|---|
| `SETUP_REQUIRED` | No valid data folder is configured. | Select folder, open settings |
| `IDLE` | Ready for new input. | Edit label/duration, choose skin, start, settings |
| `RUNNING` | Time is accruing. | Pause, finish early, cancel, pin, minimize |
| `PAUSED` | Time is frozen. | Resume, finish early, cancel, pin, minimize |
| `TIME_CONFLICT` | Recovery evidence is materially inconsistent. | Use wall-clock evidence, restore paused at last verified progress |
| `COMPLETION_REVIEW` | A session ended and awaits a record decision. | Add accomplishment, skip and save |
| `NOTE_ENTRY` | Optional accomplishment is being edited. | Update draft, save, return to review |
| `SAVE_FAILED` | Markdown finalization failed visibly. | Retry, return to review, open/settings |

`IDLE` is persisted as the absence of an unresolved session. Every other acknowledged transition is persisted before the UI publishes it.

## Presentation modes

Window presentation is derived from durable state and is not a new domain state:

| Presentation | Durable states / activity | Rule |
|---|---|---|
| `COMPACT_CHARACTER` | `IDLE`, `RUNNING`, `PAUSED` | Show the timer-character without a persistent card or conventional title bar. |
| `CONTROLS_SHELF` | Secondary controls opened over a compact state | Expand upward and show a horizontal action shelf while preserving the compact character's bottom-center screen anchor. This is ephemeral UI state. |
| `ATTACHED_PANEL` | Setup, confirmation prompts, `COMPLETION_REVIEW`, `NOTE_ENTRY`, `TIME_CONFLICT`, `SAVE_FAILED`, settings | Resize the same window and attach a panel to the character. Preserve the durable state while the panel opens or closes. |

Closing an attached panel returns to the appropriate compact state when the underlying workflow permits it. Required or unresolved workflows cannot be dismissed into an ambiguous compact view.

## Commands and transitions

- `Start`: `IDLE → RUNNING`; validate input, assign UUID, capture local/UTC start and monotonic anchor.
- `Pause`: `RUNNING → PAUSED`; accrue focused seconds from the authoritative clock.
- `Resume`: `PAUSED → RUNNING`; begin a new running segment and accrue paused seconds.
- `Cancel`: `RUNNING|PAUSED → IDLE` only after confirmation; no history record.
- `FinishEarly`: `RUNNING|PAUSED → COMPLETION_REVIEW` only after confirmation, with outcome `finished_early`.
- `Expire`: `RUNNING → COMPLETION_REVIEW` with outcome `timer_elapsed`. Persist this transition before sound or notification.
- `ConfirmCompletion`: `COMPLETION_REVIEW → NOTE_ENTRY`.
- `UpdateDraft`: update `NOTE_ENTRY` and persist after at most 500 ms of inactivity.
- `Save`: finalize Markdown from `NOTE_ENTRY` or skip directly from `COMPLETION_REVIEW`; success clears recovery state and enters `IDLE`.
- `Discard`: `NOTE_ENTRY → COMPLETION_REVIEW`; discard only the draft, never the session.
- `ResolveTimeConflict`: either accrue credible UTC wall time and continue/complete, or freeze at the last verified progress in `PAUSED`.

Invalid commands return typed failures and never mutate state.

## Timing rules

1. Remaining time is derived from a monotonic start anchor plus accumulated focused seconds; interval ticks are repaint prompts only.
2. The main process is authoritative. The renderer never decrements durable time.
3. Sleep and hibernation count as running time. Electron power-resume events trigger immediate reconciliation.
4. While paused, focused time is unchanged and paused time accrues from UTC timestamps.
5. On recovery, compare persisted monotonic and UTC evidence. If monotonic evidence clearly represents the same boot, prefer it. After evident reboot, use UTC.
6. If usable sources disagree by more than five seconds without an evident reboot or clock adjustment explanation, enter `TIME_CONFLICT`.
7. At expiry, clamp focused time to the planned duration for `timer_elapsed`; an early finish stores actual focused time.

## Close and alert behavior

- Closing with unresolved work prompts: keep running, exit and preserve, or cancel closing.
- Closing while idle exits immediately.
- A normal minimized window keeps running.
- Expiry produces at most one sound attempt and one notification attempt per session. Neither steals focus.
- Clicking the notification restores and activates the completion-review window.

## Skin behavior

- All four skins are available from first launch and selectable at any time.
- The character is the compact application surface. It is never presented as decoration above or beside a separate timer card.
- Every skin defines a clock-core region containing duration/countdown and the primary Start/Pause/Resume action.
- The editable one-line task label is attached immediately above the idle character. After Start, that external tab is removed and the read-only task label moves into the clock core above the countdown. It may clamp to two visual lines without truncating stored text, its accessible name, or its hover disclosure.
- Clock-core geometry stays below the character's face in every state; the expression remains the dominant identity cue rather than being covered by timer UI.
- A subtle three-dot affordance is integrated into the clock rim. Activating it or moving keyboard focus into the secondary action group opens a horizontal shelf above the character; the character remains fixed on screen.
- Noninteractive character regions are draggable. Clock-core and secondary controls are not drag regions.
- Each has idle, focusing, paused, and completed visual treatment.
- Idle and focused expressions are friendly and encouraging. The focused pose uses props, posture, and subtle motion to communicate concentration rather than angry eyebrows or a frown. The paused pose may look restful but not distressed.
- Focusing uses subtle low-frame-rate motion; reduced-motion disables it.
- Skin changes are settings changes, not session events, and never appear in Markdown.

## Compact input and control behavior

- In `IDLE`, the clock core shows whole minutes and Start. Activating the minutes opens an inline numeric editor constrained by FR-002.
- In `RUNNING`, the clock core shows the task label, `MM:SS`, `FOCUSING`, and Pause. Space invokes Pause when the clock core has focus.
- In `PAUSED`, the same core shows the task label, `MM:SS`, an explicit `PAUSED` label, and Resume. Paused state is not communicated by color or pose alone.
- Escape closes a dismissible attached panel. It never silently cancels, discards, or finalizes a session.
- Tab and Shift+Tab reach the task label, clock core, menu affordance, and all revealed secondary actions.
- Pointer-only hover is never required to discover or invoke an essential action.
- Entering any temporary expanded mode records the compact bounds. Returning to compact mode restores those bounds exactly unless they must be clamped after a display change.
- A new profile starts pinned above other windows. The horizontal shelf labels the toggle `PIN`; changing it is persisted and respected on later launches.
