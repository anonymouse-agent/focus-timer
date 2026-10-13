# Code Signing Policy

Status: **PENDING PROVIDER APPROVAL**

Focus Timer is applying for the SignPath Foundation open-source signing program. Until the application is approved and the release workflow is connected to SignPath, release files are explicitly labelled as unsigned.

Planned service: **Free code signing provided by SignPath.io, certificate by SignPath Foundation.**

## Project and roles

- Repository: [anonymouse-agent/focus-timer](https://github.com/anonymouse-agent/focus-timer)
- Committer and reviewer: [@anonymouse-agent](https://github.com/anonymouse-agent)
- Release approver: [@anonymouse-agent](https://github.com/anonymouse-agent)

Changes from outside contributors require review before they can be merged. Release signing requests require explicit approval from the release approver.

## Release process

1. A release commit must pass the automated test and production-build checks.
2. The package version and release tag must match.
3. Windows artifacts are built from the tagged source in GitHub Actions.
4. Once SignPath approval is active, the trusted build submits the artifacts for release signing.
5. Authenticode signatures are verified before publication.
6. SHA-256 checksums are generated after signing.
7. Release files and checksums are published together on GitHub Releases.

Signing keys must not be stored in the repository, local project files, release archives, or ordinary GitHub Actions secrets. Signing-provider credentials must be scoped to the release workflow and rotated if exposure is suspected.

## Privacy

Focus Timer does not transfer information to other networked systems unless specifically requested by the user or the person installing or operating it. See [PRIVACY.md](../PRIVACY.md) for details.

## Compromise or misuse

If signing credentials or the release pipeline may have been compromised, releases stop until the incident is investigated. Affected credentials and certificates are revoked or rotated where appropriate, and users are notified through the repository security process and release notes.
