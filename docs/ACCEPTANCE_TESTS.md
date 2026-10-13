# Focus Timer — Acceptance Criteria and Test Strategy

Status: **CONFIRMED** (Gate D character-first revision approved, 2026-10-13)

## Functional acceptance criteria

| ID | Covers | Criterion |
|---|---|---|
| AC-001 | FR-001 | Empty-folder selection creates valid metadata; incompatible non-empty selection is rejected without modification. |
| AC-002 | FR-001 | Folder change leaves old files untouched and routes only future finalizations to the new folder. |
| AC-003 | FR-002 | Labels at Unicode lengths 1 and 200 and durations 1 and 240 pass; values outside fail with actionable messages. |
| AC-004 | FR-002 | Multiline/blank labels, fractions, non-numbers, signs, and unsafe numeric values fail without starting. |
| AC-005 | FR-003 | Start/pause/resume produce legal durable states and focused/paused totals. |
| AC-006 | FR-003 | Cancel and finish early require confirmation; cancel writes no history. |
| AC-007 | FR-004 | Delayed UI ticks do not change calculated expiry. |
| AC-008 | FR-004 | Sleep counts while running and does not count as focused time while paused. |
| AC-009 | FR-005 | Pinning changes always-on-top and survives restart. |
| AC-010 | FR-006 | Each unresolved state restores after clean exit and forced termination. |
| AC-011 | FR-006 | Expired-while-closed session restores into review with correct provenance. |
| AC-012 | FR-007 | Expiry state is durably readable before alert services are called. |
| AC-013 | FR-007 | Expiry alone creates no Markdown session section. |
| AC-014 | FR-008 | Sound and notification toggles act independently, with at most one attempt each. |
| AC-015 | FR-008 | Notification activation opens review without expiry stealing focus. |
| AC-016 | FR-009 | Multiline accomplishment round-trips verbatim and draft persistence occurs within 500 ms. |
| AC-017 | FR-009 | Skip writes the canonical `_Not provided._` representation. |
| AC-018 | FR-010 | Retrying before/after simulated crash creates exactly one complete section for the UUID. |
| AC-019 | FR-011 | Open data folder targets the configured directory or reports an actionable error. |
| AC-020 | FR-012 | Start is rejected whenever unresolved work exists. |
| AC-021 | FR-013 | Early finish stores `finished_early`, planned, focused, and paused seconds accurately. |
| AC-022 | FR-015 | Close warning preserves unresolved state and does not claim background alerting after exit. |
| AC-023 | FR-016 | Contradictory evidence enters `TIME_CONFLICT`; each explicit resolution produces deterministic state. |
| AC-024 | FR-001, FR-010 | Permission, disk-full, path disappearance, contention, and read-only failures remain visible and retryable. |
| AC-025 | FR-010 | Golden files conform to Markdown v1 for ASCII, Unicode, punctuation, multiline notes, and skipped notes. |
| AC-026 | FR-004, FR-010 | Start-date filename remains stable across midnight and time-zone changes. |
| AC-027 | FR-010 | Partial, malformed, or duplicated matching markers block append and identify the affected UUID. |
| AC-028 | FR-010 | Unknown compatible content before an append remains byte-for-byte unchanged. |
| AC-029 | FR-001 | Changing folder during unresolved work affects that record's future save only according to current configured destination and never moves prior files. |
| AC-030 | FR-006 | Corrupt primary state recovers from backup; corrupt primary and backup are preserved and surfaced. |
| AC-031 | FR-004 | Normal-load expiry error is at most one second. |
| AC-032 | FR-004 | Wake reconciliation begins within one second after resume execution. |
| AC-033 | FR-006, FR-009 | Crash boundaries lose no acknowledged transition and at most one second of draft input. |
| AC-034 | All | Cold start ≤2 s and ordinary command feedback ≤100 ms on the reference machine. |
| AC-035 | All | Thirty-minute run averages <1% CPU and ≤300 MB working set. |
| AC-036 | All | Keyboard, Narrator, high contrast, visible focus, reduced motion, and 200% scaling checks pass. |
| AC-037 | All | Runtime trace observes no network attempt. |
| AC-038 | All | App runs unelevated and writes only to documented locations. |
| AC-039 | All | Seven-file/1 MB log bounds hold and logs contain no task or accomplishment samples. |
| AC-040 | FR-012 | Concurrent launch activates the owner and cannot create a second writer. |
| AC-041 | FR-003, FR-004, FR-006, FR-010 | Randomized 10,000-transition clock/failure model preserves invariants. |
| AC-042 | All | Eight-hour real-time soak with sleep/wake and forced recovery records no drift, duplicate, or lost transition. |
| AC-043 | FR-014 | All four original skins are selectable, remembered, bundled locally, and do not modify session data. |
| AC-044 | FR-014 | Each skin clearly expresses idle/focusing/paused/completed; reduced motion disables animation. |
| AC-045 | FR-018 | In `IDLE`, `RUNNING`, and `PAUSED`, no persistent opaque application card or conventional title bar is visible. |
| AC-046 | FR-018 | Character artwork plus its integrated clock occupies at least 85% of the visible nontransparent compact presentation in approved reference captures. |
| AC-047 | FR-019, FR-023 | Every skin places duration/countdown and Start/Pause/Resume within its defined body clock core with identical command semantics. |
| AC-048 | FR-020 | Task, clock core, menu, and every state-applicable secondary action are reachable and operable using keyboard alone; none requires hover. |
| AC-049 | FR-020, FR-022 | Dragging a noninteractive character region moves the window; dragging or activating the task, clock core, or controls never moves it. |
| AC-050 | FR-021 | Each setup, confirmation, completion, settings, conflict, and failure workflow opens in the same BrowserWindow, preserves durable state and draft data, and returns to the appropriate compact view when dismissal is legal. |
| AC-051 | FR-022 | Restored, expanded, DPI-changed, and display-reconfigured bounds leave the character and menu reachable within a visible work area. |
| AC-052 | FR-024 | Compact captures at 100%, 150%, and 200% scaling show no opaque bounding rectangle and no clipped primary control. |
| AC-053 | FR-024 | Transparent-window pointer behavior matches the documented baseline: visible controls are reliable and invisible interception is limited to the tight window bounds. |
| AC-054 | FR-018–FR-024 | Narrator, visible focus, high contrast, and reduced motion work in compact and attached-panel modes without reconstructing a full-window card. |
| AC-055 | FR-014, FR-023 | Approved reference images exist for all four skins and for idle, running, paused, and completed interaction states before production assets replace placeholders. |
| AC-056 | FR-018–FR-024 | The original AC-001–AC-044 automated reliability suite remains passing after the window-shell redesign. |
| AC-057 | FR-017, FR-021 | The attached settings panel exposes skin, sound, notifications, pinning, data-folder change, and Open data folder; each persisted setting restores after restart. |
| AC-058 | FR-025 | Approved idle, running, and paused reference captures for every skin show an unobstructed face; running/paused cores contain the task label, countdown, explicit state, and primary action, while the complete label remains accessible when visually clamped. |
| AC-059 | FR-014, FR-026 | Approved focused-state captures for avocado, cat, dog, and tomato show friendly calm concentration without sharply angry eyebrows, a frown, or distressed expression. |
| AC-060 | FR-020, FR-027 | The compact character has no detached right-side menu gutter. Activating the clock-rim trigger opens a keyboard-operable horizontal shelf above it and closing the shelf restores identical compact bounds without moving the character anchor. |
| AC-061 | FR-022, FR-028 | From a known compact position, completion review and every other attached workflow may expand temporarily; saving or legally closing it restores the exact compact x/y/width/height unless display clamping is required. |
| AC-062 | FR-005 | A new profile starts with always-on-top enabled and a visibly labelled `PIN` control; turning it off or on persists across restart without migration overriding an existing choice. |

