#!/bin/bash
# Runs once when the mysql data volume is first initialized (docker's
# /docker-entrypoint-initdb.d convention — no-op on existing volumes).
# Django's test runner creates/drops a `test_<DB_NAME>` database per run,
# which the app user otherwise has no privileges on.
set -e
mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "GRANT ALL PRIVILEGES ON test_%.* TO '$MYSQL_USER'@'%'; FLUSH PRIVILEGES;"
