# User Flow

## 1. First Launch

Screen: Welcome

Purpose:

- Explain that the app creates isolated Codex profiles.
- Tell the user it requires an existing Codex App installation.
- Tell the user no API key is uploaded.

Primary action:

- Start setup.

## 2. Environment Check

Screen: Environment Check

Checks:

- `/Applications/Codex.app` exists.
- Codex executable exists at `/Applications/Codex.app/Contents/MacOS/Codex`.
- `codex` CLI is available if installed.
- Default launcher directory is writable: `~/Applications/Codex Profiles/`.
- Default profile root is writable: `~/.codex-profiles/`.
- App data directory is writable: `~/Library/Application Support/Codex Profile Manager/`.

Outcomes:

- All checks pass: continue.
- Codex App missing: ask user to select Codex App path.
- Directory not writable: ask user to select alternative path.
- CLI missing: warn but allow continuing if Codex App exists.

## 3. Profile Basics

Screen: Create Profile

Fields:

- Profile name.
- Optional launcher location.
- Optional profile storage location.

Defaults:

```text
Profile root: ~/.codex-profiles/<profile-id>/codex-home
User data dir: ~/Library/Application Support/Codex Profiles/<profile-id>/user-data
Launcher: ~/Applications/Codex Profiles/<Profile Name>.app
```

Validation:

- Profile name is not empty.
- Generated profile ID is unique.
- Launcher path does not conflict unless user chooses overwrite.

## 4. Provider Selection

Screen: Select Provider

Options:

- Official OpenAI API key.
- Third-party Responses-compatible provider.

MVP default:

- Third-party Responses-compatible provider.

Copy:

- "MVP only supports providers compatible with OpenAI Responses API. Chat Completions-only providers are not supported yet."

## 5. Provider Configuration

Screen: Provider Details

Fields for third-party provider:

- Provider display name.
- Base URL.
- Model.
- API key.

Defaults:

```text
Base URL: https://example.com/v1
Model: gpt-5.2
Wire API: responses
Reasoning effort: medium
```

Validation:

- Base URL must start with `https://` unless user explicitly allows local development URL.
- API key must not be empty.
- Model must not be empty.

## 6. Provider Test

Screen: Test Connection

Steps:

- Build a temporary request using the entered provider config.
- Verify auth works.
- Verify the provider likely supports Responses API.
- Show the tested endpoint and result category.

Result categories:

- Passed.
- Auth failed.
- Base URL unreachable.
- Responses API unsupported.
- Unknown error.

User actions:

- Back and edit provider.
- Continue with warning.
- Cancel setup.

## 7. Review And Generate

Screen: Review

Show:

- Profile name.
- Codex App path.
- `CODEX_HOME`.
- `user-data-dir`.
- Launcher path.
- Provider display name.
- Base URL.
- Model.
- Redacted API key.

Primary action:

- Generate profile.

Generated artifacts:

- Profile registry entry.
- Encrypted API key entry.
- Profile `config.toml`.
- Config backup manifest.
- Launcher app.

## 8. Launch Codex

Screen: Success

Actions:

- Open Codex now.
- Reveal launcher in Finder.
- Back to dashboard.

Expected behavior:

- Codex opens as a separate desktop window.
- The new window uses the generated profile's `CODEX_HOME`.
- The new window uses the generated profile's `user-data-dir`.
- The configured provider is available without manual Terminal commands.

## 9. Dashboard

Screen: Profiles

Profile card fields:

- Name.
- Provider.
- Model.
- Status.
- Last launched.
- Launcher path.

Actions:

- Open.
- Stop.
- Restart.
- Edit.
- Duplicate.
- Reveal in Finder.
- Backup.
- Restore.
- Delete.

MVP status states:

- Not running.
- Running.
- Unknown.
- Error.

## 10. Edit Profile

Editable fields:

- Profile name.
- Provider display name.
- Base URL.
- Model.
- API key.
- Launcher path.

Rules:

- Changing provider config creates a config snapshot.
- Changing launcher path regenerates launcher.
- Changing API key updates encrypted secrets only.

## 11. Delete Profile

Delete flow:

- Ask whether to keep profile files.
- Always remove profile from dashboard after confirmation.
- If deleting files, create an archive first in app support directory.

MVP default:

- Disable profile and keep files.

## 12. Error Handling

Common errors:

- Codex App moved or deleted.
- Launcher path conflict.
- `config.toml` parse failure.
- API key missing.
- Provider does not support Responses API.
- Codex launches but exits quickly.

UI requirement:

- Show user-friendly category first.
- Show raw technical details behind an expandable disclosure.
- Include "copy diagnostic report" with secrets redacted.
