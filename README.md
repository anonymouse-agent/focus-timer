# Focus Timer

A compact, local-first Windows focus timer where the pixel character is the clock. Focus Timer is inspired by the simplicity of Tina Huang's Pixel Pomodoro demonstration, but uses original artwork and a reliability-focused implementation.

## What works

- 1–240 minute named sessions
- Pause, resume, confirmed cancellation, and confirmed early finish
- Authoritative main-process timing that counts Windows sleep while running
- Recovery after exit, crash, or reboot, including visible clock-conflict resolution
- Optional accomplishment notes and append-only daily Markdown
- Exactly-once record retry using stable UUID markers
- Transparent, character-first desktop interface with the clock embedded in the character
- Avocado, cat, dog, and tomato timer skins
- Contextual controls and attached panels instead of a persistent application card
- Independent sound and Windows notification settings
- Remembered always-on-top mode and single-instance activation
- Fully offline runtime with a sandboxed renderer

## Development

Requirements: Windows 11 x64, Node.js 24+, npm 11+.

```powershell
npm install
npm run verify
npm run dev
```

The first launch asks for an empty dedicated folder. That folder contains `.focus-timer-folder.json` and daily `YYYY-MM-DD.md` files. Internal recovery and settings use `%LOCALAPPDATA%\FocusTimer`.

## Build

```powershell
npm run package:win
```

Artifacts are written to `release/`. The initial package is unsigned, so Windows may show a reputation warning. It includes no updater and makes no runtime network requests.

## Backups and ownership

Back up the selected data folder with any file-copy tool you trust. Finalized records are ordinary UTF-8 Markdown and do not require Focus Timer to read them. The app never edits or deletes a finalized session section.

Do not manually alter a session's `focus-timer:session` markers while a save is being retried. Partial or duplicated matching markers intentionally stop automatic append so data cannot be silently duplicated.

## Verification status

Forty-three automated domain, timing, Markdown, filesystem-contract, presentation, settings-migration, typecheck, production-build, and Electron startup checks are included. Manual Windows accessibility, notification activation, resource profiling, runtime network tracing, crash injection, and the eight-hour soak remain release-candidate gates; see [`docs/ACCEPTANCE_TESTS.md`](docs/ACCEPTANCE_TESTS.md).

## Security note

The renderer has no Node.js or filesystem access. All privileged commands pass through a narrow preload bridge and are validated again in the main process. No remote content is loaded. Dependency audit findings and release limitations are recorded in [`docs/RELEASE_NOTES.md`](docs/RELEASE_NOTES.md).
