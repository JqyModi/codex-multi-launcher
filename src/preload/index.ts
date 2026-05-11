import { contextBridge, ipcRenderer } from "electron";
import type { CodexApi, CreateProfileInput } from "../shared/types.js";

const api: CodexApi = {
  getEnvironmentReport: () => ipcRenderer.invoke("environment:get"),
  getDiagnosticsReport: () => ipcRenderer.invoke("diagnostics:get"),
  pickLauncherDirectory: () => ipcRenderer.invoke("dialog:pick-launcher-directory"),
  revealPath: (path: string) => ipcRenderer.invoke("shell:reveal-path", path),
  listProfiles: (includeDeleted?: boolean) => ipcRenderer.invoke("profiles:list", includeDeleted),
  listConfigBackups: (profileId: string) => ipcRenderer.invoke("profiles:backups", profileId),
  restoreConfigBackup: (input) => ipcRenderer.invoke("profiles:restore-backup", input),
  getRuntimeStatus: () => ipcRenderer.invoke("profiles:runtime"),
  testProvider: (input) => ipcRenderer.invoke("provider:test", input),
  createProfile: (input: CreateProfileInput) => ipcRenderer.invoke("profiles:create", input),
  updateProfile: (input) => ipcRenderer.invoke("profiles:update", input),
  deleteProfile: (profileId: string) => ipcRenderer.invoke("profiles:delete", profileId),
  restoreProfile: (profileId: string) => ipcRenderer.invoke("profiles:restore", profileId),
  generateLauncher: (profileId: string) => ipcRenderer.invoke("profiles:generate-launcher", profileId),
  openProfile: (profileId: string) => ipcRenderer.invoke("profiles:open", profileId)
};

contextBridge.exposeInMainWorld("codexProfileManager", api);
