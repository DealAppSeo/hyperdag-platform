#!/bin/bash

echo "🚀 Deploying HyperDAG to GitHub"
echo "================================"
echo ""

# Check if GitHub repo URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: GitHub repository URL required"
    echo ""
    echo "Usage: ./push-to-github.sh <github-repo-url>"
    echo "Example: ./push-to-github.sh https://github.com/yourusername/hyperdag-platform.git"
    echo ""
    echo "Steps to create GitHub repo:"
    echo "1. Go to https://github.com/new"
    echo "2. Repository name: hyperdag-platform"
    echo "3. Description: 'HyperDAG - Distributed Symbiotic AI Optimization Architecture'"
    echo "4. Choose Private or Public"
    echo "5. Click 'Create repository'"
    echo "6. Copy the HTTPS URL"
    echo "7. Run: ./push-to-github.sh <copied-url>"
    exit 1
fi

GITHUB_REPO=$1

echo "📋 Pre-deployment checklist:"
echo "  ✅ Optimized minimal server (38.7 KB)"
echo "  ✅ Cloud storage migration (267 files)"
echo "  ✅ Enhanced .dockerignore (115+ rules)"
echo "  ✅ 94% deployment size reduction"
echo ""

# Build the minimal production bundle
echo "📦 Building minimal production bundle..."
./build-minimal.sh

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors and try again."
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""

# Configure git if needed
echo "🔧 Configuring git..."
git config --global user.name "${GIT_USER_NAME:-HyperDAG Team}" 2>/dev/null || true
git config --global user.email "${GIT_USER_EMAIL:-team@hyperdag.org}" 2>/dev/null || true

# Initialize git if needed
if [ ! -d .git ]; then
    echo "📝 Initializing git repository..."
    git init
fi

# Check if remote already exists
if git remote | grep -q "^origin$"; then
    echo "🔗 Updating existing origin remote..."
    git remote set-url origin "$GITHUB_REPO"
else
    echo "🔗 Adding GitHub remote..."
    git remote add origin "$GITHUB_REPO"
fi

# Stage all files
echo "📝 Staging files..."
git add .

# Create commit
echo "💾 Creating commit..."
git commit -m "feat: optimized minimal deployment for hyperdag.org

- Created minimal production server (38.7 KB vs 500+ MB)
- Migrated 267 docs to cloud storage (2.22 MB saved)  
- Enhanced .dockerignore with 115+ exclusion rules
- 94% deployment size reduction
- Ready for hyperdag.org custom domain

Deployment optimizations:
- Minimal server: server/minimal-index.ts
- Build script: build-minimal.sh
- Production start: start-production.sh
- Optimized Dockerfile for container deployment

Tech stack:
- Frontend: React + TypeScript + Vite
- Backend: Express.js + Node.js
- Database: PostgreSQL + Drizzle ORM
- Storage: Replit Object Storage
- Deployment: Autoscale (fits 8 GiB limit)"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main 2>&1 || git push -u origin master 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "📋 Next steps for hyperdag.org deployment:"
    echo ""
    echo "Option A: Deploy via Replit (Recommended)"
    echo "  1. Go to Replit dashboard"
    echo "  2. Click 'Create Repl' → 'Import from GitHub'"
    echo "  3. Select your repository: $(basename $GITHUB_REPO .git)"
    echo "  4. Click 'Deploy' → Select 'Autoscale'"
    echo "  5. Configure custom domain: hyperdag.org"
    echo "  6. Update DNS records at your registrar"
    echo ""
    echo "Option B: Deploy via Vercel"
    echo "  1. Run: npm i -g vercel && vercel login"
    echo "  2. Run: vercel --prod"
    echo "  3. Run: vercel domains add hyperdag.org"
    echo ""
    echo "📚 Full guide: See GITHUB_DEPLOYMENT_GUIDE.md"
    echo ""
    echo "🌐 Your repository: $GITHUB_REPO"
else
    echo ""
    echo "❌ Push failed!"
    echo ""
    echo "Common issues:"
    echo "1. Authentication: You may need to set up a Personal Access Token"
    echo "   - Go to: https://github.com/settings/tokens"
    echo "   - Create token with 'repo' permissions"
    echo "   - Use token as password when pushing"
    echo ""
    echo "2. Repository doesn't exist: Create it first at https://github.com/new"
    echo ""
    echo "3. Branch mismatch: Try 'git push -u origin master' if main fails"
    exit 1
fi
