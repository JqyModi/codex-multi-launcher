import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import electronUpdater from "electron-updater";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getEnvironmentReport } from "./environment.js";
import { getDiagnosticsReport } from "./diagnostics.js";
import { APP_NAME, configurePathProvider } from "./paths.js";
import {
  createProfile,
  deleteProfile,
  generateProfileLauncher,
  getRuntimeStatus,
  listProfileProviderModels,
  listConfigBackups,
  listProfiles,
  openProfile,
  permanentlyDeleteProfile,
  restoreProfile,
  restoreConfigBackup,
  testProfileProvider,
  updateProfile
} from "./profile-service.js";
import { listProviderModels, testProvider } from "./provider-test.js";
import type { AnnouncementItem, AnnouncementPlatform, AnnouncementResult, CreateProfileInput, ProfileProviderModelsInput, ProfileProviderTestInput, ProviderModelsInput, ProviderTestInput, RestoreConfigBackupInput, UpdateDownloadEvent, UpdateProfileInput } from "../shared/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { autoUpdater } = electronUpdater;
const APP_LINKS = {
  authorUrl: "https://github.com/JqyModi",
  repositoryUrl: "https://github.com/JqyModi/codex-multi-launcher",
  releasesUrl: "https://github.com/JqyModi/codex-multi-launcher/releases/latest",
  issuesUrl: "https://github.com/JqyModi/codex-multi-launcher/issues",
  sponsorUrl: "https://github.com/sponsors/JqyModi",
  productPageUrl: "https://jqymodi.github.io/codex-multi-launcher/"
};
const UPDATE_FEED_URL = process.env.CODEX_PROFILE_MANAGER_UPDATE_URL?.trim();
const ANNOUNCEMENTS_URL = process.env.CODEX_PROFILE_MANAGER_ANNOUNCEMENTS_URL?.trim()
  || "https://jqymodi.github.io/codex-multi-launcher/announcements.json";

if (UPDATE_FEED_URL) {
  autoUpdater.setFeedURL(UPDATE_FEED_URL);
}
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.on("download-progress", (progress) => {
  emitUpdateEvent({ state: "downloading", progress: Math.round(progress.percent) });
});
autoUpdater.on("update-downloaded", (info) => {
  emitUpdateEvent({ state: "downloaded", progress: 100, version: info.version });
});
autoUpdater.on("error", (error) => {
  emitUpdateEvent({ state: "error", error: error.message });
});
let mainWindow: BrowserWindow | null = null;

if (process.platform === "win32") {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch("disable-gpu");
  app.commandLine.appendSwitch("disable-gpu-compositing");
  app.commandLine.appendSwitch("disable-software-rasterizer");
  app.commandLine.appendSwitch("in-process-gpu");
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 1040,
    minHeight: 680,
    title: "Codex 多开助手",
    backgroundColor: "#F6F7F9",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
}

