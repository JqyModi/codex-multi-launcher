# Codex 多开助手

MVP planning workspace for a desktop app that creates and manages isolated Codex App windows with separate provider profiles.

## MVP Decisions

- Platform: macOS only.
- Primary goal: solve Codex desktop multi-instance and third-party API key configuration.
- API provider support: official OpenAI API key and third-party OpenAI-compatible Responses API.
- Unsupported in MVP: Chat Completions-only providers.
- Secret storage: local encrypted file for fast validation.
- Launcher location: `~/Applications/Codex Profiles/` by default, with user-selectable custom location.
- Generated launchers must set both `CODEX_HOME` and `--user-data-dir`.

## Product Naming

Current user-facing Chinese name: **Codex 多开助手**.

Reasoning:

- `多开` directly names the main pain point for Chinese users.
- `助手` lowers the perceived technical barrier compared with `Profile Manager`.
- English-facing copy can still use `Codex Launcher` or `Codex Profile Manager` in technical documentation.

## Local Packaging

Build a local macOS package:

```bash
npm run package:mac
```

Artifacts are written to `dist-app/`. Unsigned local builds are useful for MVP validation, but macOS may block them on another machine until the user removes quarantine or the app is signed and notarized.

For a quick teammate share, send the generated zip from `dist-app/`. If macOS blocks the app after unzip, the recipient can run:

```bash
xattr -dr com.apple.quarantine "/Applications/Codex 多开助手.app"
```

This is only a local MVP workaround. Public distribution should use Developer ID signing and notarization.

## Documents

- [PRD](docs/PRD.md): product scope, user stories, success criteria, and risks.
- [Technical Specification](docs/TECH_SPEC.md): Codex profile isolation, launcher generation, provider config, secrets, diagnostics.
- [Configuration Schema](docs/CONFIG_SCHEMA.md): profile registry, encrypted secrets, generated Codex config.
- [User Flow](docs/USER_FLOW.md): setup wizard, provider test, dashboard, edit/delete flows.
- [Design System](docs/DESIGN_SYSTEM.md): macOS utility visual direction, layout, colors, typography, and components.
- [User Manual](docs/USER_MANUAL.md): screenshot-based guide for installing, creating profiles, configuring providers, and troubleshooting.
- [Landing Page](docs/landing/index.html): static GitHub Pages-ready product page for public MVP distribution.
- [Release Checklist](docs/RELEASE_CHECKLIST.md): checks before publishing a test build and collecting feedback.

## Suggested Implementation Order

1. Create Electron + React + TypeScript project scaffold.
2. Implement environment detection for Codex App and writable directories.
3. Implement profile registry read/write.
4. Implement encrypted local secret storage.
5. Implement Codex `config.toml` generation and backup.
6. Implement launcher app generation.
7. Implement provider compatibility test.
8. Implement setup wizard.
9. Implement dashboard and process status detection.
10. Package an unsigned local MVP build.
