#!/bin/bash

set -e

echo "🚀 Sol Workflow - Initial Setup"
echo "================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Install it with: npm install -g pnpm"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop."
    exit 1
fi

if ! command -v bun &> /dev/null; then
    echo "⚠️  Bun is not installed. Install it with: curl -fsSL https://bun.sh/install | bash"
    echo "   (Optional for local development, but recommended)"
fi

echo "✅ Prerequisites met!"
echo ""

# Copy environment variables
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Edit it if you need custom configuration."
else
    echo "ℹ️  .env file already exists. Skipping..."
fi
echo ""

# Start Docker infrastructure
echo "🐳 Starting Docker infrastructure (PostgreSQL + Redis + Bull Board)..."
docker compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if PostgreSQL is ready
until docker exec solworkflow-postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done
echo "✅ PostgreSQL is ready!"

# Check if Redis is ready
until docker exec solworkflow-redis redis-cli ping > /dev/null 2>&1; do
    echo "   Waiting for Redis..."
    sleep 2
done
echo "✅ Redis is ready!"

echo ""

# Run database migrations
echo "🗄️  Running database migrations..."
pnpm db:migrate

echo ""
echo "✅ Setup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 You're all set! Here's what you can do next:"
echo ""
echo "1. Start all services:"
echo "   pnpm dev"
echo ""
echo "2. Access the services:"
echo "   • Web UI:      http://localhost:3000"
echo "   • API:         http://localhost:3001"
echo "   • Bull Board:  http://localhost:3002"
echo "   • DB Studio:   pnpm db:studio"
echo ""
echo "3. Read the documentation:"
echo "   • SETUP.md         - Detailed setup guide"
echo "   • ARCHITECTURE.md  - System architecture"
echo "   • ROADMAP.md       - Development roadmap"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
