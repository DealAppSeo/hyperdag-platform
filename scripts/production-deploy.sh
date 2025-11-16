#!/bin/bash

echo "🚀 HyperDAG Production Deployment Script"

# Set production environment
export NODE_ENV=production

# Validate environment variables
echo "✅ Validating environment..."
required_vars=("DATABASE_URL" "SESSION_SECRET" "APP_URL" "ANTHROPIC_API_KEY" "OPENAI_API_KEY")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required environment variable: $var"
    exit 1
  fi
done

# Database migration
echo "📊 Running database migrations..."
npm run db:push || {
  echo "❌ Database migration failed"
  exit 1
}

# Build application
echo "🔨 Building application..."
npm run build || {
  echo "❌ Build failed"
  exit 1
}

# Start production server
echo "🌐 Starting production server..."
npm start

echo "✅ HyperDAG production deployment complete!"
echo "🎯 Free market developer pricing system is live!"
echo "📊 Marketplace available at /developer/marketplace"
echo "📖 API docs available at /developer/api-docs"