# Release Signing

## macOS signed release

Production macOS builds require a Developer ID signed app and Apple notarization.

Before running the package command, provide:

- Apple Developer Program membership.
- A `Developer ID Application` certificate installed in the macOS Keychain.
- Apple ID email in `APPLE_ID`.
- App-specific password in `APPLE_APP_SPECIFIC_PASSWORD`.
- Apple Team ID in `APPLE_TEAM_ID`.
- Optional `CSC_NAME` when more than one Developer ID certificate is installed.

Example:

```sh
export APPLE_ID="name@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="ABCDE12345"
export CSC_NAME="Developer ID Application: Your Name (ABCDE12345)"
npm run package:mac:arm64
```

The release upload needs the generated macOS zip and `latest-mac.yml` from `dist-app/`.

## Windows unsigned release

This project currently publishes Windows builds without a code-signing certificate.

The builder config disables Windows executable signing for this release. Expect Windows to show an unknown publisher warning and possibly Microsoft Defender SmartScreen prompts.

Build:

```sh
npm run package:win:x64
```

The release upload needs the NSIS installer, portable exe, and `latest.yml` from `dist-app/`.
