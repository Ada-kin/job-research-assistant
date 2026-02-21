#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ "${SKIP_AUTO_DEPLOY:-false}" == "true" ]]; then
  echo "[post-push] Auto deploy skipped (SKIP_AUTO_DEPLOY=true)."
  exit 0
fi

deploy_needed=false
while read -r local_ref local_sha remote_ref remote_sha; do
  [[ -n "${remote_ref:-}" ]] || continue
  [[ "$remote_ref" == "refs/heads/main" ]] || continue

  # Ignore branch deletion pushes.
  if [[ "${local_sha:-}" =~ ^0+$ ]]; then
    continue
  fi

  deploy_needed=true
done

if [[ "$deploy_needed" != "true" ]]; then
  exit 0
fi

echo "[post-push] main pushed. Starting production deploy (rsync via Ansible local_sync)..."
"$ROOT_DIR/scripts/start.sh" prod
