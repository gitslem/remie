#!/bin/bash

# Create admin user script
# This sets an existing user as admin role

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  echo "Loading environment from .env file..."
  export $(cat .env | grep -v '^#' | grep DATABASE_URL | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  Warning: DATABASE_URL not found in environment"
  echo ""
  echo "Please set DATABASE_URL or create a .env file with:"
  echo "DATABASE_URL=\"postgresql://username:password@host:port/database?schema=public\""
  echo ""
  read -p "Would you like to continue anyway? (y/n): " CONTINUE
  if [ "$CONTINUE" != "y" ]; then
    echo "Exiting..."
    exit 1
  fi
fi

# Use the TypeScript script which uses Prisma (more reliable)
echo ""
echo "Using Prisma to set admin user..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "⚠️  node_modules not found. Installing dependencies..."
  npm install
fi

# Run the TypeScript script
npx ts-node prisma/create-admin.ts "$@"
