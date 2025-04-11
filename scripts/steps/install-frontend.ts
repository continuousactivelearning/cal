#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

// Resolve file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../");
const frontendDir = path.join(rootDir, "frontend");
const statePath = path.join(rootDir, ".vibe.json");

// Define the step name
const STEP_NAME = "Frontend Packages";

// Read state from .vibe.json
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

// Skip if already completed
if (state[STEP_NAME]) {
  console.log("✅ Frontend dependencies already installed. Skipping.");
  process.exit(0);
}

console.log("📦 Installing frontend dependencies...");

try {
  execSync("pnpm install", { cwd: frontendDir, stdio: "inherit" });
  state[STEP_NAME] = true;
  writeState(state);
  console.log("✅ Frontend packages installed successfully.");
} catch (err) {
  console.error("❌ Failed to install frontend packages.");
  process.exit(1);
}
