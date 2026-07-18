[English](README.md) | [简体中文](README.zh-CN.md)

# Codex Multi Launcher

Run multiple isolated Codex / ChatGPT desktop profiles on macOS and Windows. Each profile can use a separate ChatGPT account, API key, Base URL, model, app data directory, and selected conversation history.

[![Latest release](https://img.shields.io/github/v/release/JqyModi/codex-multi-launcher?display_name=tag)](https://github.com/JqyModi/codex-multi-launcher/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/JqyModi/codex-multi-launcher/total)](https://github.com/JqyModi/codex-multi-launcher/releases)
[![Stars](https://img.shields.io/github/stars/JqyModi/codex-multi-launcher)](https://github.com/JqyModi/codex-multi-launcher/stargazers)

- [Product website](https://jqymodi.github.io/codex-multi-launcher/)
- [Download](https://github.com/JqyModi/codex-multi-launcher/releases/latest)
- [User guide](https://jqymodi.github.io/codex-multi-launcher/manual.html)
- [Report an issue](https://github.com/JqyModi/codex-multi-launcher/issues)

<p align="center">
  <img alt="Codex Multi Launcher dashboard" src="https://raw.githubusercontent.com/JqyModi/codex-multi-launcher/main/user-manual-assets/01-dashboard.png" width="980">
</p>

## What It Solves

- Run work, personal, and provider-specific Codex windows side by side.
- Sign in to different ChatGPT accounts with isolated app state.
- Switch between account login, OpenAI API keys, and Responses-compatible providers.
- Copy selected project or temporary-task conversations into a new profile.
- Avoid manual `config.toml`, environment variable, and launch-argument changes.

## Current Features

- Isolated `CODEX_HOME` and `--user-data-dir` for every profile.
- ChatGPT account login and API-key authentication modes.
- Separate API key, Base URL, model, and provider settings.
- Conversation history sync from the source app or existing profiles.
- Project-only, temporary-task-only, or full supported history scope.
- In-app update checks and installation.
- Local encrypted API-key storage and redacted diagnostics.
- macOS arm64, x64, and universal packages signed and notarized.
- Windows x64 installer and portable packages.

## Download

Use the [latest release page](https://github.com/JqyModi/codex-multi-launcher/releases/latest) to select the correct package:

| Platform | Package |
| --- | --- |
| Apple Silicon Mac | arm64 or universal macOS zip |
| Intel Mac | x64 or universal macOS zip |
| Windows x64 | installer or portable executable |

Windows builds are currently unsigned. macOS builds use Developer ID signing and Apple notarization.

## Useful Guides

- [Multiple ChatGPT accounts](https://jqymodi.github.io/codex-multi-launcher/features/multiple-accounts/)
- [Conversation history sync](https://jqymodi.github.io/codex-multi-launcher/features/session-sync/)
- [Windows installation and troubleshooting](https://jqymodi.github.io/codex-multi-launcher/guides/windows/)
- [Custom Base URL and API providers](https://jqymodi.github.io/codex-multi-launcher/guides/custom-base-url/)

## Feedback

Open a [GitHub Issue](https://github.com/JqyModi/codex-multi-launcher/issues) with the app version, operating system, Codex / ChatGPT version, authentication mode, reproduction steps, and diagnostics copied from the app.

Do not include API keys, account cookies, or private conversation content.

## Disclaimer

Codex Multi Launcher is an independent community project. It is not affiliated with, endorsed by, or sponsored by OpenAI.