function registerIpc(): void {
  ipcMain.handle("app:get-info", () => ({
    name: APP_NAME,
    version: app.getVersion(),
    author: "Modi",
    ...APP_LINKS
  }));
  ipcMain.handle("app:get-announcement", () => getAnnouncement());
  ipcMain.handle("app:dismiss-announcement", (_event, id: string) => dismissAnnouncement(id));
  ipcMain.handle("app:check-for-updates", () => checkForUpdates());
  ipcMain.handle("app:download-update", async () => {
    if (!app.isPackaged) {
      simulateUpdateDownload();
      return { ok: true };
    }
    await autoUpdater.checkForUpdates();
    await autoUpdater.downloadUpdate();
    return { ok: true };
  });
  ipcMain.handle("app:install-update", () => {
    if (!app.isPackaged) {
      emitUpdateEvent({ state: "installed", progress: 100 });
      return { ok: true };
    }
    emitUpdateEvent({ state: "installing", progress: 100 });
    autoUpdater.quitAndInstall(false, true);
    return { ok: true };
  });
  ipcMain.handle("shell:open-external", async (_event, targetUrl: string) => {
    const parsedUrl = new URL(targetUrl);
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      throw new Error(`Unsupported external URL protocol: ${parsedUrl.protocol}`);
    }
    await shell.openExternal(targetUrl);
    return { ok: true };
  });
  ipcMain.handle("environment:get", () => getEnvironmentReport());
  ipcMain.handle("diagnostics:get", () => getDiagnosticsReport());
  ipcMain.handle("dialog:pick-codex-app-path", async () => {
    const result = await dialog.showOpenDialog({
      title: "Choose ChatGPT/Codex App",
      properties: ["openFile"],
      filters: process.platform === "win32"
        ? [{ name: "Desktop app executable", extensions: ["exe"] }]
        : [{ name: "Desktop app", extensions: ["app"] }]
    });
    return result.canceled ? null : result.filePaths[0] ?? null;
  });
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
  ipcMain.handle("profiles:test-provider", (_event, input: ProfileProviderTestInput) => testProfileProvider(input));
  ipcMain.handle("provider:models", (_event, input: ProviderModelsInput) => listProviderModels(input));
  ipcMain.handle("profiles:models", (_event, input: ProfileProviderModelsInput) => listProfileProviderModels(input));
  ipcMain.handle("profiles:create", (_event, input: CreateProfileInput) => createProfile(input));
  ipcMain.handle("profiles:update", (_event, input: UpdateProfileInput) => updateProfile(input));
  ipcMain.handle("profiles:delete", (_event, profileId: string) => deleteProfile(profileId));
  ipcMain.handle("profiles:delete-permanently", (_event, profileId: string) => permanentlyDeleteProfile(profileId));
  ipcMain.handle("profiles:restore", (_event, profileId: string) => restoreProfile(profileId));
  ipcMain.handle("profiles:generate-launcher", (_event, profileId: string) => generateProfileLauncher(profileId));
  ipcMain.handle("profiles:open", (_event, profileId: string) => openProfile(profileId));
}

function emitUpdateEvent(event: UpdateDownloadEvent): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send("app:update-event", event);
  }
}

function simulateUpdateDownload(): void {
  let progress = 0;
  const timer = setInterval(() => {
    progress = Math.min(progress + 13, 100);
    emitUpdateEvent({ state: "downloading", progress });
    if (progress >= 100) {
      clearInterval(timer);
      emitUpdateEvent({ state: "downloaded", progress: 100 });
    }
  }, 240);
}

async function getAnnouncement(): Promise<AnnouncementResult> {
  const currentVersion = app.getVersion();
  const fetchedAt = new Date().toISOString();
  try {
    const config = await fetchAnnouncementsConfig();
    await writeAnnouncementCache(config, fetchedAt);
    const state = await readAnnouncementState();
    return {
      item: selectAnnouncement(config.items, currentVersion, new Set(state.dismissedIds)),
      source: "remote",
      fetchedAt
    };
  } catch {
    const cached = await readAnnouncementCache();
    if (!cached) {
      if (!app.isPackaged) {
        const state = await readAnnouncementState();
        return {
          item: selectAnnouncement(getDevelopmentAnnouncements(), currentVersion, new Set(state.dismissedIds)),
          source: "none"
        };
      }
      return { item: null, source: "none" };
    }
    const state = await readAnnouncementState();
    return {
      item: selectAnnouncement(cached.items, currentVersion, new Set(state.dismissedIds)),
      source: "cache",
      fetchedAt: cached.fetchedAt
    };
  }
}

function getDevelopmentAnnouncements(): AnnouncementItem[] {
  return [{
    id: "dev-announcement-preview",
    enabled: true,
    priority: 1,
    placement: "dashboard_top",
    type: "promo",
    label: "推广",
    title: "Codex Plus 30 天试用开放中",
    description: "后续可通过远程配置触达用户。",
    ctaText: "查看",
    ctaUrl: APP_LINKS.productPageUrl,
    platforms: [process.platform],
    minAppVersion: "0.0.0",
    dismissible: true
  }];
}

