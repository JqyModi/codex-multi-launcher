import { spawn } from "node:child_process";
import path from "node:path";

const pendingPackageLaunches = new Map<string, Promise<void>>();

export async function launchWindowsPackagedApp(options: {
  packageFullName: string;
  appUserModelId: string;
  arguments: string;
  environment: Record<string, string>;
}): Promise<{ pid: number }> {
  const previous = pendingPackageLaunches.get(options.packageFullName) ?? Promise.resolve();
  const launch = previous.then(() => runWindowsPackagedApp(options));
  const settled = launch.then(() => {}, () => {});
  pendingPackageLaunches.set(options.packageFullName, settled);
  void settled.then(() => {
    if (pendingPackageLaunches.get(options.packageFullName) === settled) {
      pendingPackageLaunches.delete(options.packageFullName);
    }
  });
  return launch;
}

function runWindowsPackagedApp(options: {
  packageFullName: string;
  appUserModelId: string;
  arguments: string;
  environment: Record<string, string>;
}): Promise<{ pid: number }> {
  const helperPath = resolveHelperPath();
  const payload = JSON.stringify(options);
  return new Promise((resolve, reject) => {
    const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", helperPath], {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk; });
    child.once("error", (error) => reject(new Error(`Windows packaged-launch helper unavailable: ${error.message}`)));
    child.once("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Windows packaged launch failed: ${stderr.trim() || "helper exited without an error message"}`));
        return;
      }
      try {
        const parsed = JSON.parse(stdout.trim()) as { pid?: unknown };
        if (typeof parsed.pid !== "number" || parsed.pid <= 0) throw new Error("helper returned an invalid PID");
        resolve({ pid: parsed.pid });
      } catch (error) {
        reject(new Error(`Windows packaged-launch helper returned invalid output: ${error instanceof Error ? error.message : String(error)}`));
      }
    });
    child.stdin.end(payload, "utf8");
  });
}

function resolveHelperPath(): string {
  const defaultApp = (process as NodeJS.Process & { defaultApp?: boolean }).defaultApp;
  return defaultApp || !process.resourcesPath
    ? path.resolve(process.cwd(), "resources", "windows-packaged-launch.ps1")
    : path.join(process.resourcesPath, "windows-packaged-launch.ps1");
}
