import { contextBridge, ipcRenderer } from "electron";
import type { CodexApi, CreateProfileInput } from "../shared/types.js";

const api: CodexApi = {
  getEnvironmentReport: () => ipcRenderer.invoke("environment:get"),
  listProfiles: () => ipcRenderer.invoke("profiles:list"),
  getRuntimeStatus: () => ipcRenderer.invoke("profiles:runtime"),
  testProvider: (input) => ipcRenderer.invoke("provider:test", input),
  createProfile: (input: CreateProfileInput) => ipcRenderer.invoke("profiles:create", input),
  deleteProfile: (profileId: string) => ipcRenderer.invoke("profiles:delete", profileId),
  generateLauncher: (profileId: string) => ipcRenderer.invoke("profiles:generate-launcher", profileId),
  openProfile: (profileId: string) => ipcRenderer.invoke("profiles:open", profileId)
};

contextBridge.exposeInMainWorld("codexProfileManager", api);
