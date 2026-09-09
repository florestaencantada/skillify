#!/bin/sh
set -eu

node -e '
const { writeFileSync } = require("node:fs");

writeFileSync("/app/dist/env.js", `window.__APP_CONFIG__ = ${JSON.stringify({
  VITE_API_URL: process.env.VITE_API_URL || "",
})};\n`);
'

exec "$@"
