export type ProviderType = "official_openai" | "third_party_responses";

export type ProfileStatus = "active" | "disabled" | "deleted";

export type RuntimeStatus = "running" | "not_running" | "unknown" | "error";

export interface AppPaths {
  appDataDir: string;
  profilesFile: string;
  secretsFile: string;
  masterKeyFile: string;
  defaultProfileRoot: string;
  defaultUserDataRoot: string;
  defaultLauncherRoot: string;
}

export interface EnvironmentCheck {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
  path?: string;
}

export interface EnvironmentReport {
  codexAppPath: string;
  codexExecutablePath: string;
  codexAppExists: boolean;
  codexExecutableExists: boolean;
  codexCliPath: string | null;
  codexCliVersion: string | null;
  nodePath: string | null;
  nodeVersion: string | null;
  checks: EnvironmentCheck[];
}

export interface ProviderConfig {
  type: ProviderType;
  id: string;
  displayName: string;
  baseUrl?: string;
  wireApi: "responses";
  envKeyName: string;
  model: string;
  reasoningEffort: "low" | "medium" | "high" | "xhigh";
}

export interface ProfilePaths {
  codexAppPath: string;
  codexHome: string;
  userDataDir: string;
  launcherPath: string;
}

export interface LaunchMetadata {
  lastLaunchedAt: string | null;
  lastKnownPid: number | null;
  lastKnownUserDataDir: string;
}

export interface ProfileAppearance {
  iconBackgroundColor: string;
}

export interface ManagedProfile {
  id: string;
  name: string;
  status: ProfileStatus;
  paths: ProfilePaths;
  provider: ProviderConfig;
  appearance: ProfileAppearance;
  launch: LaunchMetadata;
  timestamps: {
    createdAt: string;
    updatedAt: string;
  };
}

export interface ProfileRuntimeInfo {
  profileId: string;
  status: RuntimeStatus;
  pid: number | null;
  detail: string;
}

export interface ConfigBackupInfo {
  profileId: string;
  backupPath: string;
  createdAt: string;
  reason: string;
}

export interface DiagnosticsReport {
  generatedAt: string;
  environment: EnvironmentReport;
  profiles: Array<{
    id: string;
    name: string;
    status: ProfileStatus;
    provider: {
      type: ProviderType;
      displayName: string;
      baseUrl?: string;
      model: string;
      envKeyName: string;
    };
    paths: ProfilePaths;
    appearance: ProfileAppearance;
    runtime?: ProfileRuntimeInfo;
    backupCount: number;
  }>;
}

export interface ProfileRegistry {
  schemaVersion: 1;
  profiles: ManagedProfile[];
}

export type SessionHistorySyncScope = "projects" | "tasks" | "all";

export type SessionHistorySyncSourceType = "default" | "profile";

export interface SessionHistorySyncSourceInput {
  type: SessionHistorySyncSourceType;
  profileId?: string;
}

export interface SessionHistorySyncInput {
  enabled: boolean;
  scope: SessionHistorySyncScope;
  sources?: SessionHistorySyncSourceInput[];
}

export interface SessionHistorySyncResolvedSource {
  type: SessionHistorySyncSourceType;
  label: string;
  codexHome: string;
  profileId?: string;
}

export interface CreateProfileInput {
  name: string;
  codexAppPath?: string;
  inheritDefaultConfig?: boolean;
  syncHistory?: SessionHistorySyncInput;
  launcherDirectory?: string;
  appearance?: Partial<ProfileAppearance>;
  provider: {
    type: ProviderType;
    displayName: string;
    baseUrl?: string;
    model: string;
    apiKey: string;
    reasoningEffort?: ProviderConfig["reasoningEffort"];
  };
}

export interface CreateProfileResult {
  profile: ManagedProfile;
  configPath: string;
  launcherPath: string;
}

export interface UpdateProfileInput {
  profileId: string;
  appearance?: Partial<ProfileAppearance>;
  provider: {
    displayName: string;
    baseUrl?: string;
    model: string;
    apiKey?: string;
    reasoningEffort?: ProviderConfig["reasoningEffort"];
  };
}

export interface UpdateProfileResult {
  profile: ManagedProfile;
  configPath: string;
  launcherPath: string;
}

export interface RestoreConfigBackupInput {
  profileId: string;
  backupPath: string;
}

export interface RestoreConfigBackupResult {
  profileId: string;
  configPath: string;
  restoredFrom: string;
}

