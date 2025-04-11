#!/usr/bin/env node
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const stateFile = path.resolve(__dirname, "../../.vibe.json");

// Read state from .vibe.json
function readState(): Record<string, any> {
  if (fs.existsSync(stateFile)) {
    return JSON.parse(fs.readFileSync(stateFile, "utf-8"));
  }
  return {};
}

// Write updated state
function writeState(state: Record<string, any>) {
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

// Cross-platform command existence check
function commandExists(cmd: string): boolean {
  try {
    const platform = os.platform();
    const checkCmd = platform === "win32" ? `where ${cmd}` : `command -v ${cmd}`;
    execSync(checkCmd, { stdio: "ignore", shell: true });
    return true;
  } catch {
    return false;
  }
}

// Simple logger with color
function log(msg: string, type: "info" | "warn" | "error" | "success" = "info") {
  const color = {
    info: "\x1b[36m",
    warn: "\x1b[33m",
    error: "\x1b[31m",
    success: "\x1b[32m",
    reset: "\x1b[0m"
  };
  console.log(`${color[type]}${msg}${color.reset}`);
}

// ---- Execute Toolchain Step ----
const state = readState();
const STEP_NAME = "ToolChain Check";

if (state[STEP_NAME]) {
  log("✅ Toolchain already verified. Skipping.", "success");
  process.exit(0);
}

// Check for Node.js
if (!commandExists("node")) {
  log("⚠ Node.js is not installed. Please install it manually: https://nodejs.org", "error");
  process.exit(1);
}

// Check for npm
if (!commandExists("npm")) {
  log("❌ npm is not installed. Please install Node.js which includes npm.", "error");
  process.exit(1);
}

// Check for pnpm
if (!commandExists("pnpm")) {
  log("⚠ Installing pnpm...", "warn");
  execSync("npm install -g pnpm", { stdio: "inherit" });
}

// Check for firebase-tools
if (!commandExists("firebase")) {
  log("⚠ Installing firebase-tools...", "warn");
  execSync("pnpm install -g firebase-tools", { stdio: "inherit" });
}

// Install workspace dependencies
log("⚙ Installing project dependencies via pnpm...", "warn");
execSync("pnpm install", { stdio: "inherit" });

log("✅ Toolchain verified and dependencies installed successfully.", "success");

// Save state
state[STEP_NAME] = true;
writeState(state);
