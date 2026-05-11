import { getEnvironmentReport } from "./environment.js";
import { listConfigBackups } from "./codex-config.js";
import { listProfiles } from "./registry.js";
import { getRuntimeStatus } from "./runtime.js";
import type { DiagnosticsReport } from "../shared/types.js";

export async function getDiagnosticsReport(): Promise<DiagnosticsReport> {
  const [environment, profiles] = await Promise.all([
    getEnvironmentReport(),
    listProfiles(true)
  ]);
  const runtimeStatuses = await getRuntimeStatus(profiles.filter((profile) => profile.status !== "deleted"));
  const profileRows = await Promise.all(profiles.map(async (profile) => ({
    id: profile.id,
    name: profile.name,
    status: profile.status,
    provider: {
      type: profile.provider.type,
      displayName: profile.provider.displayName,
      baseUrl: profile.provider.baseUrl,
      model: profile.provider.model,
      envKeyName: profile.provider.envKeyName
    },
    paths: profile.paths,
    runtime: runtimeStatuses.find((runtime) => runtime.profileId === profile.id),
    backupCount: (await listConfigBackups(profile)).length
  })));

  return {
    generatedAt: new Date().toISOString(),
    environment,
    profiles: profileRows
  };
}
