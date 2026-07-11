import { contextBridge, ipcRenderer } from "electron";
import type { CodexApi, CreateProfileInput, UpdateDownloadEvent } from "../shared/types.js";

const api: CodexApi = {
  getAppInfo: () => ipcRenderer.invoke("app:get-info"),
  getAnnouncement: () => ipcRenderer.invoke("app:get-announcement"),
  dismissAnnouncement: (id: string) => ipcRenderer.invoke("app:dismiss-announcement", id),
  checkForUpdates: () => ipcRenderer.invoke("app:check-for-updates"),
  downloadUpdate: () => ipcRenderer.invoke("app:download-update"),
  installUpdate: () => ipcRenderer.invoke("app:install-update"),
  onUpdateEvent: (listener: (event: UpdateDownloadEvent) => void) => {
    const wrappedListener = (_event: Electron.IpcRendererEvent, payload: UpdateDownloadEvent) => listener(payload);
    ipcRenderer.on("app:update-event", wrappedListener);
    return () => ipcRenderer.removeListener("app:update-event", wrappedListener);
  },
  openExternalUrl: (url: string) => ipcRenderer.invoke("shell:open-external", url),
  getEnvironmentReport: () => ipcRenderer.invoke("environment:get"),
  getDiagnosticsReport: () => ipcRenderer.invoke("diagnostics:get"),
  pickCodexAppPath: () => ipcRenderer.invoke("dialog:pick-codex-app-path"),
  pickLauncherDirectory: () => ipcRenderer.invoke("dialog:pick-launcher-directory"),
  revealPath: (path: string) => ipcRenderer.invoke("shell:reveal-path", path),
  listProfiles: (includeDeleted?: boolean) => ipcRenderer.invoke("profiles:list", includeDeleted),
  listConfigBackups: (profileId: string) => ipcRenderer.invoke("profiles:backups", profileId),
  restoreConfigBackup: (input) => ipcRenderer.invoke("profiles:restore-backup", input),
  getRuntimeStatus: () => ipcRenderer.invoke("profiles:runtime"),
  testProvider: (input) => ipcRenderer.invoke("provider:test", input),
  testProfileProvider: (input) => ipcRenderer.invoke("profiles:test-provider", input),
  listProviderModels: (input) => ipcRenderer.invoke("provider:models", input),
  listProfileProviderModels: (input) => ipcRenderer.invoke("profiles:models", input),
  createProfile: (input: CreateProfileInput) => ipcRenderer.invoke("profiles:create", input),
  updateProfile: (input) => ipcRenderer.invoke("profiles:update", input),
  deleteProfile: (profileId: string) => ipcRenderer.invoke("profiles:delete", profileId),
  permanentlyDeleteProfile: (profileId: string) => ipcRenderer.invoke("profiles:delete-permanently", profileId),
  restoreProfile: (profileId: string) => ipcRenderer.invoke("profiles:restore", profileId),
  generateLauncher: (profileId: string) => ipcRenderer.invoke("profiles:generate-launcher", profileId),
  openProfile: (profileId: string) => ipcRenderer.invoke("profiles:open", profileId)
};

contextBridge.exposeInMainWorld("codexProfileManager", api);
