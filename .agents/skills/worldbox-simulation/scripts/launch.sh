#!/usr/bin/env bash
# ==============================================================================
# WorldBox & MCP Bridge Launcher
# Starts WorldBox on macOS, verifies NeoModLoader mod, and confirms HTTP bridge.
# ==============================================================================

set -e

PORT=2828
HEALTH_URL="http://127.0.0.1:${PORT}/health"
APP_PATH="${HOME}/Library/Application Support/Steam/steamapps/common/worldbox/worldbox.app"
ALT_APP_PATH="/Applications/worldbox.app"
TIMEOUT=45

echo "🔮 [WorldBox MCP] Checking if WorldBox HTTP bridge is already running on port ${PORT}..."

if curl -s -m 2 "${HEALTH_URL}" | grep -q '"status":"ok"'; then
  echo "✅ [WorldBox MCP] WorldBox HTTP bridge is already active and healthy on 127.0.0.1:${PORT}!"
  exit 0
fi

# Ensure MCP TypeScript server is built
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"

if [ ! -f "${PROJECT_ROOT}/server/dist/index.js" ]; then
  echo "📦 [WorldBox MCP] Building TypeScript MCP server..."
  (cd "${PROJECT_ROOT}/server" && npm run build)
fi

# Locate WorldBox app
TARGET_APP=""
if [ -d "${APP_PATH}" ]; then
  TARGET_APP="${APP_PATH}"
elif [ -d "${ALT_APP_PATH}" ]; then
  TARGET_APP="${ALT_APP_PATH}"
fi

if [ -z "${TARGET_APP}" ]; then
  echo "⚠️  [WorldBox MCP] WorldBox.app not found in default paths."
  echo "Attempting to launch via Steam URI (steam://run/1206560)..."
  open "steam://run/1206560" || {
    echo "❌ [WorldBox MCP] Failed to launch WorldBox via Steam URI."
    exit 1
  }
else
  echo "🚀 [WorldBox MCP] Launching WorldBox (${TARGET_APP})..."
  open -a "${TARGET_APP}"
fi

echo "⏳ [WorldBox MCP] Waiting for WorldBox & NeoModLoader HTTP bridge to initialize (up to ${TIMEOUT}s)..."

ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  sleep 2
  ELAPSED=$((ELAPSED + 2))

  if curl -s -m 2 "${HEALTH_URL}" 2>/dev/null | grep -q '"status":"ok"'; then
    echo "✨ [WorldBox MCP] WorldBox bridge connected successfully in ${ELAPSED}s!"
    echo "🎮 [WorldBox MCP] Ready for divine simulations. Port: ${PORT}"
    exit 0
  fi

  printf "."
done

echo ""
echo "⚠️  [WorldBox MCP] Timeout waiting for http://127.0.0.1:${PORT}/health."
echo "Please verify:"
echo " 1. WorldBox has fully opened and loaded the main menu."
echo " 2. NeoModLoader (NML) is installed and WorldboxMCP mod is enabled."
echo " 3. You can test manually with: curl -v http://127.0.0.1:${PORT}/health"
exit 1
