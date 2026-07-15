import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const testRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-profile-manager-win-inherit-"));
process.env.CODEX_PROFILE_MANAGER_HOME_OVERRIDE = testRoot;
process.env.CODEX_PROFILE_MANAGER_PLATFORM_OVERRIDE = "win32";

const defaultCodexHome = path.join(testRoot, ".codex");
const cacheVersionPath = path.join(defaultCodexHome, "plugins", "cache", "openai-bundled", "chrome", "26.623.61825");
const cacheLatestPath = path.join(defaultCodexHome, "plugins", "cache", "openai-bundled", "chrome", "latest");
const bundledMarketplacePath = path.join(defaultCodexHome, ".tmp", "bundled-marketplaces", "openai-bundled", "plugins", "chrome");
const pluginManifestPath = path.join(defaultCodexHome, "plugins", "sample-plugin", ".codex-plugin", "plugin.json");

await fs.mkdir(cacheVersionPath, { recursive: true });
await fs.writeFile(path.join(cacheVersionPath, "manifest.json"), "{}\n", { mode: 0o600 });
await fs.mkdir(path.dirname(cacheLatestPath), { recursive: true });
await fs.symlink(cacheVersionPath, cacheLatestPath, "junction");
await fs.mkdir(bundledMarketplacePath, { recursive: true });
await fs.writeFile(path.join(bundledMarketplacePath, "plugin.json"), "{}\n", { mode: 0o600 });
await fs.mkdir(path.dirname(pluginManifestPath), { recursive: true });
await fs.writeFile(pluginManifestPath, "{\"name\":\"sample-plugin\"}\n", { mode: 0o600 });
await fs.writeFile(path.join(defaultCodexHome, "config.toml"), "model = \"gpt-5.5\"\n", { mode: 0o600 });

const { createProfile, permanentlyDeleteProfile } = await import("../dist-electron/main/profile-service.js");

const result = await createProfile({
  name: "Codex Sandbox 6",
  inheritDefaultConfig: true,
  codexAppPath: "C:\\Program Files\\Codex\\Codex.exe",
  provider: {
    type: "third_party_responses",
    displayName: "E2E Proxy",
    baseUrl: "https://proxy.example.com/v1",
    model: "gpt-5.2",
    apiKey: "sk-test-windows-inheritance",
    reasoningEffort: "medium"
  }
});

const inheritedPluginManifest = path.join(result.profile.paths.codexHome, "plugins", "sample-plugin", ".codex-plugin", "plugin.json");
const skippedCache = path.join(result.profile.paths.codexHome, "plugins", "cache");
const skippedTmp = path.join(result.profile.paths.codexHome, ".tmp");

assert(await exists(inheritedPluginManifest), "regular plugin files should still be inherited on Windows");
assert(!(await exists(skippedCache)), "Windows inheritance should skip plugins/cache to avoid symlink EPERM");
assert(!(await exists(skippedTmp)), "Windows inheritance should skip .codex/.tmp cache files");

await permanentlyDeleteProfile(result.profile.id);
await fs.rm(testRoot, { recursive: true, force: true });

console.log("Windows inheritance verification passed.");

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
