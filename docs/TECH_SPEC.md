# Technical Specification

## 1. Architecture

MVP uses an Electron desktop app.

Recommended stack:

- Electron main process for filesystem, process, launcher generation, and encryption.
- React + TypeScript renderer for setup wizard and dashboard.
- Vite for development.
- Local JSON files for profile registry.

Process boundaries:

- Renderer must not access arbitrary filesystem APIs directly.
- Renderer calls a narrow preload API.
- Main process validates paths, writes files, spawns Codex, and manages launcher generation.

## 2. Codex Profile Isolation

Each profile owns two separate directories:

- `CODEX_HOME`: Codex CLI/App config, auth, sessions, plugins, caches, and profile-local state.
- `user-data-dir`: Electron application support data for the Codex desktop window.

Example:

```text
~/.codex-profiles/<profile-id>/codex-home
~/Library/Application Support/Codex Profiles/<profile-id>/user-data
```

Launch command:

```zsh
CODEX_HOME="$PROFILE_CODEX_HOME" \
THIRD_PARTY_API_KEY="$DECRYPTED_API_KEY" \
/Applications/Codex.app/Contents/MacOS/Codex \
  --user-data-dir="$PROFILE_USER_DATA_DIR"
```

The two paths must both be isolated. Using only `CODEX_HOME` is not enough for desktop app window state. Using only `--user-data-dir` is not enough for Codex config and API provider state.

## 3. Codex Config Generation

The app writes each profile's Codex config to:

```text
<CODEX_HOME>/config.toml
```

Third-party Responses API provider template:

```toml
model_provider = "proxy"
model = "gpt-5.2"
model_reasoning_effort = "medium"

[model_providers.proxy]
name = "My Proxy"
base_url = "https://proxy.example.com/v1"
env_key = "CODEX_PROFILE_PROXY_API_KEY"
wire_api = "responses"
```

Rules:

- Do not write API keys into `config.toml`.
- Use a generated environment variable name per profile.
- Use `wire_api = "responses"` for MVP.
- Preserve user-editable non-conflicting fields where possible.
- Snapshot `config.toml` before every write.

## 4. API Key Storage

For MVP, API keys are stored in a local encrypted file.

Default path:

```text
~/Library/Application Support/Codex Profile Manager/secrets.enc.json
```

Required behavior:

- One API key entry per profile/provider.
- Encrypt before writing to disk.
- Decrypt only in the main process.
- Never send raw API keys to the renderer after initial input.
- Never include raw API keys in logs, diagnostics, or exceptions.

Suggested MVP encryption:

- Generate a local random master key on first run.
- Store the master key in a file with `0600` permissions for MVP speed.
- Encrypt secrets with AES-256-GCM.

Future upgrade:

- Move master key or individual secrets into macOS Keychain.

## 5. Profile Registry

Default path:

```text
~/Library/Application Support/Codex Profile Manager/profiles.json
```

The registry is the source of truth for app-managed profiles. It should not duplicate secret values.

The registry stores:

- Profile ID.
- Display name.
- Paths.
- Provider metadata.
- Launcher path.
- Created and updated timestamps.
- Last launch timestamp.
- Last known process metadata when launched by this app.

## 6. Launcher Generation

Default launcher directory:

```text
~/Applications/Codex Profiles/
```

Each profile gets a generated app bundle:

```text
~/Applications/Codex Profiles/<Profile Name>.app
```

Minimum bundle structure:

```text
<Profile Name>.app/
  Contents/
    Info.plist
    MacOS/
      launcher
    Resources/
      icon.icns
```

Launcher responsibilities:

- Set `CODEX_HOME`.
- Retrieve/decrypt API key directly or call the manager helper.
- Export the profile-specific provider environment variable.
- Ensure profile directories exist.
- Execute Codex App with `--user-data-dir`.

Simpler MVP launcher option:

- Generate a shell-based launcher containing encrypted secret lookup through the manager CLI/helper.
- Do not embed plaintext API keys inside the launcher file.

Fast validation option:

- Embed the decrypted API key in the launcher temporarily only for internal testing.
- This is not acceptable for public MVP release.

## 7. Process Management

The manager should support two launch modes:

- Launch through generated `.app`.
- Launch from dashboard via main process spawn.

Dashboard launch behavior:

- Spawn Codex with profile environment.
- Record PID, start time, and command metadata.
- Do not assume Codex child processes remain direct children after app startup.

Running status detection:

- Check process list for Codex processes with matching `--user-data-dir`.
- Check environment only when available.
- Fall back to "unknown" if the app cannot prove a profile is running.

## 8. Provider Test

MVP should test a provider before generating the launcher.

Preferred checks:

1. Verify `base_url` is a valid HTTPS URL.
2. Send a lightweight request to a supported endpoint.
3. Confirm authorization failure is distinguishable from unsupported endpoint.
4. Warn if the provider appears Chat Completions-only.

Responses API test strategy:

- Prefer a minimal `/v1/responses` request if the provider supports it.
- If that is too expensive, test `/v1/models` first and show a weaker compatibility warning.

## 9. Backups

Before modifying profile files:

- Create `backups/<timestamp>/config.toml`.
- Write a small `manifest.json` with reason and source path.
- Keep latest 10 config backups by default.

Backup location:

```text
<CODEX_HOME>/profile-manager-backups/
```

## 10. Diagnostics

MVP diagnostics should be read-only.

Checks:

- Codex App exists.
- Codex CLI exists.
- Codex version can be read.
- Profile directories exist and are writable.
- Launcher directory exists and is writable.
- Profile `CODEX_HOME` is unique.
- Profile `user-data-dir` is unique.
- `config.toml` parses.
- Provider has `wire_api = "responses"`.
- API key exists for selected profile.

## 11. Compatibility Policy

The app should report the detected Codex version and mark compatibility as:

- Supported: version manually verified.
- Untested: version newer than known verified version.
- Unsupported: required behavior is known to be missing.

MVP should not auto-upgrade Codex.
