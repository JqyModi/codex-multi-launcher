English | [中文](README.zh-CN.md)

# Codex Multi Launcher

Codex Multi Launcher is the public landing-page repository for **Codex 多开助手**, a cross-platform utility that creates isolated Codex desktop profiles. Each profile can use its own API key, Base URL, model, and launcher app.

This repository is used for:

- publishing the product landing page and user manual;
- collecting early user feedback through GitHub Issues;
- distributing macOS and Windows test builds through GitHub Releases.

## Live Links

- Product page: <https://jqymodi.github.io/codex-multi-launcher/>
- User manual: <https://jqymodi.github.io/codex-multi-launcher/manual.html>
- Feedback: <https://github.com/JqyModi/codex-multi-launcher/issues>
- Latest release: <https://github.com/JqyModi/codex-multi-launcher/releases/latest>

## What It Does

- Creates isolated `CODEX_HOME` and `user-data-dir` paths.
- Generates double-clickable Codex launcher apps.
- Supports official OpenAI API keys and third-party Responses-compatible APIs.
- Tries to load model IDs from the provider `/models` endpoint.
- Keeps manual model input available when `/models` is unavailable.
- Stores API keys in a local encrypted file.
- Excludes API keys from diagnostics reports.

Provider compatibility note:

- The MVP expects an OpenAI/Responses-compatible endpoint, usually with a Base URL ending in `/v1`.
- Providers that only expose native APIs or Chat Completions-only routes may not work reliably with Codex Desktop.
- Zhipu, DeepSeek, Qwen/Tongyi, Kimi, OpenRouter, and self-hosted relays should be tested with their OpenAI-compatible endpoint and exact model ID.

## Current Test Scope

The current v0.1.1 test release provides:

- macOS Apple Silicon: `Codex-Multi-Launcher-0.1.1-arm64-mac.zip`
- macOS Intel: `Codex-Multi-Launcher-0.1.1-x64-mac.zip`
- Windows x64: `Codex-Multi-Launcher-0.1.1-x64-windows.zip`

The app is not signed or notarized yet, so macOS may block it on first launch. If that happens, remove quarantine manually:

```bash
xattr -dr com.apple.quarantine "/Applications/Codex 多开助手.app"
```

Windows x64 support is in test. Please report real-machine issues through GitHub Issues with reproduction steps and diagnostics.

## Roadmap

Early feedback has already surfaced two clear directions:

- [Windows support](https://github.com/JqyModi/codex-multi-launcher/issues/2): v0.1.1 includes Windows x64 test support. Follow-up compatibility issues are still tracked here.
- [Multi-account profile isolation](https://github.com/JqyModi/codex-multi-launcher/issues/1): verify whether separate profiles can keep independent Codex account sessions.

## Feedback

Please open a GitHub Issue if you test the app:

<https://github.com/JqyModi/codex-multi-launcher/issues>

Helpful reports include:

- OS version and chip architecture;
- Codex App version;
- whether you use official OpenAI API or a third-party Responses-compatible API;
- whether the Base URL ends with `/v1`;
- the diagnostics report copied from the app;
- reproduction steps and screenshots.

## Thanks

Thank you to the [LinuxDo](https://linux.do/) community for your support.
