#!/bin/sh

if [ "$DATABASE" = "postgres" ]
then
    echo "Waiting for postgres..."

    while ! nc -z $SQL_HOST $SQL_PORT; do
      sleep 0.1
    done

    echo "PostgreSQL started"
fi

echo "Collecting static files"
python manage.py collectstatic --no-input
echo "Making migrations"
python manage.py makemigrations
echo "Migrating"
python manage.py migrate

exec "$@"