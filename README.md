# Codex Profile Manager

MVP planning workspace for a macOS desktop app that creates and manages isolated Codex App profiles.

## MVP Decisions

- Platform: macOS only.
- Primary goal: solve Codex desktop multi-instance and third-party API key configuration.
- API provider support: official OpenAI API key and third-party OpenAI-compatible Responses API.
- Unsupported in MVP: Chat Completions-only providers.
- Secret storage: local encrypted file for fast validation.
- Launcher location: `~/Applications/Codex Profiles/` by default, with user-selectable custom location.
- Generated launchers must set both `CODEX_HOME` and `--user-data-dir`.

## Documents

- [PRD](docs/PRD.md): product scope, user stories, success criteria, and risks.
- [Technical Specification](docs/TECH_SPEC.md): Codex profile isolation, launcher generation, provider config, secrets, diagnostics.
- [Configuration Schema](docs/CONFIG_SCHEMA.md): profile registry, encrypted secrets, generated Codex config.
- [User Flow](docs/USER_FLOW.md): setup wizard, provider test, dashboard, edit/delete flows.
- [Design System](docs/DESIGN_SYSTEM.md): macOS utility visual direction, layout, colors, typography, and components.

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
