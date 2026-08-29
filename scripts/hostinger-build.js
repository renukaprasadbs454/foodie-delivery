const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const appMap = {
  admin: "foodie-admin",
  customer: "foodie-customer",
  delivery: "foodie-delivery",
  restaurant: "foodie-restaurant",
};

const selectedApp = process.env.HOSTINGER_APP;

if (!selectedApp || !Object.prototype.hasOwnProperty.call(appMap, selectedApp)) {
  const valid = Object.keys(appMap).join(", ");
  console.error(
    `HOSTINGER_APP must be set to one of: ${valid}\n` +
      "Example: HOSTINGER_APP=admin pnpm run build",
  );
  process.exit(1);
}

const packageName = appMap[selectedApp];

function getCorepackPnpmCandidates() {
  const candidates = [];
  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    candidates.push(path.join(localAppData, "node", "corepack", "v1", "pnpm", "11.24.0", "bin", "pnpm.mjs"));
  }

  const home = os.homedir();
  candidates.push(path.join(home, ".local", "share", "node", "corepack", "v1", "pnpm", "11.24.0", "bin", "pnpm.mjs"));
  candidates.push(path.join(home, ".cache", "node", "corepack", "v1", "pnpm", "11.24.0", "bin", "pnpm.mjs"));

  return candidates;
}

function getPnpmLauncher() {
  for (const candidate of getCorepackPnpmCandidates()) {
    if (fs.existsSync(candidate)) {
      return {
        command: process.execPath,
        args: [candidate, "--filter", `${packageName}...`, "build"],
        binDir: path.dirname(candidate),
      };
    }
  }

  return {
    command: "corepack",
    args: ["pnpm", "--filter", `${packageName}...`, "build"],
    binDir: null,
  };
}

const launcher = getPnpmLauncher();
const env = {
  ...process.env,
  PATH: launcher.binDir ? `${launcher.binDir}${path.delimiter}${process.env.PATH ?? ""}` : process.env.PATH,
};

const result = spawnSync(launcher.command, launcher.args, {
  stdio: "inherit",
  cwd: path.resolve(__dirname, ".."),
  env,
  shell: launcher.command === "corepack" && process.platform === "win32",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
