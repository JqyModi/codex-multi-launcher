const { contextBridge, ipcRenderer } = require("electron");

const api = {
  getEnvironmentReport: () => ipcRenderer.invoke("environment:get"),
  getDiagnosticsReport: () => ipcRenderer.invoke("diagnostics:get"),
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
