import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir } from "./fs-utils.js";
import { generateProfileIcon } from "./icon-generator.js";
import { codexExecutablePath, getAppPaths, getRuntimePlatform } from "./paths.js";
import { defaultExecutablePathEnv } from "./executable-lookup.js";
import type { LauncherResult, ManagedProfile } from "../shared/types.js";

function plist(profile: ManagedProfile): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDisplayName</key>
  <string>${profile.name}</string>
  <key>CFBundleExecutable</key>
  <string>launcher</string>
  <key>CFBundleIconFile</key>
  <string>profile-icon</string>
  <key>CFBundleIdentifier</key>
  <string>local.codexprofilemanager.${profile.id}</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>${profile.name}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>0.1.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSMinimumSystemVersion</key>
  <string>12.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
`;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function cmdQuote(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function decryptSnippet(profile: ManagedProfile): string {
  const appPaths = getAppPaths();
  return `/usr/bin/env node <<'NODE'
const crypto = require('node:crypto');
const fs = require('node:fs');

const masterKeyFile = ${JSON.stringify(appPaths.masterKeyFile)};
const secretsFile = ${JSON.stringify(appPaths.secretsFile)};
const profileId = ${JSON.stringify(profile.id)};
const providerId = ${JSON.stringify(profile.provider.id)};

const key = Buffer.from(fs.readFileSync(masterKeyFile, 'utf8').trim(), 'base64');
const encrypted = JSON.parse(fs.readFileSync(secretsFile, 'utf8'));
const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(encrypted.payload.iv, 'base64'));
decipher.setAuthTag(Buffer.from(encrypted.payload.authTag, 'base64'));
const plaintext = Buffer.concat([
  decipher.update(Buffer.from(encrypted.payload.ciphertext, 'base64')),
  decipher.final()
]).toString('utf8');
const secrets = JSON.parse(plaintext).secrets;
const secret = secrets.find((item) => item.profileId === profileId && item.providerId === providerId);
if (!secret) process.exit(2);
process.stdout.write(secret.value);
NODE`;
}

function windowsDecryptScript(profile: ManagedProfile): string {
  const appPaths = getAppPaths();
  return [
    "const crypto = require('node:crypto');",
    "const fs = require('node:fs');",
    `const masterKeyFile = ${JSON.stringify(appPaths.masterKeyFile)};`,
    `const secretsFile = ${JSON.stringify(appPaths.secretsFile)};`,
    `const profileId = ${JSON.stringify(profile.id)};`,
    `const providerId = ${JSON.stringify(profile.provider.id)};`,
    "const key = Buffer.from(fs.readFileSync(masterKeyFile, 'utf8').trim(), 'base64');",
    "const encrypted = JSON.parse(fs.readFileSync(secretsFile, 'utf8'));",
    "const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(encrypted.payload.iv, 'base64'));",
    "decipher.setAuthTag(Buffer.from(encrypted.payload.authTag, 'base64'));",
    "const plaintext = Buffer.concat([decipher.update(Buffer.from(encrypted.payload.ciphertext, 'base64')), decipher.final()]).toString('utf8');",
    "const secrets = JSON.parse(plaintext).secrets;",
    "const secret = secrets.find((item) => item.profileId === profileId && item.providerId === providerId);",
    "if (!secret) process.exit(2);",
    "process.stdout.write(secret.value);"
  ].join(" ");
}

async function launcherScript(profile: ManagedProfile): Promise<string> {
  const envLines = [
    `export PATH=${shellQuote(defaultExecutablePathEnv())}`,
    `export CODEX_HOME=${shellQuote(profile.paths.codexHome)}`
  ];

  return `#!/bin/zsh
set -euo pipefail

${envLines.join("\n")}
USER_DATA_DIR=${shellQuote(profile.paths.userDataDir)}
API_KEY=$(${decryptSnippet(profile)}
)
export ${profile.provider.envKeyName}="$API_KEY"

mkdir -p "$CODEX_HOME" "$USER_DATA_DIR"

exec ${shellQuote(codexExecutablePath(profile.paths.codexAppPath))} \\
  --user-data-dir="$USER_DATA_DIR"
`;
}

async function windowsLauncherScript(profile: ManagedProfile): Promise<string> {
  const executablePath = codexExecutablePath(profile.paths.codexAppPath);
  return `@echo off
setlocal
set "CODEX_HOME=${profile.paths.codexHome}"
set "USER_DATA_DIR=${profile.paths.userDataDir}"
set "CODEX_EXE=${executablePath}"
if not exist "%CODEX_EXE%" (
  echo Codex executable was not found: %CODEX_EXE%
  pause
  exit /b 1
)
for /f "usebackq delims=" %%A in (\`node -e ${cmdQuote(windowsDecryptScript(profile))}\`) do set "API_KEY=%%A"
if not defined API_KEY exit /b 2
set "${profile.provider.envKeyName}=%API_KEY%"
if not exist "%CODEX_HOME%" mkdir "%CODEX_HOME%"
if not exist "%USER_DATA_DIR%" mkdir "%USER_DATA_DIR%"
start "" /b "%CODEX_EXE%" --user-data-dir="%USER_DATA_DIR%"
endlocal
`;
}

async function generateMacLauncher(profile: ManagedProfile): Promise<LauncherResult> {
  const contentsDir = path.join(profile.paths.launcherPath, "Contents");
  const macosDir = path.join(contentsDir, "MacOS");
  const resourcesDir = path.join(contentsDir, "Resources");
  const executablePath = path.join(macosDir, "launcher");
  const iconPath = path.join(resourcesDir, "profile-icon.icns");

  await Promise.all([ensureDir(macosDir), ensureDir(resourcesDir)]);
  await fs.writeFile(path.join(contentsDir, "Info.plist"), plist(profile), { mode: 0o644 });
  await fs.writeFile(executablePath, await launcherScript(profile), { mode: 0o700 });
  await generateProfileIcon(iconPath, profile.appearance.iconBackgroundColor);

  return {
    launcherPath: profile.paths.launcherPath,
    executablePath
  };
}

async function generateWindowsLauncher(profile: ManagedProfile): Promise<LauncherResult> {
  await ensureDir(path.dirname(profile.paths.launcherPath));
  await fs.writeFile(profile.paths.launcherPath, await windowsLauncherScript(profile), { mode: 0o700 });

  return {
    launcherPath: profile.paths.launcherPath,
    executablePath: profile.paths.launcherPath
  };
}

export async function generateLauncher(profile: ManagedProfile): Promise<LauncherResult> {
  return getRuntimePlatform() === "win32" ? generateWindowsLauncher(profile) : generateMacLauncher(profile);
}
