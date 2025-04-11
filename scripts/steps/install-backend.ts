#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../");
const backendDir = path.join(rootDir, "backend");
const statePath = path.join(rootDir, ".vibe.json");

// Step name
const STEP_NAME = "Backend Packages";

// Read setup state
function readState(): Record<string, any> {
  if (fs.existsSync(statePath)) {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  }
  return {};
}

// Write updated state
function writeState(state: Record<string, any>) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

// Load state
const state = readState();

// Skip step if already complete
if (state[STEP_NAME]) {
  console.log("✅ Backend dependencies already installed. Skipping.");
  process.exit(0);
}

console.log("📦 Installing backend dependencies...");

try {
  execSync("pnpm install", { cwd: backendDir, stdio: "inherit" });
  state[STEP_NAME] = true;
  writeState(state);
  console.log("✅ Backend dependencies installed successfully.");
} catch (err) {
  console.error("❌ Failed to install backend packages.");
  process.exit(1);
}