async function fetchAnnouncementsConfig(): Promise<{ items: AnnouncementItem[] }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(ANNOUNCEMENTS_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": `codex-profile-manager/${app.getVersion()}`
      },
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`Announcements returned HTTP ${response.status}`);
    }
    return normalizeAnnouncementsConfig(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeAnnouncementsConfig(value: unknown): { items: AnnouncementItem[] } {
  if (!value || typeof value !== "object" || !Array.isArray((value as { items?: unknown }).items)) {
    return { items: [] };
  }
  const items = (value as { items: unknown[] }).items
    .map(normalizeAnnouncementItem)
    .filter((item): item is AnnouncementItem => item !== null);
  return { items };
}

function normalizeAnnouncementItem(value: unknown): AnnouncementItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<AnnouncementItem>;
  if (!item.id || typeof item.id !== "string") return null;
  if (!item.title || typeof item.title !== "string") return null;
  if (item.ctaUrl && !isSafeExternalUrl(item.ctaUrl)) return null;
  return {
    id: item.id,
    enabled: item.enabled !== false,
    priority: typeof item.priority === "number" ? item.priority : 0,
    placement: item.placement === "dashboard_top" ? "dashboard_top" : "dashboard_top",
    type: ["info", "promo", "warning", "success"].includes(item.type ?? "") ? item.type as AnnouncementItem["type"] : "info",
    label: typeof item.label === "string" ? item.label : undefined,
    title: item.title,
    description: typeof item.description === "string" ? item.description : undefined,
    ctaText: typeof item.ctaText === "string" ? item.ctaText : undefined,
    ctaUrl: item.ctaUrl,
    startAt: typeof item.startAt === "string" ? item.startAt : undefined,
    endAt: typeof item.endAt === "string" ? item.endAt : undefined,
    platforms: Array.isArray(item.platforms) ? item.platforms.filter((platform): platform is AnnouncementPlatform => typeof platform === "string") : undefined,
    minAppVersion: typeof item.minAppVersion === "string" ? item.minAppVersion : undefined,
    maxAppVersion: typeof item.maxAppVersion === "string" ? item.maxAppVersion : item.maxAppVersion === null ? null : undefined,
    dismissible: item.dismissible !== false
  };
}

function selectAnnouncement(items: AnnouncementItem[], currentVersion: string, dismissedIds: Set<string>): AnnouncementItem | null {
  const now = Date.now();
  return [...items]
    .filter((item) => item.enabled)
    .filter((item) => item.placement === "dashboard_top")
    .filter((item) => !dismissedIds.has(item.id))
    .filter((item) => isAnnouncementActiveAt(item, now))
    .filter((item) => !item.platforms?.length || item.platforms.includes(process.platform))
    .filter((item) => !item.minAppVersion || compareVersions(currentVersion, item.minAppVersion) >= 0)
    .filter((item) => !item.maxAppVersion || compareVersions(currentVersion, item.maxAppVersion) <= 0)
    .sort((left, right) => right.priority - left.priority)[0] ?? null;
}

function isAnnouncementActiveAt(item: AnnouncementItem, timestamp: number): boolean {
  const startAt = item.startAt ? Date.parse(item.startAt) : Number.NaN;
  const endAt = item.endAt ? Date.parse(item.endAt) : Number.NaN;
  if (!Number.isNaN(startAt) && timestamp < startAt) return false;
  if (!Number.isNaN(endAt) && timestamp > endAt) return false;
  return true;
}

async function dismissAnnouncement(id: string): Promise<{ ok: true }> {
  const state = await readAnnouncementState();
  const dismissedIds = new Set(state.dismissedIds);
  dismissedIds.add(id);
  await writeAnnouncementState({ dismissedIds: [...dismissedIds] });
  return { ok: true };
}

async function writeAnnouncementCache(config: { items: AnnouncementItem[] }, fetchedAt: string): Promise<void> {
  await fs.mkdir(getAnnouncementDir(), { recursive: true });
  await fs.writeFile(getAnnouncementCachePath(), JSON.stringify({ ...config, fetchedAt }, null, 2), "utf8");
}

async function readAnnouncementCache(): Promise<({ items: AnnouncementItem[]; fetchedAt?: string }) | null> {
  try {
    const parsed = JSON.parse(await fs.readFile(getAnnouncementCachePath(), "utf8")) as { items?: unknown[]; fetchedAt?: unknown };
    return {
      items: normalizeAnnouncementsConfig(parsed).items,
      fetchedAt: typeof parsed.fetchedAt === "string" ? parsed.fetchedAt : undefined
    };
  } catch {
    return null;
  }
}

async function readAnnouncementState(): Promise<{ dismissedIds: string[] }> {
  try {
    const parsed = JSON.parse(await fs.readFile(getAnnouncementStatePath(), "utf8")) as { dismissedIds?: unknown };
    return {
      dismissedIds: Array.isArray(parsed.dismissedIds) ? parsed.dismissedIds.filter((id): id is string => typeof id === "string") : []
    };
  } catch {
    return { dismissedIds: [] };
  }
}

