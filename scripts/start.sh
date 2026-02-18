#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/start.sh local         # Start local dependencies + run app
  ./scripts/start.sh prod          # Deploy to VPS with Ansible
  ./scripts/start.sh prod-check    # Run Ansible in --check mode

Optional env vars:
  SKIP_INSTALL=true                # Skip npm install in local mode
  SKIP_DB_PUSH=true                # Skip prisma db push in local mode
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing command: $1" >&2
    exit 1
  fi
}

ensure_env_file() {
  if [[ ! -f .env ]]; then
    echo ".env not found. Copying .env.example -> .env"
    cp .env.example .env
    echo "Update .env with real values before continuing."
  fi
}

wait_for_postgres() {
  echo "Waiting for PostgreSQL to be ready..."
  for _ in {1..30}; do
    if docker compose exec -T postgres pg_isready -U postgres -d job_research_assistant >/dev/null 2>&1; then
      echo "PostgreSQL is ready."
      return 0
    fi
    sleep 1
  done
  echo "PostgreSQL did not become ready in time." >&2
  exit 1
}

run_local() {
  require_cmd docker
  require_cmd npm
  require_cmd npx

  ensure_env_file

  echo "Starting local dependencies (postgres + gotenberg)..."
  docker compose up -d postgres gotenberg
  wait_for_postgres

  if [[ "${SKIP_INSTALL:-false}" != "true" ]]; then
    echo "Installing npm dependencies..."
    npm install
  fi

  echo "Generating Prisma client..."
  npx prisma generate

  if [[ "${SKIP_DB_PUSH:-false}" != "true" ]]; then
    echo "Applying database schema (dev)..."
    npx prisma db push
  fi

  echo "Starting Next.js dev server..."
  npm run dev
}

run_prod() {
  require_cmd ansible
  require_cmd ansible-playbook

  export ANSIBLE_CONFIG="${ANSIBLE_CONFIG:-$ROOT_DIR/ansible/ansible.cfg}"

  echo "Checking Ansible inventory connectivity..."
  ansible -i ansible/inventory.ini vps -m ping

  echo "Deploying to production..."
  ansible-playbook -i ansible/inventory.ini ansible/playbook.yml
}

run_prod_check() {
  require_cmd ansible-playbook
  export ANSIBLE_CONFIG="${ANSIBLE_CONFIG:-$ROOT_DIR/ansible/ansible.cfg}"

  echo "Running production playbook in check mode..."
  ansible-playbook -i ansible/inventory.ini ansible/playbook.yml --check
}

MODE="${1:-}"
case "$MODE" in
  local)
    run_local
    ;;
  prod)
    run_prod
    ;;
  prod-check)
    run_prod_check
    ;;
  *)
    usage
    exit 1
    ;;
esac

