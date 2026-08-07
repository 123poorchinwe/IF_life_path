import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "dist", "cloudbase-function");
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
await build({
  entryPoints: [join(root, "src", "cloudbase-api-server.ts")],
  outfile: join(output, "index.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  tsconfig: join(root, "tsconfig.json"),
  minify: true,
  sourcemap: false,
  logLevel: "info",
});

writeFileSync(
  join(output, "scf_bootstrap"),
  [
    "#!/bin/bash",
    "export PORT=9000",
    "export HOSTNAME=0.0.0.0",
    "export NODE_ENV=production",
    "exec /var/lang/node20/bin/node index.cjs",
    "",
  ].join("\n"),
  { encoding: "utf8", mode: 0o755 },
);

writeFileSync(join(output, "package.json"), JSON.stringify({ name: "if-life-api", version: "1.0.0", private: true, main: "index.cjs" }, null, 2));

writeFileSync(
  join(output, "cloudbase-function.json"),
  JSON.stringify(
    {
      name: "if-life-api",
      runtime: "Nodejs20.19",
      type: "HTTP",
      port: 9000,
      healthPath: "/api/dialogue",
    },
    null,
    2,
  ),
);

console.log(`CloudBase HTTP function bundle created at ${output}`);
