# Focus Timer — Architecture

Status: **CONFIRMED** (Gate C character-first revision approved, 2026-10-13)

## Technology

- Electron 44, TypeScript 5.9, React 19, Vite 7 through electron-vite.
- Vitest for deterministic domain and contract tests.
- electron-builder for Windows x64 directory and ZIP artifacts.
- No database, dependency-injection framework, state framework, background process, native extension, telemetry, updater, or runtime network service.

Versions are exact-pinned in `package.json`/lockfile and may be updated only with verification.

## Runtime boundaries

```text
React renderer (presentation; no Node APIs)
        ↕ typed, validated IPC
Preload contextBridge (minimal capability surface)
        ↕
Electron main process (authority)
  ├─ deterministic domain reducer
  ├─ timing/recovery coordinator
  ├─ atomic JSON persistence
  ├─ append-only Markdown store
  └─ windows, dialogs, notifications, sound request, diagnostics
```

The main process owns all durable state and timing. It persists a proposed transition before publishing it. The renderer receives immutable snapshots and sends commands; it cannot read arbitrary files or invoke arbitrary IPC.

## Modules

- `src/core`: domain types, validation, reducer, timing arithmetic, Markdown serialization. No Electron, React, filesystem, or ambient clock access.
- `src/main`: Electron composition, clocks, coordinator, recovery/settings stores, Markdown filesystem adapter, notifications, activation, diagnostics.
- `src/preload`: narrow typed API through `contextBridge`.
- `src/renderer`: React views, local form state, accessibility behavior, pixel-art presentation.
- `src/shared`: serialized IPC contracts shared without privileged implementations.

## Character-window architecture

The application keeps one BrowserWindow and three presentation modes:

- `COMPACT_CHARACTER`: approximately 320×400 logical pixels, frameless, transparent, fixed-size, and tightly bounded around the character.
- `CONTROLS_SHELF`: 320×452 logical pixels, expanded upward from the compact bottom-center anchor, with the same character coordinates plus a horizontal utility shelf.
- `ATTACHED_PANEL`: approximately 420×600 logical pixels, adjusted to content and the current work area, with a panel visually attached to the character.

The renderer maps existing durable domain states and ephemeral UI activity to a presentation mode. Window mode is not persisted as a session state; on restore it is derived deterministically from the durable state and current workflow. Window position is a user setting and is persisted separately. Before leaving compact mode, the main process records its exact bounds; temporary modes are calculated from that anchor and compact restoration uses the anchor rather than the expanded window's clamped coordinates.

Proposed renderer components:

- `CharacterShell`: transparent layout, drag regions, state pose, and panel attachment.
- `ClockCore`: semantic idle duration/Start control; during a session it also owns the read-only task label, countdown, explicit state, and Pause/Resume action.
- `TaskTab`: compact one-line task entry shown only in idle.
- `OrbitControls`: a horizontal contextual shelf opened by the clock-rim menu affordance or revealed by keyboard focus.
- `AttachedPanel`: setup, editing, confirmations, completion, settings, conflict, and failure content.
- `SkinManifest`: asset references, clock-core geometry, drag exclusions, palette, and state frames for each bundled skin.

The clock and controls remain semantic HTML. Character artwork does not contain authoritative text or hit targets. Production sprites are deliberately low-resolution masters scaled with nearest-neighbor rendering.

The main process owns window bounds, display clamping, pinning, minimize/close behavior, and any pointer-passthrough policy. New window IPC is narrow and validates enumerated mode requests and finite bounds data.

## Transparent-window feasibility constraints

- Electron supports frameless transparent windows, but transparent pixels are not inherently click-through and transparent windows have platform limitations.
- The baseline therefore uses a tightly bounded, non-resizable transparent window without promising per-pixel passthrough.
- A feasibility spike may evaluate dynamic `setIgnoreMouseEvents(..., { forward: true })`; it may ship only if dragging, focus, scaling, and accessibility remain deterministic.
- The MVP does not depend on the experimental `BrowserWindow.setShape` API.
- Development screenshots taken with DevTools are not accepted as transparency evidence because opening DevTools can alter transparent-window behavior.

References:

- [Electron custom window styles](https://www.electronjs.org/docs/latest/tutorial/custom-window-styles)
- [Electron custom window interactions](https://www.electronjs.org/docs/latest/tutorial/custom-window-interactions)
- [Electron BrowserWindow API](https://www.electronjs.org/docs/latest/api/browser-window)

## Timing

`process.hrtime.bigint()` provides the live monotonic source. UTC is captured alongside it. Recovery persists both plus a UTC deadline and system boot evidence. `powerMonitor` suspend/resume events prompt immediate reconciliation. Renderer intervals only request current snapshots and never accumulate elapsed time.

## Durability

Recovery/settings writes use temporary files in the same directory, explicit file sync, backup rotation, and rename/replace. Markdown appends are serialized, scanned by UUID before each attempt, flushed before success, and never rewrite existing content. Failed effects leave the durable session unresolved.

## Security

- `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`.
- Local application content only and CSP `default-src 'self'`.
- Deny navigation, popups, permissions, and unexpected web contents.
- Validate every IPC payload in the main process.
- No shell execution. Open-folder uses Electron's constrained platform API with the configured path.
- Exact dependency versions and lockfile; production ASAR packaging.

## Single instance

Electron's per-user single-instance lock elects the owner. A secondary launch sends activation to the owner and exits. The owner restores, shows, and focuses its window.

## Packaging

The release is unsigned and may trigger Windows reputation warnings. Code signing and an installer are deferred. The ZIP includes usage, backup, and limitation notes plus a separately generated SHA-256 file.
