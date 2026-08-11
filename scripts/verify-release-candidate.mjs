import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { extractFile, listPackage } from "@electron/asar";

const projectDir = process.cwd();
const distDir = path.resolve(projectDir, process.env.RELEASE_DIST_DIR || "dist-app");
const packageJson = JSON.parse(await fs.readFile(path.join(projectDir, "package.json"), "utf8"));
const version = packageJson.version;
const macArch = process.env.RELEASE_MAC_ARCH || "x64";
const winArch = process.env.RELEASE_WIN_ARCH || "x64";

const requiredArtifacts = [
  `Codex-Profile-Manager-Setup-${version}-${winArch}.exe`,
  `Codex-Profile-Manager-Portable-${version}-${winArch}.exe`,
  `codex-profile-manager-${version}-${macArch}-mac.zip`,
  "latest.yml",
  "latest-mac.yml",
];

const forbiddenArchivePath = /(^|\/)(?:\.env(?:\.|$)|logs?(?:\/|$)|[^/]*\.log$|[^/]*\.(?:key|p8|p12|pem)$|(?:credentials?|secrets?)\.(?:json|ya?ml)$)/i;

async function assertFile(filePath) {
  const stat = await fs.stat(filePath);
  if (!stat.isFile() || stat.size === 0) {
    throw new Error(`Release artifact is empty: ${filePath}`);
  }
  return stat;
}

async function findMacAsar() {
  const macDir = path.join(distDir, macArch === "x64" ? "mac" : `mac-${macArch}`);
  const entries = await fs.readdir(macDir, { withFileTypes: true });
  const app = entries.find((entry) => entry.isDirectory() && entry.name.endsWith(".app"));
  if (!app) {
    throw new Error(`No macOS app found in ${macDir}`);
  }
  return path.join(macDir, app.name, "Contents", "Resources", "app.asar");
}

async function verifyAsar(archivePath, label) {
  await assertFile(archivePath);
  const files = listPackage(archivePath);
  const forbidden = files.filter((file) => forbiddenArchivePath.test(file));
  if (forbidden.length > 0) {
    throw new Error(`${label} contains forbidden files: ${forbidden.join(", ")}`);
  }

  const archivedPackage = JSON.parse(extractFile(archivePath, "package.json").toString("utf8"));
  if (archivedPackage.version !== version) {
    throw new Error(`${label} version ${archivedPackage.version} does not match ${version}`);
  }

  return files.length;
}

async function sha256(filePath) {
  const hash = createHash("sha256");
  const handle = await fs.open(filePath, "r");
  try {
    for await (const chunk of handle.createReadStream()) {
      hash.update(chunk);
    }
  } finally {
    await handle.close();
  }
  return hash.digest("hex");
}

for (const artifact of requiredArtifacts) {
  await assertFile(path.join(distDir, artifact));
}

for (const metadataName of ["latest.yml", "latest-mac.yml"]) {
  const metadata = await fs.readFile(path.join(distDir, metadataName), "utf8");
  if (!metadata.includes(`version: ${version}`)) {
    throw new Error(`${metadataName} does not declare version ${version}`);
  }
}

const macAsar = await findMacAsar();
const winAsar = path.join(distDir, "win-unpacked", "resources", "app.asar");
const macFileCount = await verifyAsar(macAsar, "macOS app.asar");
const winFileCount = await verifyAsar(winAsar, "Windows app.asar");

const checksumNames = [
  ...requiredArtifacts,
  `Codex-Profile-Manager-Setup-${version}-${winArch}.exe.blockmap`,
  `codex-profile-manager-${version}-${macArch}-mac.zip.blockmap`,
];
const checksumLines = [];
for (const name of checksumNames) {
  const filePath = path.join(distDir, name);
  await assertFile(filePath);
  checksumLines.push(`${await sha256(filePath)}  ${name}`);
}

const checksumFile = path.join(distDir, `SHA256SUMS-v${version}.txt`);
await fs.writeFile(checksumFile, `${checksumLines.join("\n")}\n`, "utf8");

console.log(`Release candidate verification passed for v${version}.`);
console.log(`macOS asar files: ${macFileCount}`);
console.log(`Windows asar files: ${winFileCount}`);
console.log(`Checksums: ${checksumFile}`);
