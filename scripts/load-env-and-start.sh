#!/bin/bash
set -e

echo "Loading environment variables from AWS Parameter Store..."

# Fetch DATABASE_URL_MASTER from Parameter Store
export DATABASE_URL_MASTER=$(aws ssm get-parameter \
  --name "/prod/master-db-url" \
  --with-decryption \
  --region ap-south-1 \
  --query "Parameter.Value" \
  --output text)

if [ -z "$DATABASE_URL_MASTER" ]; then
  echo "Error: Failed to fetch DATABASE_URL_MASTER from Parameter Store"
  exit 1
fi

echo "Environment variables loaded successfully"
echo "DATABASE_URL_MASTER is set (value hidden for security)"

# Start or restart PM2 with the environment variables
echo "Starting/restarting backend with PM2..."
pm2 start dist/server.js --name backend --update-env || pm2 restart backend --update-env
pm2 save

echo "Deployment completed successfully!"
