#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORLDBOX_MODS_DIR="$HOME/Library/Application Support/Steam/steamapps/common/worldbox/worldbox.app/Contents/Resources/Data/StreamingAssets/mods"

echo "=== Building WorldboxMCP Mod (C#) ==="
dotnet build "$SCRIPT_DIR/mod/WorldboxMcpMod.csproj" -c Release

echo "=== Installing into WorldBox ==="
TARGET_DIR="$WORLDBOX_MODS_DIR/WorldboxMCP"
mkdir -p "$TARGET_DIR"

cp "$SCRIPT_DIR/mod/bin/Release/netstandard2.1/WorldboxMcpMod.dll" "$TARGET_DIR/"
cp "$SCRIPT_DIR/mod/mod.json" "$TARGET_DIR/"

echo "Installed successfully to: $TARGET_DIR"
ls -la "$TARGET_DIR"

echo "=== Building MCP Server (TypeScript) ==="
cd "$SCRIPT_DIR/server"
npm install
npm run build

echo "=== All Done! ==="
