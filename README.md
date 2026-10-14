# Focus Timer — a Pomodoro-style timer for Windows

Focus Timer is a small, open-source desktop timer for focused work. Pick an avocado, tomato, cat, or dog character, name your task, and start a focus session. The character becomes the countdown clock and stays above your other windows while you work.

| Ready | Focusing |
|---|---|
| ![Avocado Pomodoro timer ready to start on Windows](docs/images/focus-timer-idle.png) | ![Avocado focus timer counting down above other Windows apps](docs/images/focus-timer-running.png) |

> This is an early public beta. The timer and Markdown saving work, but I am still testing accessibility, notifications, sleep and wake behavior, and long-running sessions.

## Why I built it

I wanted a Pomodoro timer that stayed visible without turning into a larger productivity system. Tina Huang's Pixel Pomodoro inspired the character-first idea: the character carries the timer instead of sitting beside a separate clock. I also wanted to own the session history, so the app saves completed sessions as ordinary Markdown files.

## Install in a few minutes

You do not need Node.js, Git, a GitHub account, or any programming experience.

1. Open the [Focus Timer releases page](https://github.com/anonymouse-agent/focus-timer/releases).
2. Open the newest release and find **Assets**.
3. Download the file that starts with `Focus-Timer-Setup` and ends with `.exe`.
4. Open the downloaded file and follow the installer. The default options are fine.
5. Start **Focus Timer** from the Start menu or desktop shortcut.

The current beta is not code-signed yet. Windows may show **Windows protected your PC** when you open it. Make sure you downloaded the installer from this repository, then click **More info** and **Run anyway**.

For first-run help, portable setup, and uninstall steps, see [Getting started](GETTING_STARTED.md).

## Features

- Focus sessions from 1 to 240 minutes
- Pause, resume, cancel, and finish early
- Four characters: avocado, cat, dog, and tomato
- An always-on-top mode that starts enabled
- Session recovery after an exit, crash, or restart
- An optional note about what you accomplished
- Daily Markdown files that you can read without the app
- Separate settings for sound and Windows notifications
- No account, ads, analytics, cloud sync, or internet connection

## Start your first focus session

1. Select **Choose data folder**.
2. Create a new folder such as `Documents\Focus Timer Sessions`, then select it.
3. Enter what you want to focus on.
4. Choose the number of minutes and select **Start**.
5. Select the clock to pause or resume.
6. When time is up, add an optional accomplishment note or skip it.

That is all the setup required. Focus Timer remembers the folder and your settings for next time.

Focus Timer saves completed sessions in files such as `2026-10-14.md`. You can open them with Notepad or any other text editor.

## Data and privacy

Your session history stays on your computer. Focus Timer never changes or deletes a session after saving it.

Back up the folder selected during setup. App settings and unfinished-session recovery data are stored under `%LOCALAPPDATA%\FocusTimer`.

If a save fails, leave the `focus-timer:session` markers alone until you retry. Focus Timer stops when it cannot safely write a file instead of risking a duplicate entry.

## Run from source

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

The build goes into `release/` and is not committed to Git. It includes a normal Windows installer and a portable ZIP. Current builds are unsigned, so Windows may show a SmartScreen warning.

## Tests

`npm run verify` runs TypeScript checks, 50 automated tests, and a production build.

I track the remaining Windows checks in [docs/ACCEPTANCE_TESTS.md](docs/ACCEPTANCE_TESTS.md). These cover accessibility, notifications, sleep and wake behavior, performance, network activity, recovery, and an eight-hour test run.

## Project layout

- `src/core` - domain rules, validation, timing, and Markdown formatting
- `src/main` - persistence, filesystem access, timing, and Windows integration
- `src/preload` - restricted Electron IPC bridge
- `src/renderer` - React UI
- `tests` - automated tests
- `docs` - product, behavior, data, architecture, and acceptance specs

## Inspiration

Tina Huang's Pixel Pomodoro demonstration inspired the original idea. I wrote this app from scratch and used original character artwork. Tina Huang is not involved with or affiliated with this project.

## License

Source code and documentation are licensed under the [MIT License](LICENSE).

Character artwork, the app icon, mockups, and screenshots are licensed under [CC BY 4.0](ASSET_LICENSE.md).

Third-party dependencies keep their own licenses.

See the [privacy policy](PRIVACY.md), [security policy](SECURITY.md), and [code-signing policy](docs/CODE_SIGNING_POLICY.md). The current beta is unsigned while the project applies for open-source signing.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please report security issues through the private process in [SECURITY.md](SECURITY.md).
