import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const iconset = "build/icon.iconset";
const sourcePng = `${iconset}/icon_512x512@2x.png`;

await fs.rm("build", { recursive: true, force: true });
await fs.mkdir(iconset, { recursive: true });
await execFileAsync("qlmanage", ["-t", "-s", "1024", "-o", iconset, "assets/icon.svg"]);
await fs.rename(`${iconset}/icon.svg.png`, sourcePng);

const sizes = [
  ["16", "icon_16x16.png"],
  ["32", "icon_16x16@2x.png"],
  ["32", "icon_32x32.png"],
  ["64", "icon_32x32@2x.png"],
  ["128", "icon_128x128.png"],
  ["256", "icon_128x128@2x.png"],
  ["256", "icon_256x256.png"],
  ["512", "icon_256x256@2x.png"],
  ["512", "icon_512x512.png"]
];

for (const [size, filename] of sizes) {
  await execFileAsync("sips", ["-z", size, size, sourcePng, "--out", `${iconset}/${filename}`]);
}

await execFileAsync("iconutil", ["-c", "icns", iconset, "-o", "build/icon.icns"]);
console.log("Icon generated at build/icon.icns");
