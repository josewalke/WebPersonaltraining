#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Falta $ENV_FILE (copia backend/.env.example)."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${PGHOST:?}" "${PGPORT:?}" "${PGUSER:?}" "${PGPASSWORD:?}" "${PGDATABASE:?}"

if [[ ! "$PGDATABASE" =~ ^[a-z][a-z0-9_]*$ ]]; then
  echo "PGDATABASE no es un identificador seguro: $PGDATABASE"
  exit 1
fi

export PGHOST PGPORT PGUSER PGPASSWORD

if ! psql -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '${PGDATABASE}'" | grep -q 1; then
  psql -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${PGDATABASE}"
fi

psql -d "$PGDATABASE" -v ON_ERROR_STOP=1 -f "$ROOT/db/001_init.sql"
psql -d "$PGDATABASE" -v ON_ERROR_STOP=1 -f "$ROOT/db/002_seed.sql"
psql -d "$PGDATABASE" -v ON_ERROR_STOP=1 -f "$ROOT/db/003_auth.sql"
psql -d "$PGDATABASE" -v ON_ERROR_STOP=1 -f "$ROOT/db/004_exercises.sql"
psql -d "$PGDATABASE" -v ON_ERROR_STOP=1 -f "$ROOT/db/005_categories.sql"
psql -d "$PGDATABASE" -v ON_ERROR_STOP=1 -f "$ROOT/db/006_exercise_details.sql"
psql -d "$PGDATABASE" -v ON_ERROR_STOP=1 -f "$ROOT/db/007_client_exercise_weekday.sql"
psql -d "$PGDATABASE" -v ON_ERROR_STOP=1 -f "$ROOT/db/008_exercise_completions.sql"
psql -d "$PGDATABASE" -v ON_ERROR_STOP=1 -f "$ROOT/db/009_realistic_content.sql"
psql -d "$PGDATABASE" -v ON_ERROR_STOP=1 -f "$ROOT/db/010_trainer_profile.sql"
node "$ROOT/db/seed-admin.js"
node "$ROOT/db/seed-demo-data.js"

echo "Aplicado en ${PGHOST}:${PGPORT}/${PGDATABASE}"
