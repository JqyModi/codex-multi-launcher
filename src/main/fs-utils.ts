import fs from "node:fs/promises";
import path from "node:path";

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(targetPath: string): Promise<void> {
  await fs.mkdir(targetPath, { recursive: true });
}

export async function isWritableDirectory(targetPath: string): Promise<boolean> {
  try {
    await ensureDir(targetPath);
    const probe = path.join(targetPath, `.write-test-${Date.now()}`);
    await fs.writeFile(probe, "ok", { mode: 0o600 });
    await fs.unlink(probe);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
}