| AC-063 | FR-029 | Successful command feedback disappears within three seconds, repeated messages restart that interval, and feedback never intercepts clicks; error feedback remains readable for six seconds. |
| AC-064 | NFR-014 | Packaging produces an x64 assisted current-user installer and a portable ZIP with matching SHA-256 checksums and bundled code/art licenses. A normal install creates working Start menu and desktop shortcuts, launches the app, and uninstalls cleanly without deleting the selected Markdown folder, settings, or unresolved-session recovery state. |
| AC-065 | NFR-019 | A release tag is rejected when its version differs from `package.json`; a matching tag runs tests and packaging from clean source, generates post-package SHA-256 files, and publishes all four files as a GitHub pre-release. Signing remains disabled and visibly documented until provider approval. |

## Automated strategy

- Exhaustive reducer transition tables and deterministic fake clocks.
- Property/randomized command sequences with invariant checks.
- Golden Markdown and JSON contracts.
- Real and injected filesystem failures plus crash-boundary child-process harness.
- React accessibility semantics tests and Electron smoke tests.
- Component tests for presentation-mode derivation, stable focus order, and skin-manifest geometry validation.
- Display-boundary tests using synthetic work areas and DPI transitions.

## Manual/release strategy

- Windows notification activation and independent sound checks.
- Narrator, keyboard-only, high contrast, reduced motion, and 200% scaling review.
- Native-window captures of compact and expanded modes at 100%, 150%, and 200% scaling with DevTools closed.
- Pointer/drag matrix covering character body, clock core, task tab, contextual controls, transparent corners, and attached panels.
- Resource profiling and runtime network tracing.
- Eight-hour Windows soak including suspend/resume and forced process termination.

