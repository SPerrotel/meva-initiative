// Generates the dev config, then starts the Firebase emulators on the project id from .env.dev.
import { execFileSync, spawn } from "node:child_process";
import { loadLayeredEnv } from "./lib/load-env.mjs";

loadLayeredEnv("dev");
const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId?.startsWith("demo-")) {
  console.error(`Refusing to start emulators: FIREBASE_PROJECT_ID must start with "demo-" in dev (got "${projectId}")`);
  process.exit(1);
}

execFileSync("node", ["scripts/generate-firebase-config.mjs", "dev"], { stdio: "inherit" });
const child = spawn("firebase", ["emulators:start", "--project", projectId], { stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 0));
