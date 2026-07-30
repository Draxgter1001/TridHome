#!/bin/sh
set -e

echo "Waiting for database..."
python - << 'PYEOF'
import os, socket, time
host = os.environ.get("POSTGRES_HOST", "db")
port = int(os.environ.get("POSTGRES_PORT", "5432"))
for _ in range(60):
    try:
        socket.create_connection((host, port), timeout=2).close()
        break
    except OSError:
        time.sleep(1)
else:
    raise SystemExit("Database never became available")
PYEOF

python manage.py migrate --noinput
python manage.py seed_demo
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
