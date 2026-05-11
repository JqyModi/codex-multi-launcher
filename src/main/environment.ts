import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { DEFAULT_CODEX_APP_PATH, codexExecutablePath, getAppPaths } from "./paths.js";
import { isWritableDirectory, pathExists } from "./fs-utils.js";
import type { EnvironmentCheck, EnvironmentReport } from "../shared/types.js";

const execFileAsync = promisify(execFile);

async function findCodexCli(): Promise<{ path: string | null; version: string | null }> {
  try {
    const whichResult = await execFileAsync("which", ["codex"]);
    const cliPath = whichResult.stdout.trim();
    if (!cliPath) {
      return { path: null, version: null };
    }

    const versionResult = await execFileAsync(cliPath, ["--version"]);
    return {
      path: cliPath,
      version: versionResult.stdout.trim() || null
    };
  } catch {
    return { path: null, version: null };
  }
}

function checkStatus(condition: boolean, failDetail: string, passDetail: string): Pick<EnvironmentCheck, "status" | "detail"> {
  return condition
    ? { status: "pass", detail: passDetail }
    : { status: "fail", detail: failDetail };
}

export async function getEnvironmentReport(codexAppPath = DEFAULT_CODEX_APP_PATH): Promise<EnvironmentReport> {
  const appPaths = getAppPaths();
  const executablePath = codexExecutablePath(codexAppPath);
  const [codexAppExists, codexExecutableExists, cli, launcherWritable, profileRootWritable, appDataWritable] =
    await Promise.all([
      pathExists(codexAppPath),
      pathExists(executablePath),
      findCodexCli(),
      isWritableDirectory(appPaths.defaultLauncherRoot),
      isWritableDirectory(appPaths.defaultProfileRoot),
      isWritableDirectory(appPaths.appDataDir)
    ]);

  const appCheck = checkStatus(
    codexAppExists,
    "Codex.app was not found. Select the Codex app manually before creating profiles.",
    "Codex.app was found."
  );
  const executableCheck = checkStatus(
    codexExecutableExists,
    "Codex executable was not found inside the app bundle.",
    "Codex executable was found."
  );

  const checks: EnvironmentCheck[] = [
    {
      id: "codex-app",
      label: "Codex App",
      path: codexAppPath,
      ...appCheck
    },
    {
      id: "codex-executable",
      label: "Codex executable",
      path: executablePath,
      ...executableCheck
    },
    {
      id: "codex-cli",
      label: "Codex CLI",
      path: cli.path ?? undefined,
      status: cli.path ? "pass" : "warn",
      detail: cli.path ? `Detected ${cli.version ?? "unknown version"}.` : "Codex CLI was not found. Desktop profile launch can still work."
    },
    {
      id: "launcher-root",
      label: "Launcher directory",
      path: appPaths.defaultLauncherRoot,
      status: launcherWritable ? "pass" : "fail",
      detail: launcherWritable ? "Default launcher directory is writable." : "Default launcher directory is not writable."
    },
    {
      id: "profile-root",
      label: "Profile directory",
      path: appPaths.defaultProfileRoot,
      status: profileRootWritable ? "pass" : "fail",
      detail: profileRootWritable ? "Default profile directory is writable." : "Default profile directory is not writable."
    },
    {
      id: "app-data",
      label: "Manager data directory",
      path: appPaths.appDataDir,
      status: appDataWritable ? "pass" : "fail",
      detail: appDataWritable ? "Manager data directory is writable." : "Manager data directory is not writable."
    }
  ];

  return {
    codexAppPath,
    codexExecutablePath: executablePath,
    codexAppExists,
    codexExecutableExists,
    codexCliPath: cli.path,
    codexCliVersion: cli.version,
    checks
  };
}
