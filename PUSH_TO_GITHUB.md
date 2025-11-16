# Push HyperDAG to GitHub for Railway Deployment

## Quick Steps (5 minutes)

### 1. Create New GitHub Repository
1. Go to https://github.com/new
2. Repository name: `hyperdag-platform` (or any name you like)
3. Description: "HyperDAG - Distributed AI Optimization Platform"
4. **Important**: Set to **Private** (contains API keys in history)
5. **Do NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

### 2. Get Your Repository URL
After creating, GitHub shows you the repo URL. Copy it:
```
https://github.com/YOUR-USERNAME/hyperdag-platform.git
```

### 3. Push Code from Replit Shell

Run these commands in Replit Shell:

```bash
# Remove Replit's git remote
git remote remove gitsafe-backup

# Add your GitHub repository
git remote add origin https://github.com/YOUR-USERNAME/hyperdag-platform.git

# Push all code to GitHub
git branch -M main
git push -u origin main
```

**Note:** GitHub will ask for authentication:
- Username: Your GitHub username
- Password: Use a **Personal Access Token** (not your password)
  - Create token: https://github.com/settings/tokens
  - Select scope: `repo` (full control)
  - Copy the token and paste when prompted

### 4. Deploy on Railway
1. Go back to Railway
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your new `hyperdag-platform` repository
4. Railway will detect the Node.js app and start building

### 5. Add Environment Variables
Follow the steps in `RAILWAY_QUICK_START.md` to add your environment variables.

---

## Alternative: Use GitHub CLI (Faster)

If you have GitHub CLI installed:
```bash
gh repo create hyperdag-platform --private --source=. --remote=origin --push
```

Then deploy on Railway.

---

## Troubleshooting

**Error**: "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR-USERNAME/hyperdag-platform.git
```

**Error**: Authentication failed
- Use Personal Access Token, not password
- Create at: https://github.com/settings/tokens
- Scope needed: `repo`
