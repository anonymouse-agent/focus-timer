# Focus Timer — Implementation Plan

Status: **CONFIRMED** (revised Gates B–D approved and Gate E resumed, 2026-10-13)

## M0 — Specifications and foundation

Create approved documents, exact-pin Electron/React/TypeScript tooling, establish runtime boundaries, and reach a zero-error build/test/typecheck baseline.

## M1 — Domain and timer

Implement types, validation, deterministic reducer, commands, timing/recovery calculations, pause/resume, expiry, cancellation, and early finish. Exit when state and fake-clock acceptance tests pass.

## M2 — Persistence and Markdown

Implement atomic settings/recovery, backup handling, draft debounce, folder protocol, Markdown v1, idempotency, durable append, and typed failures. Exit when golden, filesystem, crash-boundary, Unicode, external-content, and duplicate tests pass.

## M3R — Character-first redesign

The completed domain, timing, recovery, and Markdown work from M0–M2 remains in place. The existing rectangular renderer is a replaceable development candidate, not the target UI.

### M3R.0 — Direction and approval — COMPLETE

- Review the state and four-skin concept boards in `docs/mockups/`.
- Approve the character-as-clock hierarchy, attached-panel model, and acceptance criteria AC-045–AC-064.
- Exit only with explicit revised Gate B–D approval.

### M3R.1 — Electron feasibility spike — IMPLEMENTED; MANUAL MATRIX PENDING

- Prototype a transparent, frameless, fixed-size 320×400 BrowserWindow without changing domain behavior.
- Verify CSS drag/no-drag regions, taskbar minimization, pinning, tight bounds, focus restoration, display clamping, and 100%/150%/200% scaling.
- Evaluate dynamic pointer passthrough as optional. Do not use `BrowserWindow.setShape` as a dependency.
- Record native screenshots with DevTools closed and update the decision log with the observed baseline.

Exit: AC-049 and AC-051–AC-053 have feasibility evidence; any platform limitation has an approved fallback.

### M3R.2 — Semantic character shell — COMPLETE

- Add `CharacterShell`, `ClockCore`, `TaskTab`, `OrbitControls`, and `AttachedPanel` using temporary code-native shapes.
- Derive compact/attached presentation from existing durable state.
- Add validated window-mode and positioning IPC without expanding renderer privilege.
- Preserve the complete AC-001–AC-044 automated baseline.

Exit: all durable states are usable with placeholders and keyboard-only interaction.

### M3R.3 — Four-skin production assets — COMPLETE

- Produce original low-resolution sprite masters and manifests for avocado, cat, dog, and tomato.
- Define clock-core geometry, drag exclusions, state frames, high-contrast treatment, and reduced-motion frames.
- Replace placeholder shapes only after all four assets pass the same interaction contract.

Exit: AC-043–AC-048 and AC-055 pass with approved assets.

### M3R.4 — Attached workflows and accessibility — IMPLEMENTED; MANUAL ACCESSIBILITY REVIEW PENDING

- Move setup, confirmations, completion, note entry, settings, time conflict, and save failure into the attached panel.
- Complete focus management, Narrator semantics, high contrast, reduced motion, and display-edge expansion behavior.

Exit: AC-050 and AC-054 pass, with no regression in recovery or draft persistence.

## M4 — Windows integration

Add native notifications, independent sound, notification activation, power-resume reconciliation, single-instance activation, and bounded diagnostics. Exit when OS integration, recovery, privacy, and single-instance criteria pass.

## M5 — Hardening and release

Run failure injection, performance profiling, accessibility review, network verification, randomized transitions, and real-time soak. Produce a Windows x64 assisted installer and portable ZIP, checksums, usage instructions, backup guidance, known limitations, and an evidence matrix for AC-001–AC-064.

Manual acceptance and the eight-hour soak remain release gates even when the implementation and automated suite are complete. The pre-redesign ZIP is superseded and must not be presented as the character-first release.
