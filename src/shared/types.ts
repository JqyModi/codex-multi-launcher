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

export interface ManagedProfile {
  id: string;
  name: string;
  status: ProfileStatus;
  paths: ProfilePaths;
  provider: ProviderConfig;
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

export interface ProfileRegistry {
  schemaVersion: 1;
  profiles: ManagedProfile[];
}

export interface CreateProfileInput {
  name: string;
  codexAppPath?: string;
  launcherDirectory?: string;
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

export interface ProviderTestInput {
  baseUrl: string;
  apiKey: string;
  model: string;
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

export interface CodexApi {
  getEnvironmentReport(): Promise<EnvironmentReport>;
  pickLauncherDirectory(): Promise<string | null>;
  revealPath(path: string): Promise<{ ok: true }>;
  listProfiles(): Promise<ManagedProfile[]>;
  getRuntimeStatus(): Promise<ProfileRuntimeInfo[]>;
  testProvider(input: ProviderTestInput): Promise<ProviderTestResult>;
  createProfile(input: CreateProfileInput): Promise<CreateProfileResult>;
  deleteProfile(profileId: string): Promise<{ ok: true }>;
  generateLauncher(profileId: string): Promise<LauncherResult>;
  openProfile(profileId: string): Promise<{ pid: number | null }>;
}
