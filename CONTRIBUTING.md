# Contributing

Thanks for helping improve Focus Timer.

## Setup

You need Windows 11 x64, Node.js 24 or later, and npm 11 or later.

```powershell
git clone https://github.com/anonymouse-agent/focus-timer.git
Set-Location focus-timer
npm ci
npm run verify
npm run dev
```

## Before opening a pull request

- Run `npm run verify`.
- Add or update tests when behavior changes.
- Keep each pull request focused on one change.
- Include a screenshot for visible UI changes.
- Do not commit generated builds, caches, test profiles, or user data.
- Do not put task names, accomplishment text, local paths, credentials, or signing keys in logs or test fixtures.

## Reliability rules

Changes must preserve these guarantees:

- The main process owns timing and persistence.
- The renderer has no direct Node.js or filesystem access.
- An acknowledged state change is persisted before the UI shows it.
- Final Markdown records are append-only.
- Saving the same session twice cannot create two records.
- Sleep counts while a timer is running. Paused time does not.
- If recovery data or a file write is unclear, show an error and ask the user what to do. Do not guess.

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before changing process boundaries, persistence, timing, or the Markdown format.

## Pull request notes

Explain:

- What changed
- Why it changed
- How it was tested
- Any user-data or recovery risk

Large product or data-format changes should start with a proposal before implementation.
