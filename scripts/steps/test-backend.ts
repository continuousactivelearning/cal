#!/usr/bin/env node
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../");
const backendDir = path.join(rootDir, "backend");
const statePath = path.join(rootDir, ".vibe.json");

// Step name constant
const STEP_NAME = "Backend Tests";

// Read .vibe.json state
function readState(): Record<string, any> {
  if (fs.existsSync(statePath)) {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  }
  return {};
}

// Write updated state to .vibe.json
function writeState(state: Record<string, any>) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

// Load state
const state = readState();

// Skip step if already completed
if (state[STEP_NAME]) {
  console.log("✅ Backend tests already completed. Skipping.");
  process.exit(0);
}

console.log("🧪 Running backend tests...");

const isWindows = os.platform() === "win32";

// Run backend test command
const result = spawnSync("pnpm", ["run", "test:ci"], {
  cwd: backendDir,
  stdio: "inherit",
  shell: isWindows // necessary for commands on Windows
});

if (result.status === 0) {
  console.log("✅ All tests passed! Backend setup complete.");
  state[STEP_NAME] = true;
  writeState(state);
} else {
  console.error("❌ Tests failed. Please fix and re-run the setup.");
  process.exit(0);
}
