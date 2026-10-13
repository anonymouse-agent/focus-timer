# Security Policy

## Supported versions

Focus Timer is currently a development candidate. Security fixes are applied to the latest release only.

## Report a vulnerability

Do not open a public issue for a security problem.

Use **Report a vulnerability** on the repository's Security tab. Include:

- A short description
- Steps to reproduce the problem
- The affected version
- The possible impact
- A suggested fix, if you have one

Do not include real task names, accomplishment notes, personal paths, credentials, or signing material.

## Security model

Focus Timer is an offline app. It does not need an account and does not intentionally make runtime network requests.

Completed sessions are Markdown files in a folder selected by the user. Settings and unfinished-session recovery data are stored locally in the app's Windows user-data directory.
