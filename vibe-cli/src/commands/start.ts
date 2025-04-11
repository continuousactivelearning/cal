import { spawn } from "child_process";
import os from "os";

function runProcess(name: string, cwd: string) {
  return new Promise((resolve, reject) => {
    console.log(`⏳ Starting ${name} in ${cwd}...`);
    
    const isWindows = os.platform() === "win32";
    const process = spawn("pnpm", ["run", "dev"], {
      cwd,
      stdio: "inherit",
      shell: isWindows // shell: true required for Windows
    });

    process.on("exit", (code) => {
      if (code === 0) {
        console.log(`✅ ${name} exited cleanly.`);
        resolve(true);
      } else {
        console.error(`❌ ${name} exited with code ${code}`);
        reject(new Error(`${name} failed`));
      }
    });
  });
}

export async function runStart() {
  console.log("🚀 Launching backend and frontend...");

  try {
    await Promise.all([
      runProcess("Backend", "backend"),
      runProcess("Frontend", "frontend")
    ]);
  } catch (err) {
    console.error("❌ One or more services failed to start.");
    process.exit(1);
  }
}
