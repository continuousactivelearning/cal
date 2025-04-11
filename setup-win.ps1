# PowerShell Setup Script for Windows
$ErrorActionPreference = "Stop"

Write-Host "🚀 ViBe Setup Script (Windows)"

$STATE_FILE = ".vibe.json"

function Ensure-Node {
    if (!(Get-Command node -ErrorAction SilentlyContinue) -or !(Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Node.js is not installed."
        Write-Host "Please install Node.js manually from https://nodejs.org"
        exit 1
    }

    $nodeVersion = node -v
    Write-Host "✅ Detected Node.js version: $nodeVersion"

    $majorVersion = ($nodeVersion -replace "[vV]", "").Split(".")[0]
    if ([int]$majorVersion -lt 22) {
        Write-Host "🔄 Node.js version too old (<22). Upgrading using 'n'..."
        npm install -g n
        n latest
        $env:Path = "C:\Program Files\nodejs;" + $env:Path
    }

    Write-Host "✅ Node.js version: $(node -v)"
    Write-Host "✅ npm version: $(npm -v)"
}

function Install-PNPM {
    if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Write-Host "📦 Installing pnpm..."
        npm install -g pnpm
    }
    Write-Host "✅ pnpm version: $(pnpm -v)"
}

function Install-NodeDeps {
    Write-Host "📦 Installing required Node.js dependencies..."
    pnpm install --no-frozen-lockfile
    pnpm add -w commander concurrently @inquirer/prompts mongodb-memory-server firebase-tools
}

function Init-StateFile {
    if (!(Test-Path $STATE_FILE)) {
        "{}" | Out-File -Encoding UTF8 $STATE_FILE
        Write-Host "📄 Created $STATE_FILE"
    }
}

function Run-Step {
    param(
        [string]$Name,
        [string]$Script
    )
    Write-Host "👉 Running step: $Name"
    node ".\\scripts\\$Script"
}

function Install-CLI {
    Write-Host "⚙ Installing CLI..."
    cd vibe-cli
    if (!(Test-Path "node_modules")) {
        Write-Host "📦 Installing vibe-cli dependencies..."
        pnpm install --no-frozen-lockfile
    }
    pnpm build
    Write-Host "📦 Adding vibe-cli to workspace..."
    pnpm add -w .
    pnpm link --global
    cd ..
    Write-Host "✅ Vibe CLI installed and linked globally."
}


Ensure-Node
Install-PNPM
Install-NodeDeps
Init-StateFile

Run-Step "Welcome"              "steps\\welcome.ts"
Run-Step "Toolchain Check"      "steps\\toolchain-check.ts"
Run-Step "Firebase Login"       "steps\\firebase-login.ts"
Run-Step "Emulators"            "steps\\firebase-emulators.ts"
Run-Step "Env Variables"        "steps\\env.ts"
Run-Step "Backend Packages"     "steps\\install-backend.ts"
Run-Step "MongoDB Test Binaries" "steps\\mongodb-binary.ts"
Run-Step "Backend Tests"        "steps\\test-backend.ts"
Run-Step "Frontend Packages"    "steps\\install-frontend.ts"

Install-CLI

Write-Host "🎉 Setup complete! You can now use 'vibe start'"
