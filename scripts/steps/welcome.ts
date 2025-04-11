#!/usr/bin/env node
import { select } from "@inquirer/prompts";
import fs from "fs";
import path from "path";
import os from "os"; // For cross-platform detection
import { fileURLToPath } from "url";

// __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to .vibe.json state file
const statePath = path.resolve(__dirname, "../../.vibe.json");

// Read existing state
function readState(): Record<string, any> {
  if (fs.existsSync(statePath)) {
    const raw = fs.readFileSync(statePath, "utf-8");
    return JSON.parse(raw);
  }
  return {};
}

// Write updated state
function writeState(state: Record<string, any>) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

// Load state
const state = readState();

// If step already completed, skip
if (state["Welcome"]) {
  console.log("✅ Welcome step already completed.");
  process.exit(0);
}

console.log("\n🚀 Welcome to the ViBe Setup!\n");

// (Optional) Cross-platform OS info logging
const platform = os.platform(); // 'win32', 'linux', 'darwin'
console.log(`🔍 Detected platform: ${platform}`);

// Prompt user to select environment
const environment = await select({
  message: "Choose environment:",
  choices: [
    { name: "Development", value: "Development" },
    { name: "Production", value: "Production" }
  ]
});

// Production path isn't implemented yet
if (environment === "Production") {
  console.error("❌ Production setup is not ready yet.");
  process.exit(1);
}

// Save environment choice to state
state["environment"] = environment;
state["Welcome"] = true;
writeState(state);

console.log(`✅ Environment set to: ${environment}`);
