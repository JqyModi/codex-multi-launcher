# Codex Profile Manager MVP PRD

## 1. Product Positioning

Codex Profile Manager is a macOS desktop utility for creating and managing multiple isolated Codex App profiles.

The MVP solves two concrete problems:

- Run multiple Codex desktop windows with separate local workspaces.
- Configure third-party OpenAI-compatible Responses API providers without asking users to edit shell scripts or TOML files manually.

This product is not a replacement for Codex. It is a local profile manager that generates isolated configuration directories and launcher apps for the existing Codex App installation.

## 2. Target Users

- Codex App users who need multiple independent working windows.
- Users who have multiple API keys or third-party API providers.
- Non-technical users who can enter provider fields in a GUI but do not want to edit `config.toml`, launch scripts, or shell environment variables.

## 3. MVP Goals

- Detect the local Codex installation and current compatibility state.
- Guide users through creating an isolated Codex profile.
- Support third-party providers that are compatible with OpenAI Responses API.
- Store API keys locally in an encrypted file for fast MVP validation.
- Generate a double-clickable macOS launcher app per profile.
- Provide a dashboard for profile status, launch, edit, delete, and config backup.

## 4. Non-Goals

- No Windows or Linux support.
- No Chat Completions-only provider compatibility.
- No provider marketplace.
- No built-in API resale or recommendation of third-party vendors.
- No Codex auto-installation or auto-upgrade.
- No code signing, notarization, or App Store distribution in MVP.
- No team collaboration, cloud sync, or remote profile management.
- No implicit background process management without visible status.

## 5. User Stories

### 5.1 Create A New Profile

As a user, I want to create a named Codex profile so that I can launch an isolated Codex window with its own configuration and API key.

Acceptance criteria:

- User can enter a profile name.
- App creates a unique profile ID.
- App creates an isolated `CODEX_HOME`.
- App creates an isolated Electron `user-data-dir`.
- App prevents accidental reuse of another profile's writable config directory unless explicitly confirmed.

### 5.2 Configure A Third-Party Provider

As a user, I want to configure a third-party API provider using a form instead of editing TOML.

Acceptance criteria:

- User can enter provider display name.
- User can enter `base_url`.
- User can enter model name.
- User can enter API key.
- App validates that the provider is intended for `wire_api = "responses"`.
- App writes the provider config into the profile's `config.toml`.
- API key is not written into `config.toml`.

### 5.3 Generate A Double-Clickable Launcher

As a user, I want a `.app` launcher that opens the selected Codex profile directly.

Acceptance criteria:

- App generates launchers under `~/Applications/Codex Profiles/` by default.
- User can choose another launcher location.
- Launcher injects `CODEX_HOME`.
- Launcher injects the profile API key environment variable at runtime.
- Launcher passes `--user-data-dir` to Codex App.
- Double-clicking the launcher opens Codex in the correct profile.

### 5.4 Manage Profiles From Dashboard

As a user, I want to see and manage all created profiles from one place.

Acceptance criteria:

- Dashboard lists all profiles.
- Dashboard shows profile name, provider, model, launcher path, and last launch time.
- Dashboard can open, edit, duplicate, delete, and reveal profile paths.
- Dashboard shows whether a profile appears to be running.
- Dashboard provides a "stop all launched instances" action when the app can identify child processes.

### 5.5 Backup And Restore Config

As a user, I want the app to make backups before modifying profile config so that I can recover from bad provider settings.

Acceptance criteria:

- App snapshots `config.toml` before every write.
- App keeps a small rolling history of config snapshots.
- App can restore the latest snapshot.
- App records the reason and timestamp for each snapshot.

## 6. UX Flow

1. Welcome and environment check.
2. Create profile.
3. Choose provider type.
4. Configure provider.
5. Test provider.
6. Choose launcher location.
7. Generate profile and launcher.
8. Open Codex.
9. Return to dashboard.

## 7. Provider Support

MVP supports:

- Official OpenAI API key mode.
- Third-party OpenAI-compatible Responses API mode.

MVP does not support:

- Chat Completions-only providers.
- OAuth-based third-party login.
- Provider-specific custom adapters.

## 8. Data Storage

MVP stores:

- App-level profile registry in a local JSON file.
- Per-profile Codex config under the generated `CODEX_HOME`.
- API keys in a local encrypted file.
- Config backups under each profile directory.

MVP must redact API keys from:

- UI logs.
- Diagnostic output.
- Error messages.
- Exported support bundles.

## 9. Risks

- Codex App or CLI may change config fields or startup behavior.
- Some third-party providers may claim OpenAI compatibility but not support Responses API.
- macOS may block copied launchers depending on security settings.
- Users may manually edit generated files and create inconsistent state.
- Multiple running Codex windows may be hard to associate with profile IDs if launched outside this manager.

## 10. Success Criteria

The MVP is successful when:

- A new user can create a third-party provider profile without using Terminal.
- The generated launcher opens Codex with the correct isolated `CODEX_HOME`.
- The generated launcher opens Codex with the correct `--user-data-dir`.
- The profile uses the third-party API key without writing it into `config.toml`.
- A bad provider config can be reverted through snapshot restore.
