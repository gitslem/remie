#!/bin/bash

# Database Connection Checker
# This script helps diagnose database connection issues

echo "========================================="
echo "   Database Connection Checker"
echo "========================================="
echo ""

# Check for .env file
if [ -f .env ]; then
  echo "✅ .env file found"
  export $(cat .env | grep -v '^#' | grep DATABASE_URL | xargs)

  if [ -n "$DATABASE_URL" ]; then
    echo "✅ DATABASE_URL is set in .env"
    echo "   Connection string: ${DATABASE_URL:0:30}..."
  else
    echo "❌ DATABASE_URL not found in .env file"
  fi
else
  echo "❌ .env file not found"
  echo "   Create one by running: cp .env.example .env"
fi

echo ""
echo "========================================="
echo "   Checking Database Connections"
echo "========================================="
echo ""

# Check if Docker is running
if command -v docker &> /dev/null; then
  echo "Checking Docker containers..."

  # Check for PostgreSQL container
  if docker ps | grep -q postgres; then
    echo "✅ PostgreSQL Docker container is running"
    CONTAINER_NAME=$(docker ps --filter "ancestor=postgres" --format "{{.Names}}" | head -1)
    if [ -z "$CONTAINER_NAME" ]; then
      CONTAINER_NAME=$(docker ps | grep postgres | awk '{print $NF}')
    fi
    echo "   Container: $CONTAINER_NAME"

    # Get container port
    PORT=$(docker ps | grep postgres | grep -oP '0.0.0.0:\K[0-9]+' | head -1)
    if [ -n "$PORT" ]; then
      echo "   Port: $PORT"
      echo ""
      echo "📋 Suggested DATABASE_URL for Docker:"
      echo "   DATABASE_URL=\"postgresql://postgres:postgres@localhost:${PORT}/remie?schema=public\""
    fi
  else
    echo "❌ No PostgreSQL Docker container running"
    echo ""
    echo "To start the database, run:"
    echo "   docker-compose up -d postgres"
  fi
else
  echo "ℹ️  Docker not found or not running"
fi

echo ""

# Check for local PostgreSQL
if command -v psql &> /dev/null; then
  echo "✅ psql (PostgreSQL client) is installed"
  echo ""
  echo "Testing common PostgreSQL ports..."

  for port in 5432 5433 5434; do
    if nc -z localhost $port 2>/dev/null; then
      echo "   ✅ PostgreSQL responding on port $port"
      echo "      Try: postgresql://postgres:yourpassword@localhost:$port/remie?schema=public"
    fi
  done
else
  echo "ℹ️  psql not found in PATH"
fi

echo ""
echo "========================================="
echo "   Environment Information"
echo "========================================="
echo ""
echo "Current directory: $(pwd)"
echo "Node version: $(node --version 2>/dev/null || echo 'not installed')"
echo "npm version: $(npm --version 2>/dev/null || echo 'not installed')"

if [ -d node_modules ]; then
  echo "✅ node_modules exists"
else
  echo "❌ node_modules not found - run: npm install"
fi

if [ -d node_modules/@prisma ]; then
  echo "✅ Prisma is installed"
else
  echo "❌ Prisma not found in node_modules"
fi

echo ""
echo "========================================="
echo "   Next Steps"
echo "========================================="
echo ""

if [ ! -f .env ]; then
  echo "1. Create .env file: cp .env.example .env"
fi

if [ -z "$DATABASE_URL" ]; then
  echo "2. Set DATABASE_URL in .env file"
fi

echo "3. Start your database (Docker or local PostgreSQL)"
echo "4. Run: npm run create-admin"
echo ""
echo "For detailed instructions, see: ADMIN_SETUP.md"
echo ""
