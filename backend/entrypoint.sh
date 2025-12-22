#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Wait for database to be ready
echo "Waiting for database to be ready..."
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
  echo "Database is not ready yet..."
  sleep 2
done

echo "Database is ready!"

# Run migrations
echo "Running database migrations..."
if npm run migrate; then
  echo "Database migrations completed successfully"
else
  echo "Database migrations failed"
  exit 1
fi

# Start the application
echo "Starting the application..."
exec node src/server.js