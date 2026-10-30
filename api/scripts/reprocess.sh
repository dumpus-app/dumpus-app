#!/usr/bin/env bash
#
# Force a Discord package to be re-processed end to end.
#
# Deletes any existing DB row + S3 blob for the package, then re-submits
# the link to /process. Useful for retrying a package that errored or
# timed out, or for testing changes to the worker.
#
# Usage:
#   scripts/reprocess.sh "https://click.discord.com/ls/click?upn=u001.xyz..."
#
# Optional env vars:
#   API_BASE — defaults to https://api.dumpus.app

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "usage: $0 <discord-package-link>" >&2
  exit 2
fi

link="$1"
api="${API_BASE:-https://api.dumpus.app}"

# Pull the UPN out of the link (the part after upn=).
upn="${link#*upn=}"
if [ "$upn" = "$link" ] || [ -z "$upn" ]; then
  echo "could not extract upn from link" >&2
  exit 1
fi

# package_id = md5(upn)
if command -v md5sum >/dev/null; then
  package_id=$(printf '%s' "$upn" | md5sum | awk '{print $1}')
else
  # macOS
  package_id=$(printf '%s' "$upn" | md5)
fi

echo "package_id: $package_id"
echo "api: $api"

echo
echo "1. DELETE existing package data (404 is fine if it doesn't exist)"
http_code=$(curl -sS -o /tmp/reprocess-delete.json -w "%{http_code}" \
  -X DELETE "$api/process/$package_id" \
  -H "Authorization: Bearer $upn") || true
echo "  -> HTTP $http_code"
cat /tmp/reprocess-delete.json 2>/dev/null && echo

echo
echo "2. POST /process with the link"
curl -sS -X POST "$api/process" \
  -H 'Content-Type: application/json' \
  -d "{\"package_link\":\"$link\"}" | tee /tmp/reprocess-post.json
echo

echo
echo "3. Poll /status (Ctrl+C when you've seen enough)"
while true; do
  curl -sS "$api/process/$package_id/status" \
    -H "Authorization: Bearer $upn" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"step={d.get('processingStep')} errored={d.get('isErrored')} code={d.get('errorMessageCode')}\")"
  sleep 3
done
