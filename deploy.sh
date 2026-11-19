#!/bin/bash
# Budowa, test i wdrożenie jednym poleceniem:  ./deploy.sh
# Przerywa się na pierwszym błędzie, więc strona z nieprzechodzącym testem nie trafi na produkcję.
set -euo pipefail
cd "$(dirname "$0")"
export npm_config_cache="${TMPDIR:-/tmp}/npm-cache-japonia"
node build.mjs
node check.mjs
node test-private.cjs
node test-calendar.mjs
npx --yes vercel build --prod
npx --yes vercel deploy --prebuilt --prod
if [ -n "$(git status --porcelain)" ]; then
  echo "Uwaga: w repo są niezapisane zmiany. Zapisz je: git add -A && git commit -m 'opis' && git push"
fi
