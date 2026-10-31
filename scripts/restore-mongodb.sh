#!/usr/bin/env bash
# ============================================================================
# APAARSetu Automated MongoDB Production Restore Script
# ============================================================================
# Usage:
#   ./scripts/restore-mongodb.sh /path/to/apaarsetu_backup_YYYYMMDD_HHMMSS.gz
# ============================================================================

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <path_to_backup_archive.gz>"
  exit 1
fi

ARCHIVE_PATH="$1"

if [ ! -f "${ARCHIVE_PATH}" ]; then
  echo "[-] ERROR: Archive file '${ARCHIVE_PATH}' does not exist."
  exit 1
fi

echo "[!] WARNING: You are about to restore MongoDB from archive: ${ARCHIVE_PATH}"
echo "[!] This will overwrite and merge existing documents in the 'apaarsetu' database."
read -p "Type 'RESTORE' to confirm: " CONFIRM

if [ "${CONFIRM}" != "RESTORE" ]; then
  echo "Aborted."
  exit 0
fi

echo "[*] Restoring database..."

if [ -n "${MONGODB_URI:-}" ]; then
  mongorestore --uri="${MONGODB_URI}" --archive="${ARCHIVE_PATH}" --gzip --drop
elif docker ps --format '{{.Names}}' | grep -q "^apaarsetu-mongo$"; then
  docker exec -i apaarsetu-mongo mongorestore --archive --gzip --drop < "${ARCHIVE_PATH}"
else
  echo "[-] ERROR: Neither MONGODB_URI is set nor is the 'apaarsetu-mongo' container running."
  exit 1
fi

echo "[✔] Database successfully restored from ${ARCHIVE_PATH}"

