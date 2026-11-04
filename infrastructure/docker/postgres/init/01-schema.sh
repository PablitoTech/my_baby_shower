#!/bin/sh
# Crea el esquema configurado (DB_SCHEMA) y lo deja como search_path por defecto.
# Solo se ejecuta la primera vez que se inicializa el volumen de datos.
set -eu

SCHEMA="${DB_SCHEMA:-public}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
CREATE SCHEMA IF NOT EXISTS "${SCHEMA}" AUTHORIZATION "${POSTGRES_USER}";
ALTER DATABASE "${POSTGRES_DB}" SET search_path TO "${SCHEMA}";
SQL

echo "Esquema '${SCHEMA}' listo en la base de datos '${POSTGRES_DB}'."
