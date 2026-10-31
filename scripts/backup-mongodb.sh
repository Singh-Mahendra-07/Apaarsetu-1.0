#!/usr/bin/env bash
# ============================================================================
# APAARSetu Automated MongoDB Production Backup Script
# ============================================================================
# Features:
# 1. Backs up all database collections, compound indexes, and GridFS buckets.
# 2. Generates compressed gzip archives with ISO timestamps.
# 3. Supports either Docker container execution or direct MongoDB URI connection.
# 4. Enforces 30-day retention pruning to prevent disk exhaustion.
# ============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/apaarsetu/backups/mongodb}"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
ARCHIVE_NAME="apaarsetu_backup_${TIMESTAMP}.gz"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "${BACKUP_DIR}"

echo "[*] Starting APAARSetu MongoDB Backup at $(date)"

if [ -n "${MONGODB_URI:-}" ]; then
  echo "[*] Executing mongodump via direct URI connection..."
  mongodump --uri="${MONGODB_URI}" --archive="${BACKUP_DIR}/${ARCHIVE_NAME}" --gzip
elif docker ps --format '{{.Names}}' | grep -q "^apaarsetu-mongo$"; then
  echo "[*] Executing mongodump via Docker container 'apaarsetu-mongo'..."
  docker exec apaarsetu-mongo mongodump --db=apaarsetu --archive --gzip > "${BACKUP_DIR}/${ARCHIVE_NAME}"
else
  echo "[-] ERROR: Neither MONGODB_URI is set nor is the 'apaarsetu-mongo' container running."
  exit 1
fi

BACKUP_SIZE="$(du -h "${BACKUP_DIR}/${ARCHIVE_NAME}" | cut -f1)"
echo "[✔] Backup completed successfully: ${BACKUP_DIR}/${ARCHIVE_NAME} (${BACKUP_SIZE})"

# Prune old backups older than retention threshold
echo "[*] Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "apaarsetu_backup_*.gz" -type f -mtime "+${RETENTION_DAYS}" -delete
echo "[✔] Retention cleanup finished."

