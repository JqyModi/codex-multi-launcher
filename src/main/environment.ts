import { getAppPaths, getDefaultCodexAppPath, getRuntimePlatform, resolveCodexDesktopApp } from "./paths.js";
import { isWritableDirectory, pathExists } from "./fs-utils.js";
import { findExecutable } from "./executable-lookup.js";
import type { EnvironmentCheck, EnvironmentReport } from "../shared/types.js";

function checkStatus(condition: boolean, failDetail: string, passDetail: string): Pick<EnvironmentCheck, "status" | "detail"> {
  return condition
    ? { status: "pass", detail: passDetail }
    : { status: "fail", detail: failDetail };
}

export async function getEnvironmentReport(codexAppPath = getDefaultCodexAppPath()): Promise<EnvironmentReport> {
  const appPaths = getAppPaths();
  const desktopApp = resolveCodexDesktopApp(codexAppPath);
  const executablePath = desktopApp.executablePath;
  const [codexAppExists, codexExecutableExists, cli, nodeRuntime, launcherWritable, profileRootWritable, appDataWritable] =
    await Promise.all([
      pathExists(desktopApp.appPath),
      pathExists(executablePath),
      findExecutable("codex"),
      findExecutable("node"),
      isWritableDirectory(appPaths.defaultLauncherRoot),
      isWritableDirectory(appPaths.defaultProfileRoot),
      isWritableDirectory(appPaths.appDataDir)
    ]);

  const appCheck = checkStatus(
    codexAppExists,
    getRuntimePlatform() === "win32" ? "ChatGPT/Codex desktop app was not found. Select the app executable manually before creating profiles." : "ChatGPT/Codex desktop app was not found. Select the app manually before creating profiles.",
    `${desktopApp.productName} desktop app was found.`
  );
  const executableCheck = checkStatus(
    codexExecutableExists,
    getRuntimePlatform() === "win32" ? "Desktop app executable was not found." : "Desktop app executable was not found inside the app bundle.",
    `${desktopApp.productName} executable was found.`
  );

  const checks: EnvironmentCheck[] = [
    {
      id: "codex-app",
      label: "Codex App",
      importance: "required",
      path: desktopApp.appPath,
      ...appCheck
    },
    {
      id: "codex-executable",
      label: "Codex executable",
      importance: "required",
      path: executablePath,
      ...executableCheck
    },
    {
      id: "codex-cli",
      label: "Codex CLI",
      importance: "optional",
      path: cli.path ?? undefined,
      status: cli.path ? "pass" : "warn",
      detail: cli.path ? `Detected ${cli.version ?? "unknown version"}.` : "Codex CLI was not found. Desktop profile launch can still work."
    },
    {
      id: "node-runtime",
      label: "Node runtime",
      importance: "optional",
      path: nodeRuntime.path ?? undefined,
      status: nodeRuntime.path ? "pass" : "warn",
      detail: nodeRuntime.path
        ? `Detected ${nodeRuntime.version ?? "unknown version"}. The manager opens profiles without relying on external Node.`
        : "Node was not found. Profile launch no longer depends on external Node; only custom inherited tools may need it."
    },
    {
      id: "launcher-root",
      label: "Launcher directory",
      importance: "required",
      path: appPaths.defaultLauncherRoot,
      status: launcherWritable ? "pass" : "fail",
      detail: launcherWritable ? "Default launcher directory is writable." : "Default launcher directory is not writable."
    },
    {
      id: "profile-root",
      label: "Profile directory",
      importance: "required",
      path: appPaths.defaultProfileRoot,
      status: profileRootWritable ? "pass" : "fail",
      detail: profileRootWritable ? "Default profile directory is writable." : "Default profile directory is not writable."
    },
    {
      id: "app-data",
      label: "Manager data directory",
      importance: "required",
      path: appPaths.appDataDir,
      status: appDataWritable ? "pass" : "fail",
      detail: appDataWritable ? "Manager data directory is writable." : "Manager data directory is not writable."
    }
  ];

  return {
    codexAppPath: desktopApp.appPath,
    codexExecutablePath: executablePath,
    codexAppExists,
    codexExecutableExists,
    codexCliPath: cli.path,
    codexCliVersion: cli.version,
    nodePath: nodeRuntime.path,
    nodeVersion: nodeRuntime.version,
    checks
  };
}