export interface ProviderTestInput {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ProfileProviderTestInput {
  profileId: string;
  baseUrl?: string;
  apiKey?: string;
  model: string;
}

export interface ProviderModelOption {
  id: string;
  displayName?: string;
}

export interface ProviderModelsInput {
  baseUrl: string;
  apiKey: string;
}

export interface ProfileProviderModelsInput {
  profileId: string;
  baseUrl?: string;
  apiKey?: string;
}

export interface ProviderModelsResult {
  status: "passed" | "auth_failed" | "unreachable" | "invalid_url" | "no_models" | "unknown_error";
  ok: boolean;
  summary: string;
  details: string;
  models: ProviderModelOption[];
  httpStatus?: number;
}

export interface ProviderTestResult {
  status: "passed" | "auth_failed" | "unreachable" | "responses_unsupported" | "invalid_url" | "unknown_error";
  ok: boolean;
  summary: string;
  details: string;
  testedModelsEndpoint: boolean;
  testedResponsesEndpoint: boolean;
  httpStatus?: number;
}

export interface LauncherResult {
  launcherPath: string;
  executablePath: string;
}

export interface AppInfo {
  name: string;
  version: string;
  author: string;
  authorUrl: string;
  repositoryUrl: string;
  releasesUrl: string;
  issuesUrl: string;
  sponsorUrl: string;
  productPageUrl: string;
}

export interface UpdateCheckResult {
  status: "up_to_date" | "update_available" | "error";
  currentVersion: string;
  latestVersion: string | null;
  releaseName?: string;
  releaseUrl?: string;
  publishedAt?: string;
  changelog?: string;
  error?: string;
}

export interface UpdateDownloadEvent {
  state: "downloading" | "downloaded" | "installing" | "installed" | "error";
  progress?: number;
  version?: string;
  error?: string;
}

export type AnnouncementPlatform = "aix" | "android" | "darwin" | "freebsd" | "haiku" | "linux" | "openbsd" | "sunos" | "win32" | "cygwin" | "netbsd";

export interface AnnouncementItem {
  id: string;
  enabled: boolean;
  priority: number;
  placement: "dashboard_top";
  type: "info" | "promo" | "warning" | "success";
  label?: string;
  title: string;
  description?: string;
  ctaText?: string;
  ctaUrl?: string;
  startAt?: string;
  endAt?: string;
  platforms?: AnnouncementPlatform[];
  minAppVersion?: string;
  maxAppVersion?: string | null;
  dismissible?: boolean;
}

export interface AnnouncementResult {
  item: AnnouncementItem | null;
  source: "remote" | "cache" | "none";
  fetchedAt?: string;
}

export interface CodexApi {
  getAppInfo(): Promise<AppInfo>;
  getAnnouncement(): Promise<AnnouncementResult>;
  dismissAnnouncement(id: string): Promise<{ ok: true }>;
  checkForUpdates(): Promise<UpdateCheckResult>;
  downloadUpdate(): Promise<{ ok: true }>;
  installUpdate(): Promise<{ ok: true }>;
  onUpdateEvent(listener: (event: UpdateDownloadEvent) => void): () => void;
  openExternalUrl(url: string): Promise<{ ok: true }>;
  getEnvironmentReport(): Promise<EnvironmentReport>;
  getDiagnosticsReport(): Promise<DiagnosticsReport>;
  pickCodexAppPath(): Promise<string | null>;
  pickLauncherDirectory(): Promise<string | null>;
  revealPath(path: string): Promise<{ ok: true }>;
  listProfiles(includeDeleted?: boolean): Promise<ManagedProfile[]>;
  listConfigBackups(profileId: string): Promise<ConfigBackupInfo[]>;
  getRuntimeStatus(): Promise<ProfileRuntimeInfo[]>;
  testProvider(input: ProviderTestInput): Promise<ProviderTestResult>;
  testProfileProvider(input: ProfileProviderTestInput): Promise<ProviderTestResult>;
  listProviderModels(input: ProviderModelsInput): Promise<ProviderModelsResult>;
  listProfileProviderModels(input: ProfileProviderModelsInput): Promise<ProviderModelsResult>;
  createProfile(input: CreateProfileInput): Promise<CreateProfileResult>;
  updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult>;
  restoreConfigBackup(input: RestoreConfigBackupInput): Promise<RestoreConfigBackupResult>;
  deleteProfile(profileId: string): Promise<{ ok: true }>;
  permanentlyDeleteProfile(profileId: string): Promise<{ ok: true }>;
  restoreProfile(profileId: string): Promise<{ ok: true }>;
  generateLauncher(profileId: string): Promise<LauncherResult>;
  openProfile(profileId: string): Promise<{ pid: number | null }>;
}
