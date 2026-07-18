[English](README.md) | [简体中文](README.zh-CN.md)

# Codex Multi Launcher

**Codex Multi Launcher (Codex 多开助手)** is a desktop profile manager for running multiple isolated Codex / ChatGPT windows on macOS and Windows. Each profile can use a separate ChatGPT account, API key, Base URL, model, app data directory, and selected conversation history.

[![Latest release](https://img.shields.io/github/v/release/JqyModi/codex-multi-launcher?display_name=tag)](https://github.com/JqyModi/codex-multi-launcher/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/JqyModi/codex-multi-launcher/total)](https://github.com/JqyModi/codex-multi-launcher/releases)
[![Issues](https://img.shields.io/github/issues/JqyModi/codex-multi-launcher)](https://github.com/JqyModi/codex-multi-launcher/issues)

- [Product website](https://jqymodi.github.io/codex-multi-launcher/)
- [Download the latest release](https://github.com/JqyModi/codex-multi-launcher/releases/latest)
- [User guide](https://jqymodi.github.io/codex-multi-launcher/manual.html)
- [Report an issue](https://github.com/JqyModi/codex-multi-launcher/issues)

![Codex Multi Launcher dashboard](https://raw.githubusercontent.com/JqyModi/codex-multi-launcher/main/user-manual-assets/01-dashboard.png)

## Why

Codex Desktop is easy to use with one account and one configuration. The friction starts when you want to:

- keep work, personal, and provider-specific Codex windows open side by side;
- sign in to different ChatGPT accounts without sharing app state;
- switch between official account login, OpenAI API keys, and Responses-compatible providers;
- preserve selected project or task conversations when creating a new isolated profile;
- avoid repeatedly editing `config.toml`, environment variables, and launch arguments.

Codex Multi Launcher turns those workflows into a guided desktop interface.

## Features

- Create multiple isolated Codex / ChatGPT desktop profiles.
- Use ChatGPT account login or an API-key-based provider per profile.
- Configure a separate API key, Base URL, model, and provider name.
- Sync selected project conversations, temporary task conversations, or both.
- Import history from the source app and from existing launcher profiles.
- Keep `CODEX_HOME` and `--user-data-dir` isolated for every profile.
- Generate launchers that can be opened directly from the app.
- Check for updates and install supported releases from inside the app.
- Encrypt API keys locally and exclude them from diagnostics.
- Preserve Codex global state, project lists, and conversation history across restarts.

## Platform Support

| Platform | Packages | Distribution status |
| --- | --- | --- |
| macOS Apple Silicon | arm64 and universal | Developer ID signed and notarized |
| macOS Intel | x64 and universal | Developer ID signed and notarized |
| Windows x64 | installer and portable | Available; currently unsigned |

Download packages from the [latest release](https://github.com/JqyModi/codex-multi-launcher/releases/latest).

## Authentication Modes

### ChatGPT account

Creates an isolated app window where you can sign in with a ChatGPT account. This mode does not require a Base URL or API key and does not overwrite the account session used by another profile.

### API key

Supports the official OpenAI API and third-party endpoints that implement the Responses API. Compatibility depends on the provider's actual API behavior; a Chat Completions-only endpoint may not work with Codex Desktop.

## Conversation History Sync

When creating a profile, you can choose:

- project conversations only;
- temporary task conversations only;
- all supported conversations;
- one or more source profiles.

The copied history becomes part of the new isolated profile. Later conversations stay independent.

## Local Development

```bash
npm install
npm run dev
```

Run validation:

```bash
npm run typecheck
npm run verify:e2e
```

Build packages:

```bash
npm run package:mac:arm64
npm run package:win:x64
```

Artifacts are written to `dist-app/`.

## Documentation

- [Product requirements](docs/PRD.md)
- [Technical specification](docs/TECH_SPEC.md)
- [Configuration schema](docs/CONFIG_SCHEMA.md)
- [Provider compatibility](docs/PROVIDER_COMPATIBILITY.md)
- [Conversation history migration](docs/session-history-migration.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)

## Security and Privacy

- API keys are stored in a local encrypted file.
- API keys are not written into launch scripts or diagnostics reports.
- ChatGPT account credentials remain managed by the official Codex / ChatGPT app.
- Profiles use separate local app and Codex data directories.

Please do not include API keys, account cookies, or private conversation content in public issues.

## Feedback

Use [GitHub Issues](https://github.com/JqyModi/codex-multi-launcher/issues) for bug reports and feature requests. Helpful reports include the app version, operating system, Codex / ChatGPT version, profile authentication mode, reproduction steps, and diagnostics copied from the app.

## Disclaimer

Codex Multi Launcher is an independent community project. It is not affiliated with, endorsed by, or sponsored by OpenAI. Codex, ChatGPT, and OpenAI are trademarks of their respective owner.
