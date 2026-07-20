import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir } from "./fs-utils.js";
import { generateProfileIcon } from "./icon-generator.js";
import { APP_NAME, getRuntimePlatform } from "./paths.js";
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

function launcherLogPath(profile: ManagedProfile): string {
  return path.join(profile.paths.codexHome, "logs", "launcher.log");
}

function managerExecutablePath(): string {
  return process.execPath;
}

function launcherScript(profile: ManagedProfile): string {
  return `#!/bin/zsh
set -euo pipefail

LOG_FILE=${shellQuote(launcherLogPath(profile))}
mkdir -p "$(dirname "$LOG_FILE")"
{
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] launcher started"
  echo "manager=${managerExecutablePath()}"
  echo "profile=${profile.id}"
} >> "$LOG_FILE" 2>&1

exec ${shellQuote(managerExecutablePath())} --open-profile ${shellQuote(profile.id)} >> "$LOG_FILE" 2>&1
`;
}

async function windowsLauncherScript(profile: ManagedProfile): Promise<string> {
  return `@echo off
setlocal
set "MANAGER_EXE=${managerExecutablePath()}"
set "LOG_FILE=${launcherLogPath(profile)}"
if not exist "${path.win32.dirname(launcherLogPath(profile))}" mkdir "${path.win32.dirname(launcherLogPath(profile))}"
echo [%DATE% %TIME%] launcher started>>"%LOG_FILE%"
echo manager=%MANAGER_EXE%>>"%LOG_FILE%"
echo profile=${profile.id}>>"%LOG_FILE%"
if not exist "%MANAGER_EXE%" (
  echo ${APP_NAME} executable was not found: %MANAGER_EXE%
  echo ${APP_NAME} executable was not found: %MANAGER_EXE%>>"%LOG_FILE%"
  pause
  exit /b 1
)
start "" "%MANAGER_EXE%" --open-profile "${profile.id}" >>"%LOG_FILE%" 2>&1
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
