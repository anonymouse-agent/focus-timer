# Focus Timer — Product Requirements

Status: **CONFIRMED** (character-first revision approved, 2026-10-13)

## Functional requirements

| ID | Requirement |
|---|---|
| FR-001 | On first launch, require selection of an empty or compatible dedicated data folder. Permit later changes for future writes only. |
| FR-002 | Require a single-line task label of 1–200 Unicode characters and a whole-minute duration from 1–240. |
| FR-003 | Support start, pause, resume, confirmed cancel, and confirmed early finish for one unresolved session. |
| FR-004 | Measure running wall-clock time without accumulating UI refresh drift. Sleep and hibernation count; paused time does not. |
| FR-005 | Enable always-on-top for a new profile, provide a clearly labelled pin toggle, and remember later user changes. Normal taskbar minimization remains available. |
| FR-006 | Durably restore every unresolved state after normal exit, crash, or restart. |
| FR-007 | Persist completion review before alerting at expiry; do not write history until the user confirms. |
| FR-008 | Alert once with independently disableable sound and Windows notification. Notification activation shows completion review. |
| FR-009 | Allow an optional multiline Markdown accomplishment or an explicit skip. Autosave drafts. |
| FR-010 | Append a finalized record exactly once by stable session ID, including safe retry behavior. |
| FR-011 | Provide an Open data folder action. |
| FR-012 | Permit no more than one unresolved session. |
| FR-013 | Record confirmed early completion distinctly from timer expiry. |
| FR-014 | Offer four bundled original skins—avocado, cat, dog, and tomato—available immediately. Remember selection; each skin integrates the clock into its body and affects presentation only. |
| FR-015 | Warn before closing with unresolved work; preserving state must not be described as guaranteeing an on-time alert after exit. |
| FR-016 | Detect materially contradictory recovery timing evidence and require explicit resolution instead of guessing. |
| FR-017 | Provide settings for sound, notifications, data folder, skin, and pinning. |
| FR-018 | Present `IDLE`, `RUNNING`, and `PAUSED` as a character-first compact interface without a persistent opaque card or conventional title bar. |
| FR-019 | Place duration/countdown and the primary Start/Pause/Resume action inside a defined clock-core region of every skin. |
| FR-020 | Keep secondary controls visually subordinate while making them available through pointer and keyboard interaction. |
| FR-021 | Show setup, completion notes, settings, time conflicts, save failures, and confirmations in an attached expanded panel that returns to compact mode without state loss. |
| FR-022 | Allow the compact character to be dragged, remember its position, and clamp restored bounds to a visible display work area. |
| FR-023 | Give all four skins the same interaction contract and state clarity while allowing different silhouettes, clock-core geometry, and animation. |
| FR-024 | Use a transparent compact window tightly bounded around the character. Pixel-level click-through is optional and may be enabled only if the approved feasibility criteria pass. |
| FR-025 | Keep each character's face unobstructed. During `RUNNING` and `PAUSED`, place the read-only task label inside the body clock core with the countdown, state, and primary action; preserve the full label for assistive technology and hover disclosure when visual truncation is necessary. |
| FR-026 | Use friendly, encouraging expressions in every skin. The focused pose communicates calm engagement rather than anger, criticism, aggression, sadness, or stress; state clarity must not depend on hostile facial cues. |
| FR-027 | Integrate the persistent three-dot trigger into the clock rim. Opening it presents secondary actions in a horizontal shelf above the character without changing the character's screen anchor; closing it restores the tight compact bounds. |
| FR-028 | After any temporary attached workflow—including completion review, note entry, settings, confirmation, or save failure—return the character to its exact prior compact position when compact mode resumes, subject only to display work-area clamping. |

| FR-029 | Show successful command confirmations as brief, non-interactive feedback that dismisses automatically. Give errors additional reading time without allowing either kind of message to block the controls beneath it. |

## Constraints

- Windows 11 x64, one local user, one process.
- Offline at runtime; build-time package downloads are permitted.
- No database. User history is UTF-8 Markdown.
- Task and planned duration become immutable after starting.
- Finalized Markdown records are append-only from the application's perspective.
- Compact-mode dimensions target 320×400 logical pixels. Expanded mode targets 420×600 and may adapt to content, scaling, and the available work area.
- Transparent presentation must not depend on Electron's experimental shaped-window API.

## Non-goals

See `PRODUCT_BRIEF.md`. In particular, skins are bundled choices, not a general theming or downloadable-skin system.

## Requirement traceability

Every FR maps to one or more acceptance criteria in `ACCEPTANCE_TESTS.md`. Architecture choices are intentionally recorded separately in `ARCHITECTURE.md` and `DECISIONS.md`.
