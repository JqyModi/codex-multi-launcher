# Update Flow Testing

## Dev simulation

Use the About page `Simulate Update` button while running `npm run dev`.

This verifies:

- update-available modal
- skip version behavior
- in-app download progress
- downloaded state
- restart/install IPC call

In dev mode the app cannot replace itself, so `Restart Now` emits a simulated installed state instead of quitting the app.

This is not a successful real update. It only proves the renderer and IPC state machine.

## Real updater test before public launch

The real auto-update path must be tested with packaged builds and a published GitHub Release. Draft releases are not returned by the public latest-release API.

1. Build and install an old version, for example `0.1.1`.
2. Bump `package.json` to a higher version, for example `0.1.2`.
3. Build release artifacts.
   - macOS: `npm run package:mac:arm64`
   - Windows x64: `npm run package:win:x64`
4. Upload the generated installer artifacts and updater metadata to a GitHub Release whose tag matches the new version, for example `v0.1.2`.
   - macOS needs the zip artifact and `latest-mac.yml`.
   - Windows needs the NSIS installer and `latest.yml`.
   - Portable Windows builds are for manual download and are not the auto-update install path.
5. Open the installed old version and click `Check Updates`.
6. Confirm the modal shows the new version and changelog.
7. Click `Update Now`, wait for download completion, then click `Restart Now`.
8. Confirm the app restarts into the new version.

For production macOS distribution, use signing and notarization before relying on automatic replacement behavior.

Unsigned macOS builds can check and download updates, but Squirrel.Mac rejects the replacement step because it cannot validate the running app signature. Ad-hoc signing is also not enough for the final validation step.

## Local real updater test on one machine

You do not need another computer. Use an installed old build plus a local static update feed.

The app supports `CODEX_PROFILE_MANAGER_UPDATE_URL` in packaged builds. When this environment variable is set, `electron-updater` reads update metadata from that URL instead of the GitHub release feed.

1. Build and install an old version.
   - Keep a copy of this installer or app bundle so you can reinstall it later.
   - Example old version: `0.1.1`.
2. Bump `package.json` to a higher test version.
   - Example new version: `0.1.2`.
   - Use `npm version 0.1.2 --no-git-tag-version` if you want npm to update `package-lock.json` too.
3. Build new update artifacts.
   - macOS Apple Silicon: `npm run package:mac:arm64`
   - Windows x64: `npm run package:win:x64`
4. Start the local update feed:
   - `npm run serve:update-feed`
5. Launch the installed old app with the local feed override.
   - macOS:
     ```sh
     CODEX_PROFILE_MANAGER_UPDATE_URL=http://127.0.0.1:7418/ "/Applications/Codex 多开助手.app/Contents/MacOS/Codex 多开助手"
     ```
   - Windows PowerShell:
     ```powershell
     $env:CODEX_PROFILE_MANAGER_UPDATE_URL="http://127.0.0.1:7418/"
     & "$env:LOCALAPPDATA\Programs\Codex 多开助手\Codex Profile Manager.exe"
     ```
6. Click `Check Updates`, then `Update Now`, then `Restart Now`.
7. Confirm the app starts with the new version.

You can automate step 6 for a packaged app by launching it with a remote debugging port and running:

```sh
npm run verify:update-cdp -- 9333 --install
```

The script calls the packaged renderer API directly and prints the current version, discovered update version, download result, and install invocation.

To repeat the test after the app becomes latest:

- reinstall the old build and run the same local feed again, or
- bump the test version again, for example from `0.1.2` to `0.1.3`, rebuild, and serve the new artifacts.

Changing only the running source version lower is useful for checking version comparison, but it does not prove the real download/install/restart path. The full path needs a packaged old app and an update artifact that is newer than that installed app.

On macOS, the final "restart into the new app" proof requires a Developer ID signed build. Without that, the expected failure is `SQRLCodeSignatureErrorDomain` or `Could not get code signature for running application`.
