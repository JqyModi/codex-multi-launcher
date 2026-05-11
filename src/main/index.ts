import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getEnvironmentReport } from "./environment.js";
import { getDiagnosticsReport } from "./diagnostics.js";
import {
  createProfile,
  deleteProfile,
  generateProfileLauncher,
  getRuntimeStatus,
  listConfigBackups,
  listProfiles,
  openProfile,
  restoreProfile,
  restoreConfigBackup,
  updateProfile
} from "./profile-service.js";
import { testProvider } from "./provider-test.js";
import type { CreateProfileInput, ProviderTestInput, RestoreConfigBackupInput, UpdateProfileInput } from "../shared/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 1040,
    minHeight: 680,
    title: "Codex Profile Manager",
    backgroundColor: "#F6F7F9",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    void window.loadURL(devServerUrl);
  } else {
    void window.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
}

function registerIpc(): void {
  ipcMain.handle("environment:get", () => getEnvironmentReport());
  ipcMain.handle("diagnostics:get", () => getDiagnosticsReport());
  ipcMain.handle("dialog:pick-launcher-directory", async () => {
    const result = await dialog.showOpenDialog({
      title: "Choose Launcher Directory",
      properties: ["openDirectory", "createDirectory"]
    });
    return result.canceled ? null : result.filePaths[0] ?? null;
  });
  ipcMain.handle("shell:reveal-path", async (_event, targetPath: string) => {
    shell.showItemInFolder(targetPath);
    return { ok: true };
  });
  ipcMain.handle("profiles:list", (_event, includeDeleted?: boolean) => listProfiles(includeDeleted));
  ipcMain.handle("profiles:backups", (_event, profileId: string) => listConfigBackups(profileId));
  ipcMain.handle("profiles:restore-backup", (_event, input: RestoreConfigBackupInput) => restoreConfigBackup(input));
  ipcMain.handle("profiles:runtime", () => getRuntimeStatus());
  ipcMain.handle("provider:test", (_event, input: ProviderTestInput) => testProvider(input));
  ipcMain.handle("profiles:create", (_event, input: CreateProfileInput) => createProfile(input));
  ipcMain.handle("profiles:update", (_event, input: UpdateProfileInput) => updateProfile(input));
  ipcMain.handle("profiles:delete", (_event, profileId: string) => deleteProfile(profileId));
  ipcMain.handle("profiles:restore", (_event, profileId: string) => restoreProfile(profileId));
  ipcMain.handle("profiles:generate-launcher", (_event, profileId: string) => generateProfileLauncher(profileId));
  ipcMain.handle("profiles:open", (_event, profileId: string) => openProfile(profileId));
}

void app.whenReady().then(() => {
  registerIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
