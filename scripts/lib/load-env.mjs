// Layered env loading. Priority (highest first): shell env > .env.local > .env.dev (dev only) > .env
// process.loadEnvFile never overwrites an already-set variable, so load highest priority first.
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

export function loadLayeredEnv(mode) {
  if (!["dev", "prod"].includes(mode)) {
    throw new Error(`Unknown mode "${mode}" (expected dev or prod)`);
  }
  const files = [".env.local", mode === "dev" && ".env.dev", ".env"].filter(Boolean);
  for (const file of files) if (existsSync(file)) loadEnvFile(file);
}
