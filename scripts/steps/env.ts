#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { input } from "@inquirer/prompts";

// Resolve current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../");
const backendDir = path.join(rootDir, "backend");
const statePath = path.join(rootDir, ".vibe.json");
const envPath = path.join(backendDir, ".env");

// Constants
const STEP_NAME = "Env Variables";

// Read state
function readState(): Record<string, any> {
  if (fs.existsSync(statePath)) {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  }
  return {};
}

// Write state
function writeState(state: Record<string, any>) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

// Validate MongoDB URI
function isValidMongoUri(uri: string): boolean {
  return uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://");
}

const state = readState();

if (state[STEP_NAME]) {
  console.log("✅ Environment variables already set. Skipping.");
  process.exit(0);
}

console.log(`
📄 Creating .env file for MongoDB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📘 MongoDB URI Instructions:

1. Go to https://www.mongodb.com/atlas/database and sign up or log in.
2. Create a new project and cluster.
3. Navigate to the 'Database Access' section in your project.
4. Create a new database user with appropriate permissions.
5. Go to the 'Clusters' section and click 'Connect' on your cluster.
6. Select 'Connect your application'.
7. Copy the connection string.
8. ⚠️ Replace <password> in the copied string with your actual database password.
9. Paste the modified connection string below.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

let mongoUri = "";

while (!isValidMongoUri(mongoUri)) {
  mongoUri = await input({ message: "Paste your MongoDB URI:" });
  if (!isValidMongoUri(mongoUri)) {
    console.log("❌ That doesn't look like a valid MongoDB URI. Please try again.");
  }
}

// Write to .env file
fs.writeFileSync(envPath, `DB_URL="${mongoUri}"\n`);
console.log(`✅ Wrote MongoDB URI to ${envPath}`);

// Save step complete
state[STEP_NAME] = true;
writeState(state);
