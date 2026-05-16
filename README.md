English | [中文](README.zh-CN.md)

# Codex Multi Launcher

Codex Multi Launcher is a macOS desktop utility for creating and managing isolated Codex App profiles. Each profile can have its own API key, Base URL, model, `CODEX_HOME`, and `--user-data-dir`, so different Codex windows can run side by side without sharing provider configuration.

Product page: <https://jqymodi.github.io/codex-multi-launcher/>

## Why

Codex App works well for a single account or a single API configuration. The friction starts when you need to:

- use different API keys for different projects;
- switch between official OpenAI and third-party Responses-compatible providers;
- test proxy or relay services with different Base URLs;
- keep multiple Codex desktop windows open for different repositories.

This project turns that workflow into a small graphical app instead of a set of manual config edits and command-line launch commands.

## Features

- Create multiple isolated Codex profiles.
- Configure API key, Base URL, model, and provider name per profile.
- Support third-party OpenAI Responses-compatible APIs.
- Try loading available models from the provider `/models` endpoint.
- Generate a double-clickable launcher app for each profile.
- Keep API keys encrypted locally and out of diagnostics reports.
- Back up generated Codex `config.toml` before rewriting provider settings.
- Restore or permanently delete removed profiles from the UI.

## Current Status

This is an MVP test build.

- Primary platform: macOS Apple Silicon.
- Current provider target: OpenAI API and third-party Responses-compatible APIs.
- Not supported in MVP: Chat Completions-only providers.
- Distribution status: unsigned local build. macOS may show security warnings on first launch.

## Download

Download the latest test build from:

<https://github.com/JqyModi/codex-multi-launcher/releases/latest>

If macOS blocks the app after unzip, you can remove quarantine manually:

```bash
xattr -dr com.apple.quarantine "/Applications/Codex 多开助手.app"
```

This is only for the current unsigned MVP build. Public distribution should use Developer ID signing and notarization.

## Local Development

Install dependencies and run the app locally:

```bash
npm install
npm run start
```

Build a local macOS package:

```bash
npm run package:mac
```

Artifacts are written to `dist-app/`.

## Documentation

- [PRD](docs/PRD.md): product scope, user stories, success criteria, and risks.
- [Technical Specification](docs/TECH_SPEC.md): Codex profile isolation, launcher generation, provider config, secrets, diagnostics.
- [Configuration Schema](docs/CONFIG_SCHEMA.md): profile registry, encrypted secrets, and generated Codex config.
- [User Flow](docs/USER_FLOW.md): setup wizard, provider test, dashboard, edit/delete flows.
- [Design System](docs/DESIGN_SYSTEM.md): macOS utility visual direction, layout, colors, typography, and components.
- [User Manual](docs/USER_MANUAL.md): screenshot-based guide for installing, creating profiles, configuring providers, and troubleshooting.
- [Landing Page](docs/landing/index.html): static GitHub Pages-ready product page for public MVP distribution.
- [Release Checklist](docs/RELEASE_CHECKLIST.md): checks before publishing a test build and collecting feedback.

## Feedback

Please use GitHub Issues for bug reports and feature requests:

<https://github.com/JqyModi/codex-multi-launcher/issues>

Helpful feedback includes:

- macOS version;
- Codex App version;
- provider type: official OpenAI, self-hosted proxy, or third-party compatible API;
- whether the Base URL ends with `/v1`;
- whether profile creation and launcher opening succeeded;
- the exact error message or confusing step.

## Thanks

Thank you to the [LinuxDo](https://linux.do/) community for your support.

