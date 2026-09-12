#!/usr/bin/env bash
# Build store-ready zips for Chrome and Firefox.
set -euo pipefail
cd "$(dirname "$0")"
VERSION=$(python3 -c "import json;print(json.load(open('extension/manifest.json'))['version'])")
rm -rf dist && mkdir -p dist/firefox-src
( cd extension && zip -r "../dist/m47-v${VERSION}-chrome.zip" . -x "*.DS_Store" >/dev/null )
cp -r extension/* dist/firefox-src/
cp firefox/manifest.json dist/firefox-src/manifest.json
( cd dist/firefox-src && zip -r "../m47-v${VERSION}-firefox.zip" . -x "*.DS_Store" >/dev/null )
rm -rf dist/firefox-src
echo "built:" && ls -la dist/
