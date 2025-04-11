#!/usr/bin/env bash
set -e

STATE_FILE=".vibe.json"

echo "🚀 ViBe Setup Script"

OS="$(uname -s)"

ensure_node() {
  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo "🛠 Node.js not found. Installing via system package manager..."
    if [[ "$OS" == "Linux" ]]; then
      if command -v apt >/dev/null 2>&1; then
        sudo apt update
        sudo apt install -y nodejs npm
      elif command -v dnf >/dev/null 2>&1; then
        sudo dnf install -y nodejs npm
      elif command -v yum >/dev/null 2>&1; then
        sudo yum install -y nodejs npm
      elif command -v pacman >/dev/null 2>&1; then
        sudo pacman -Sy --noconfirm nodejs npm
      fi
    elif [[ "$OS" == "Darwin" ]]; then
      if ! command -v brew >/dev/null 2>&1; then
        echo "❌ Homebrew not found. Please install it first."
        exit 1
      fi
      brew install node
    elif [[ "$OS" == MINGW* || "$OS" == MSYS* || "$OS" == CYGWIN* ]]; then
      echo "❌ Please install Node.js manually on Windows: https://nodejs.org"
      exit 1
    fi
  fi

  echo "✅ Detected Node.js version: $(node -v)"

  NODE_VERSION=$(node -v | sed 's/v//')
  MAJOR_VERSION=$(echo "$NODE_VERSION" | cut -d. -f1)

  if [ "$MAJOR_VERSION" -lt 22 ]; then
    echo "🔄 Node.js version is too old (<22). Upgrading using 'n'..."
    sudo npm install -g n
    sudo n latest
    export PATH="/usr/local/bin:$PATH"
    hash -r
  fi

  echo "✅ Node.js now at version: $(node -v)"
  echo "✅ npm version: $(npm -v)"
}

install_pnpm() {
  if ! command -v pnpm >/dev/null 2>&1; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
  fi

  echo "⚙ Running pnpm setup..."
  pnpm setup

  # Source shell rc file to activate pnpm path changes
  SHELL_NAME=$(basename "$SHELL")
  case "$SHELL_NAME" in
    bash)
      source ~/.bashrc
      ;;
    zsh)
      source ~/.zshrc
      ;;
    fish)
      source ~/.config/fish/config.fish
      ;;
    *)
      echo "⚠️  Unknown shell. Please restart your terminal or manually source your shell config."
      ;;
  esac

  echo "✅ pnpm: $(pnpm -v)"
}


install_node_deps() {
  echo "📦 Installing required Node.js dependencies..."
  pnpm install --no-frozen-lockfile
  pnpm add -w commander concurrently @inquirer/prompts mongodb-memory-server firebase-tools
}

install_cli() {
  echo "⚙ Installing CLI..."
  cd vibe-cli
  if [ ! -d "node_modules" ]; then
    echo "📦 Installing vibe-cli dependencies..."
    pnpm install --no-frozen-lockfile
  fi
  pnpm build
  echo "📦 Adding vibe-cli to workspace..."
  pnpm add -w .
  pnpm link --global
  cd ..
  echo "✅ Vibe CLI installed and linked globally."
}

init_state() {
  if [ ! -f "$STATE_FILE" ]; then
    echo "{}" > "$STATE_FILE"
    echo "📄 Created $STATE_FILE"
  fi
}

run_step() {
  NAME=$1
  FILE=$2
  echo "👉 Running step: $NAME"
  node "./scripts/$FILE"
}

ensure_node
install_pnpm
install_node_deps
install_cli
init_state

run_step "Welcome"              "steps/welcome.ts"
clear
run_step "Toolchain Check"      "steps/toolchain-check.ts"
clear
run_step "Firebase Login"       "steps/firebase-login.ts"
clear
run_step "Emulators"            "steps/firebase-emulators.ts"
clear
run_step "Env Variables"        "steps/env.ts"
clear
run_step "Backend Packages"     "steps/install-backend.ts"
clear
run_step "MongoDB Test Binaries" "steps/mongodb-binary.ts"
clear
run_step "Backend Tests"        "steps/test-backend.ts"
clear
run_step "Frontend Packages"    "steps/install-frontend.ts"
clear

echo "🎉 Setup complete!"
echo "Run 'vibe start' to start development server"
