#!/bin/bash
set -e

echo "Loading environment variables from AWS Parameter Store..."

# Fetch DATABASE_URL_MASTER
export DATABASE_URL_MASTER=$(aws ssm get-parameter \
  --name "/prod/master-db-url" \
  --with-decryption \
  --region ap-south-1 \
  --query "Parameter.Value" \
  --output text)

if [ -z "$DATABASE_URL_MASTER" ]; then
  echo "❌ ERROR: Failed to load DATABASE_URL_MASTER"
  exit 1
fi

# Fetch parameters for tenant DB creation
DB_USER=$(aws ssm get-parameter --name "/eatwithme/db-user" --with-decryption --region ap-south-1 --query "Parameter.Value" --output text)
DB_PASS=$(aws ssm get-parameter --name "/eatwithme/db-password" --with-decryption --region ap-south-1 --query "Parameter.Value" --output text)
DB_HOST=$(aws ssm get-parameter --name "/eatwithme/db-host" --with-decryption --region ap-south-1 --query "Parameter.Value" --output text)
DB_PORT=$(aws ssm get-parameter --name "/eatwithme/db-port" --with-decryption --region ap-south-1 --query "Parameter.Value" --output text)

# Remove quotes ("5432" → 5432)
DB_USER=$(echo "$DB_USER" | tr -d '"')
DB_PASS=$(echo "$DB_PASS" | tr -d '"')
DB_HOST=$(echo "$DB_HOST" | tr -d '"')
DB_PORT=$(echo "$DB_PORT" | tr -d '"')

# Export
export DB_USER DB_PASS DB_HOST DB_PORT

echo "Environment variables loaded:"
echo "DB_HOST=$DB_HOST"
echo "DB_PORT=$DB_PORT"

# Start backend
pm2 start dist/server.js --name backend --update-env || pm2 restart backend --update-env
pm2 save

echo "Deployment completed successfully!"
