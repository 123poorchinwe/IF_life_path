import { existsSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiDirectory = join(projectRoot, "src", "app", "api");
const apiBackup = join(projectRoot, ".static-api-backup");

if (existsSync(apiBackup)) {
  throw new Error("Static API backup already exists; restore it before building.");
}

try {
  if (existsSync(apiDirectory)) renameSync(apiDirectory, apiBackup);
  const executable = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(executable, ["run", "build"], {
    cwd: projectRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      STATIC_EXPORT: "1",
      NEXT_PUBLIC_STATIC_EXPORT: "true",
      NEXT_PUBLIC_BASE_PATH:
        process.env.NEXT_PUBLIC_BASE_PATH || "/IF_life_path",
    },
  });
  if (result.status !== 0) process.exitCode = result.status || 1;
} finally {
  if (existsSync(apiBackup)) renameSync(apiBackup, apiDirectory);
}
