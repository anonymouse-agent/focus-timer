# Focus Timer

Focus Timer is a small Windows focus timer. The character is the clock, not decoration around a separate timer window.

| Ready | Focusing |
|---|---|
| ![Focus Timer ready to start](docs/images/focus-timer-idle.png) | ![Focus Timer running](docs/images/focus-timer-running.png) |

> Status: public beta. The core timer and local Markdown storage work, but the Windows release still needs manual accessibility, notification, sleep/wake, and soak testing.

## Install in a few minutes

You do not need Node.js, Git, a GitHub account, or any programming experience.

1. Open the [Focus Timer releases page](https://github.com/anonymouse-agent/focus-timer/releases).
2. Open the newest release and find **Assets**.
3. Download the file that starts with `Focus-Timer-Setup` and ends with `.exe`.
4. Open the downloaded file and follow the installer. The default options are fine.
5. Start **Focus Timer** from the Start menu or desktop shortcut.

The current beta is not code-signed yet. If Windows shows **Windows protected your PC**, first confirm that the download came from this GitHub repository. Then select **More info** followed by **Run anyway**.

For first-run help, portable setup, and uninstall steps, see [Getting started](GETTING_STARTED.md).

## Features

- Named focus sessions from 1 to 240 minutes
- Pause, resume, cancel, and finish early
- Avocado, cat, dog, and tomato characters
- Always-on-top mode, enabled by default
- Recovery after an exit, crash, or restart
- Optional accomplishment notes
- Append-only daily Markdown files
- Independent sound and Windows notification settings
- No account, sync, telemetry, or runtime network access

## Start your first focus session

1. Select **Choose data folder**.
2. Create a new folder such as `Documents\Focus Timer Sessions`, then select it.
3. Enter what you want to focus on.
4. Choose the number of minutes and select **Start**.
5. Select the clock to pause or resume.
6. When time is up, add an optional accomplishment note or skip it.

That is all the setup required. Focus Timer remembers the folder and your settings for next time.

Completed sessions are saved in files such as `2026-10-14.md`. They are normal Markdown files that can be opened with Notepad or any text editor.

## Data and privacy

Session history belongs to the user. Focus Timer never edits or deletes a finalized session record.

Back up the folder selected during setup. App settings and unfinished-session recovery data are stored under `%LOCALAPPDATA%\FocusTimer`.

Do not edit `focus-timer:session` markers while a failed save is waiting to be retried. The app blocks uncertain writes instead of risking a duplicate record.

## Development

Requirements:

- Windows 11 x64
- Node.js 24 or later
- npm 11 or later

```powershell
npm ci
npm run verify
npm run dev
```

## Build for Windows

```powershell
npm run package:win
```

Build output is written to `release/` and is not committed to Git. It includes an assisted current-user installer and a portable ZIP. Current builds are unsigned, so Windows may show a SmartScreen warning.

## Tests

`npm run verify` runs TypeScript checks, 50 automated tests, and a production build.

Manual Windows checks are tracked in [docs/ACCEPTANCE_TESTS.md](docs/ACCEPTANCE_TESTS.md). They include accessibility, notifications, sleep/wake behavior, performance, network tracing, recovery testing, and an eight-hour soak.

## Project layout

- `src/core` - domain rules, validation, timing, and Markdown formatting
- `src/main` - persistence, filesystem access, timing, and Windows integration
- `src/preload` - restricted Electron IPC bridge
- `src/renderer` - React UI
- `tests` - automated tests
- `docs` - product, behavior, data, architecture, and acceptance specs

## Inspiration

The compact workflow was inspired by Tina Huang's Pixel Pomodoro demonstration. Focus Timer is an independent implementation with original code and original character artwork. It is not affiliated with or endorsed by Tina Huang.

## License

Source code and documentation are licensed under the [MIT License](LICENSE).

Character artwork, the app icon, mockups, and screenshots are licensed under [CC BY 4.0](ASSET_LICENSE.md).

Third-party dependencies keep their own licenses.

See the [privacy policy](PRIVACY.md), [security policy](SECURITY.md), and [code-signing policy](docs/CODE_SIGNING_POLICY.md). The current beta is unsigned while the project applies for open-source signing.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please report security issues through the private process in [SECURITY.md](SECURITY.md).
