const { contextBridge, ipcRenderer } = require("electron");

const api = {
  getAppInfo: () => ipcRenderer.invoke("app:get-info"),
  getAnnouncement: () => ipcRenderer.invoke("app:get-announcement"),
  dismissAnnouncement: (id) => ipcRenderer.invoke("app:dismiss-announcement", id),
  checkForUpdates: () => ipcRenderer.invoke("app:check-for-updates"),
  downloadUpdate: () => ipcRenderer.invoke("app:download-update"),
  installUpdate: () => ipcRenderer.invoke("app:install-update"),
  onUpdateEvent: (listener) => {
    const wrappedListener = (_event, payload) => listener(payload);
    ipcRenderer.on("app:update-event", wrappedListener);
    return () => ipcRenderer.removeListener("app:update-event", wrappedListener);
  },
  openExternalUrl: (url) => ipcRenderer.invoke("shell:open-external", url),
  getEnvironmentReport: () => ipcRenderer.invoke("environment:get"),
  getDiagnosticsReport: () => ipcRenderer.invoke("diagnostics:get"),
  pickCodexAppPath: () => ipcRenderer.invoke("dialog:pick-codex-app-path"),
  pickLauncherDirectory: () => ipcRenderer.invoke("dialog:pick-launcher-directory"),
  revealPath: (path) => ipcRenderer.invoke("shell:reveal-path", path),
  listProfiles: (includeDeleted) => ipcRenderer.invoke("profiles:list", includeDeleted),
  listConfigBackups: (profileId) => ipcRenderer.invoke("profiles:backups", profileId),
  restoreConfigBackup: (input) => ipcRenderer.invoke("profiles:restore-backup", input),
  getRuntimeStatus: () => ipcRenderer.invoke("profiles:runtime"),
  testProvider: (input) => ipcRenderer.invoke("provider:test", input),
  testProfileProvider: (input) => ipcRenderer.invoke("profiles:test-provider", input),
  listProviderModels: (input) => ipcRenderer.invoke("provider:models", input),
  listProfileProviderModels: (input) => ipcRenderer.invoke("profiles:models", input),
  createProfile: (input) => ipcRenderer.invoke("profiles:create", input),
  updateProfile: (input) => ipcRenderer.invoke("profiles:update", input),
  deleteProfile: (profileId) => ipcRenderer.invoke("profiles:delete", profileId),
  permanentlyDeleteProfile: (profileId) => ipcRenderer.invoke("profiles:delete-permanently", profileId),
  restoreProfile: (profileId) => ipcRenderer.invoke("profiles:restore", profileId),
  generateLauncher: (profileId) => ipcRenderer.invoke("profiles:generate-launcher", profileId),
  openProfile: (profileId) => ipcRenderer.invoke("profiles:open", profileId)
};

contextBridge.exposeInMainWorld("codexProfileManager", api);
