# Release Checklist

Use this checklist before posting a public MVP build to X, Threads, Linux.do, or GitHub.

## Build

- [ ] Run `npm run verify:e2e`.
- [ ] Run `npm run package:mac`.
- [ ] Confirm `dist-app/Codex 多开助手-<version>-arm64-mac.zip` exists.
- [ ] Launch the packaged app locally.
- [ ] Create a test Profile with a disposable API Key.
- [ ] Confirm generated launcher opens Codex without the login screen.

## Landing Page

- [ ] Replace landing page placeholder GitHub release URL.
- [ ] Replace landing page placeholder GitHub Issues URL.
- [ ] Replace `.github/ISSUE_TEMPLATE/config.yml` user manual URL.
- [ ] Confirm screenshots are current app-window captures.
- [ ] Confirm `docs/landing/manual.html` opens from the landing page.
- [ ] Publish GitHub Pages.

## Release Notes

- [ ] State supported platform: macOS Apple Silicon.
- [ ] State API scope: official OpenAI API Key and third-party Responses-compatible providers.
- [ ] State unsigned-app limitation and quarantine command.
- [ ] Include SHA256 checksum for the zip.
- [ ] Link to user manual.
- [ ] Link to GitHub Issues feedback template.

## Safety

- [ ] Confirm no API Key appears in screenshots.
- [ ] Confirm no real Base URL or private path appears in screenshots.
- [ ] Confirm diagnostics report excludes API Key.
- [ ] Recommend users test with a low-quota or disposable key first.

## Feedback Template

Ask users to include:

- macOS version.
- Mac chip: Apple Silicon or Intel.
- Codex App version.
- Provider name.
- Whether Base URL ends with `/v1`.
- Model name.
- Provider test error.
- Copied diagnostics report.
