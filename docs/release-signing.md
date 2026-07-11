# Release Signing

## macOS signed release

Production macOS builds require a Developer ID signed app and Apple notarization.

Before running the package command, provide:

- Apple Developer Program membership.
- A `Developer ID Application` certificate installed in the macOS Keychain.
- App Store Connect API key path in `APPLE_API_KEY`.
- App Store Connect API key ID in `APPLE_API_KEY_ID`.
- App Store Connect issuer ID in `APPLE_API_ISSUER`.
- Optional `CSC_NAME` when more than one Developer ID certificate is installed.

Example:

```sh
export APPLE_API_KEY="/absolute/path/to/AuthKey_XXXXXXXXXX.p8"
export APPLE_API_KEY_ID="XXXXXXXXXX"
export APPLE_API_ISSUER="00000000-0000-0000-0000-000000000000"
export CSC_NAME="Developer ID Application: Your Name (ABCDE12345)"
npm run package:mac:arm64
```

The App Store Connect API key is enough for notarization, but it does not replace the `Developer ID Application` signing certificate. If no `Developer ID Application` identity appears in `security find-identity -v -p codesigning`, create one from the Apple Developer Certificates page with the Account Holder account and install it into the macOS Keychain.

The release upload needs the generated macOS zip and `latest-mac.yml` from `dist-app/`.

## Windows unsigned release

This project currently publishes Windows builds without a code-signing certificate.

The builder config disables Windows executable signing for this release. Expect Windows to show an unknown publisher warning and possibly Microsoft Defender SmartScreen prompts.

Build:

```sh
npm run package:win:x64
```

The release upload needs the NSIS installer, portable exe, and `latest.yml` from `dist-app/`.
