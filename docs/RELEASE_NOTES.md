# Focus Timer 0.1.0-beta.1 — Development Candidate

This build implements the MVP but is not yet designated a public release because the manual AC-034–AC-042 release evidence is incomplete.

## Included

- Transparent, character-first Electron/React Windows x64 application where each of four original pixel-art characters contains the live clock and primary action.
- Face-first running layout: a smaller lower-body clock keeps expressions visible and combines the task label, countdown, state, and Pause/Resume action in one place.
- Friendly focused poses across all four skins; the tomato has a smaller, lower clock core so its lower-set face remains unobstructed.
- Compact 320×400 character mode plus a single attached-panel mode for setup, confirmation, completion, settings, conflicts, and save failures.
- Clock-rim three-dot trigger with an upward-expanding horizontal controls shelf, remembered compact anchoring, work-area clamping, high-contrast treatment, and reduced-motion behavior.
- New profiles start pinned above other windows; the toolbar uses an explicit `PIN` label and remembers subsequent user choice.
- Completion, settings, and confirmation panels now return the character to its exact pre-expansion screen position when dismissed or saved.
- Command confirmations such as `Session saved.` now fade and dismiss after 2.4 seconds without blocking the controls beneath them; errors remain visible for 6 seconds.
- Deterministic focus-session reducer and monotonic/UTC timing reconciliation.
- Atomic recovery/settings JSON with one backup.
- User-selected, append-only Markdown v1 history with UUID idempotency.
- Local notification, sound, pinning, settings, close warning, and single-instance behavior.
- Runtime network blocking and sandboxed renderer boundary.
- Assisted current-user Windows installer and portable ZIP, with code and artwork license notices bundled in both.

## Known limitations

- The installer and portable ZIP are unsigned and may trigger Microsoft Defender SmartScreen reputation warnings.
- No automatic updater is included.
- The app cannot deliver an on-time alert after the user exits it; unresolved state is restored next launch.
- External sync tools can contend with Markdown writes; such failures are shown for retry.
- Fully transparent pixels are not click-through in the MVP. The window is tightly bounded to limit invisible interception; experimental shaped-window APIs are intentionally not used.
- Electron's native transparent-window screenshot capture can intermittently omit a composited layer in a single frame; repeated native captures and DOM smoke assertions pass. This has not reproduced as missing content during ordinary displayed use, but remains part of manual visual testing.
- Accessibility, high-contrast, notification activation, suspend/resume, performance, and eight-hour soak checks still require manual evidence on the target Windows machine.
- `npm audit` reports moderate development-only findings in electron-builder's download/proxy dependency chain. No fixed upstream version is currently available; these packages are not shipped as application runtime dependencies.

## Backup guidance

Back up the selected data directory, including `.focus-timer-folder.json` and all daily Markdown files. Recovery JSON under Electron's `userData` directory is temporary operational state and is not a substitute for backing up finalized Markdown.