async function writeAnnouncementState(state: { dismissedIds: string[] }): Promise<void> {
  await fs.mkdir(getAnnouncementDir(), { recursive: true });
  await fs.writeFile(getAnnouncementStatePath(), JSON.stringify(state, null, 2), "utf8");
}

function getAnnouncementDir(): string {
  return path.join(app.getPath("userData"), "remote-config");
}

function getAnnouncementCachePath(): string {
  return path.join(getAnnouncementDir(), "announcements-cache.json");
}

function getAnnouncementStatePath(): string {
  return path.join(getAnnouncementDir(), "announcements-state.json");
}

function isSafeExternalUrl(targetUrl: string): boolean {
  try {
    const parsedUrl = new URL(targetUrl);
    return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
  } catch {
    return false;
  }
}

async function checkForUpdates() {
  const currentVersion = app.getVersion();
  if (app.isPackaged) {
    return checkForPackagedUpdates(currentVersion);
  }

  return checkGitHubRelease(currentVersion);
}

async function checkForPackagedUpdates(currentVersion: string) {
  try {
    const result = await autoUpdater.checkForUpdates();
    if (!result) {
      return {
        status: "up_to_date",
        currentVersion,
        latestVersion: currentVersion
      };
    }

    const { updateInfo } = result;
    return {
      status: result.isUpdateAvailable ? "update_available" : "up_to_date",
      currentVersion,
      latestVersion: updateInfo.version,
      releaseName: updateInfo.releaseName ?? undefined,
      releaseUrl: UPDATE_FEED_URL || APP_LINKS.releasesUrl,
      publishedAt: updateInfo.releaseDate,
      changelog: formatReleaseNotes(updateInfo.releaseNotes)
    };
  } catch (error) {
    return {
      status: "error",
      currentVersion,
      latestVersion: null,
      error: error instanceof Error ? error.message : "Could not check for updates."
    };
  }
}

async function checkGitHubRelease(currentVersion: string) {
  try {
    const response = await fetch("https://api.github.com/repos/JqyModi/codex-multi-launcher/releases/latest", {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": `codex-profile-manager/${currentVersion}`
      }
    });
    if (!response.ok) {
      throw new Error(`GitHub Releases returned HTTP ${response.status}`);
    }

    const release = await response.json() as {
      tag_name?: string;
      name?: string;
      html_url?: string;
      published_at?: string;
      body?: string;
    };
    const latestVersion = normalizeVersion(release.tag_name || release.name || "");
    return {
      status: compareVersions(latestVersion, currentVersion) > 0 ? "update_available" : "up_to_date",
      currentVersion,
      latestVersion,
      releaseName: release.name,
      releaseUrl: release.html_url,
      publishedAt: release.published_at,
      changelog: release.body
    };
  } catch (error) {
    return {
      status: "error",
      currentVersion,
      latestVersion: null,
      error: error instanceof Error ? error.message : "Could not check for updates."
    };
  }
}

function formatReleaseNotes(releaseNotes: unknown): string | undefined {
  if (!releaseNotes) return undefined;
  if (typeof releaseNotes === "string") return releaseNotes;
  if (Array.isArray(releaseNotes)) {
    return releaseNotes
      .map((note) => {
        if (typeof note === "string") return note;
        if (note && typeof note === "object" && "note" in note) {
          return String(note.note ?? "");
        }
        return "";
      })
      .filter(Boolean)
      .join("\n\n");
  }
  return undefined;
}

function normalizeVersion(value: string): string {
  const match = value.trim().match(/v?(\d+(?:\.\d+){0,2}(?:[-+][0-9A-Za-z.-]+)?)/);
  return match?.[1] ?? value.trim();
}

function compareVersions(left: string, right: string): number {
  const leftParts = left.split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0);
  const rightParts = right.split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(leftParts.length, rightParts.length, 3);
  for (let index = 0; index < length; index += 1) {
    const diff = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

void app.whenReady().then(() => {
  configurePathProvider({
    home: () => app.getPath("home"),
    appData: () => app.getPath("appData"),
    userData: () => app.getPath("userData")
  });
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
