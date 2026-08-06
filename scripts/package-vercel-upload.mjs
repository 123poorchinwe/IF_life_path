import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .trim()
  .split(/\r?\n/)
  .filter(
    (file) =>
      file &&
      !file.startsWith("public/assets/") &&
      file !== "package-lock.json" &&
      !file.endsWith(".md") &&
      file !== "src/app/favicon.ico" &&
      !file.startsWith(".github/") &&
      !file.startsWith("scripts/"),
  );

const payload = files.map((file) => {
  let data = readFileSync(file, "utf8");
  if (file === "src/components/career-map/PhaserCareerWorld.tsx") {
    data = data.replace(
      'withPublicBasePath("/assets/pixel/career-town-v1.webp")',
      '"https://raw.githubusercontent.com/123poorchinwe/IF_life_path/main/public/assets/pixel/career-town-v1.webp"',
    );
  }
  return { file, data };
});

process.stdout.write(JSON.stringify(payload));