Release requires recorded evidence for AC-001–AC-065; tests that require real Windows conditions cannot be replaced by unit assertions.

## Evidence snapshot — 2026-10-14

- PASS: TypeScript checks for main, preload, shared core, and renderer.
- PASS: 50 automated tests across validation, reducer behavior, timing/recovery decisions, Markdown serialization/idempotency, folder ownership, atomic state backup, corrupt-primary recovery, Unicode, midnight naming, presentation-mode derivation, compact-anchor window geometry, four-skin geometry (including face-clear core constraints), transient feedback timing, pinned first-launch defaults, settings migration, package configuration, and a deterministic 10,000-transition invariant run.
- PASS: Production main/preload/renderer bundles build and real Electron launches confirm the preload API, mounted React root, character shell, clock core, menu, and contextual-control semantics.
- PASS: Native compact-window captures exist for all four skins plus the running avocado state. Corner pixels have zero alpha; captures are 320×400 logical pixels on the 125% reference display.
- PASS: The approved four-pose artwork is consumed through 512×512 nearest-neighbor production sprite sheets; task, time, state, and control text remain semantic HTML.
- PASS: The packaged `Focus Timer.exe` launches and completes the smoke path with exit code 0.
- PASS: Production dependency audit reports zero known vulnerabilities; full development audit has the documented moderate electron-builder transitive finding without an upstream fix.
- PASS: Static source scan finds no runtime HTTP, fetch, XHR, or WebSocket call sites; Chromium background networking is disabled and non-local requests are blocked at the session layer.
- PASS: Installer and ZIP SHA-256 verification matches their companion checksum files.
- PASS: The assisted installer completes as a current-user install, creates working Start menu and desktop shortcuts, launches the installed app through its smoke path, and uninstalls cleanly. The validation leaves isolated recovery/settings and Markdown-history markers untouched.
- PENDING MANUAL: Windows notification activation, audible alert, Narrator, keyboard traversal, high contrast, reduced motion, 200% scaling, suspend/resume, restricted-folder failure injection, performance profiling, runtime network tracing, forced process crash matrix, and the eight-hour real-time soak.

This evidence applies to the character-first development candidate. Automated portions of AC-045–AC-064 pass. Updated native captures validate the face-first hierarchy, friendly expressions, clock-rim menu trigger, and horizontal controls shelf. Pointer dragging, DPI/display transitions, Narrator, high contrast, reduced motion, and complete keyboard traversal remain manual release evidence rather than being inferred from unit assertions.
