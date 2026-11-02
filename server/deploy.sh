#!/usr/bin/env bash
# deploy.sh — the one deploy script = disaster recovery = hot-spare stand-up
# (DESIGN §9; AR-72, was AR-55 — one running server per piece, D102). Run ON THE BOX
# from this piece's folder (/home/deploy/bcb):
#
#     bash server/deploy.sh
#
# pull -> install (node_modules never in git) -> restart under PM2 -> health check.
# First time on a fresh box: see server/README.md (nginx, Let's Encrypt, PM2 startup).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== pull"
git pull --ff-only

echo "== install (production dependencies only)"
npm ci --omit=dev

echo "== restart"
if pm2 describe bcb-server >/dev/null 2>&1; then
  pm2 restart bcb-server --update-env
else
  pm2 start server/ecosystem.config.js
fi
pm2 save >/dev/null

echo "== health"
PORT="${PORT:-5300}"
for i in 1 2 3 4 5 6 7 8 9 10; do
  if out=$(curl -fsS "http://127.0.0.1:${PORT}/health" 2>/dev/null); then
    echo "$out"
    echo "== OK"
    exit 0
  fi
  sleep 1
done
echo "!! /health did not answer on port ${PORT}"
pm2 logs bcb-server --lines 30 --nostream
exit 1
