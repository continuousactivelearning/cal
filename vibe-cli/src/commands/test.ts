import { spawnSync } from "child_process";
import os from "os";

function runTestProcess(name: string, cwd: string): boolean {
  console.log(`🧪 Running ${name} tests...`);

  const isWindows = os.platform() === "win32";
  const result = spawnSync("pnpm", ["run", "test:ci"], {
    cwd,
    stdio: "inherit",
    shell: isWindows
  });

  if (result.status === 0) {
    console.log(`✅ ${name} tests passed.`);
    return true;
  } else {
    console.error(`❌ ${name} tests failed.`);
    return false;
  }
}

export async function runTest() {
  console.log("🧪 Running full test suite...");

  const backendPassed = runTestProcess("Backend", "backend");
  const frontendPassed = runTestProcess("Frontend", "frontend");

  if (!backendPassed || !frontendPassed) {
    console.error("❌ One or more test suites failed.");
    process.exit(1);
  }

  console.log("🎉 All tests passed successfully.");
}
