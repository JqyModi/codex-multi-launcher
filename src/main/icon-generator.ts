import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { ensureDir } from "./fs-utils.js";

const execFileAsync = promisify(execFile);

const ICONSET_SIZES: Array<[number, string]> = [
  [16, "icon_16x16.png"],
  [32, "icon_16x16@2x.png"],
  [32, "icon_32x32.png"],
  [64, "icon_32x32@2x.png"],
  [128, "icon_128x128.png"],
  [256, "icon_128x128@2x.png"],
  [256, "icon_256x256.png"],
  [512, "icon_256x256@2x.png"],
  [512, "icon_512x512.png"],
  [1024, "icon_512x512@2x.png"]
];

export async function generateProfileIcon(iconPath: string, backgroundColor: string): Promise<void> {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-profile-icon-"));

  try {
    const svgPath = path.join(tempRoot, "profile-icon.svg");
    const logoDataUrl = await readLogoDataUrl();
    const sourcePngPathForResize = path.join(tempRoot, "profile-icon.png");
    const iconsetPath = path.join(tempRoot, "profile-icon.iconset");

    await fs.writeFile(svgPath, renderCompositedIconSvg(backgroundColor, logoDataUrl));
    await execFileAsync("sips", ["-s", "format", "png", svgPath, "--out", sourcePngPathForResize]);
    await ensureDir(iconsetPath);
    await Promise.all(
      ICONSET_SIZES.map(([size, filename]) => execFileAsync("sips", ["-z", String(size), String(size), sourcePngPathForResize, "--out", path.join(iconsetPath, filename)]))
    );
    await execFileAsync("iconutil", ["-c", "icns", iconsetPath, "-o", iconPath]);
  } finally {
    await fs.rm(tempRoot, { force: true, recursive: true });
  }
}

async function readLogoDataUrl(): Promise<string> {
  const logoSvg = await fs.readFile(await resolveLogoPath(), "utf8");
  return `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString("base64")}`;
}

async function resolveLogoPath(): Promise<string> {
  const candidates = [
    path.join(process.resourcesPath ?? "", "app.asar", "assets", "codex-logo.svg"),
    path.join(process.resourcesPath ?? "", "app", "assets", "codex-logo.svg"),
    path.resolve(process.cwd(), "assets", "codex-logo.svg")
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next known app layout.
    }
  }

  throw new Error(`assets/codex-logo.svg not found. Checked: ${candidates.join(", ")}`);
}

function renderCompositedIconSvg(backgroundColor: string, logoDataUrl: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <clipPath id="app-shape">
      <rect width="1024" height="1024" rx="230"/>
    </clipPath>
    <filter id="logo-shadow" x="112" y="112" width="800" height="800" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="26" stdDeviation="30" flood-color="#0F172A" flood-opacity=".24"/>
    </filter>
  </defs>
  <rect width="1024" height="1024" rx="230" fill="${backgroundColor}"/>
  <g clip-path="url(#app-shape)">
    <rect width="1024" height="1024" fill="${backgroundColor}"/>
    <image href="${logoDataUrl}" x="184" y="184" width="656" height="656" preserveAspectRatio="xMidYMid meet" filter="url(#logo-shadow)"/>
  </g>
</svg>
`;
}
