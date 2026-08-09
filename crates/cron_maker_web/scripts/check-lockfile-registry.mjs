import { readFile } from "node:fs/promises";
import process from "node:process";

const lockfilePath = process.argv[2] ?? "package-lock.json";
const allowedHost = "registry.npmjs.org";

let lockfile;
try {
  lockfile = JSON.parse(await readFile(lockfilePath, "utf8"));
} catch (error) {
  console.error(`Unable to read ${lockfilePath}: ${error.message}`);
  process.exit(1);
}

const invalidEntries = [];
let resolvedCount = 0;

for (const [packagePath, metadata] of Object.entries(lockfile.packages ?? {})) {
  if (typeof metadata.resolved !== "string") {
    continue;
  }

  resolvedCount += 1;
  try {
    const resolved = new URL(metadata.resolved);
    if (resolved.protocol !== "https:" || resolved.hostname !== allowedHost) {
      invalidEntries.push(`${packagePath || "<root>"}: ${metadata.resolved}`);
    }
  } catch {
    invalidEntries.push(`${packagePath || "<root>"}: ${metadata.resolved}`);
  }
}

if (invalidEntries.length > 0) {
  console.error(`package-lock.json contains ${invalidEntries.length} non-official registry URL(s):`);
  invalidEntries.forEach((entry) => console.error(`- ${entry}`));
  process.exit(1);
}

console.log(`Verified ${resolvedCount} package URLs from https://${allowedHost}/.`);
