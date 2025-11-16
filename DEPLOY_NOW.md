# Deploy HyperDAG to Railway - RIGHT NOW

## The Problem
You're trying to deploy `trinity-symphony-shared` but we prepared **THIS workspace** with all the Railway configuration.

## The Fix (10 minutes total)

### Step 1: Create New GitHub Repo (2 min)
1. Go to: https://github.com/new
2. Repository name: `hyperdag-trinity`
3. **Set to PRIVATE** (important - contains secrets)
4. **Do NOT check** "Initialize with README"
5. Click "Create repository"

### Step 2: Push This Workspace (3 min)

Copy this entire block and paste in Replit Shell:

```bash
# Initialize git if needed
git init

# Remove Replit backup remote
git remote remove gitsafe-backup 2>/dev/null || true

# Add YOUR GitHub repo (CHANGE YOUR-USERNAME!)
git remote add origin https://github.com/YOUR-USERNAME/hyperdag-trinity.git

# Add all files
git add .

# Commit
git commit -m "Deploy to Railway with full configuration"

# Push to GitHub
git branch -M main
git push -u origin main
```

**Authentication:**
- Username: Your GitHub username
- Password: **Use Personal Access Token** (not password!)
  - Create at: https://github.com/settings/tokens/new
  - Check "repo" scope
  - Copy token and paste when prompted

### Step 3: Deploy on Railway (5 min)

1. **Delete the failed deployment:**
   - Railway dashboard → Click your failed project
   - Settings (bottom left) → "Delete Project" → Confirm
   
2. **Create new deployment:**
   - Click "New Project"
   - "Deploy from GitHub repo"
   - Select `hyperdag-trinity` (the new repo you just pushed)
   
3. **Add PostgreSQL:**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway auto-generates `DATABASE_URL`

4. **Add Environment Variables:**
   - Click on your service → "Variables" tab
   - Copy these (get API keys from Replit Secrets):
   ```
   NODE_ENV=production
   PORT=5000
   SUPABASE_URL=https://qnnpjhlxljtqyigedwkb.supabase.co
   SUPABASE_SERVICE_KEY=<from Replit Secrets>
   OPENAI_API_KEY=<from Replit Secrets>
   ANTHROPIC_API_KEY=<from Replit Secrets>
   ALCHEMY_API_KEY=<from Replit Secrets>
   MAILGUN_API_KEY=<from Replit Secrets>
   MAILGUN_DOMAIN=sandboxc2b9a8181a474513839cd2dd976c1d51.mailgun.org
   ```

5. **Watch it build:**
   - Deployments tab
   - Build logs should show:
     - ✅ "Nixpacks: Detected Node.js"
     - ✅ "npm install" (6145 packages - Railway has no 8GB limit!)
     - ✅ "npm run build:all"
     - ✅ "npm start"
   - Get URL: `https://hyperdag-trinity-production.up.railway.app`

6. **Test:**
   ```bash
   curl https://YOUR-URL.railway.app/api/health
   ```
   Should return: `{"success":true,"data":{"status":"ok",...}}`

---

## Why This Works

✅ **This workspace has:**
- `railway.json` (tells Railway how to build)
- `Procfile` (tells Railway how to start)
- `package.json` with `build:all` and `start` scripts
- All 6145 packages (Railway has no size limit)

❌ **trinity-symphony-shared has:**
- None of the above
- That's why it fails

---

## If You Get Stuck

**Error pushing to GitHub?**
- Make sure you use Personal Access Token, not password
- Create at: https://github.com/settings/tokens/new

**Railway build fails?**
- Share the build logs
- We'll debug together

**Can't find Replit Secrets?**
- Run: `./export-env-for-railway.sh`
- Or: Tools → Secrets in Replit sidebar
