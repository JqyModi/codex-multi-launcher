import { copyFile } from "node:fs/promises";

await copyFile("src/preload/index.cjs", "dist-electron/preload/index.cjs");
