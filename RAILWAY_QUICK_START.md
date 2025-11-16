# HyperDAG Railway Deployment - Quick Start

## 🚀 Deploy in 5 Steps (15 minutes total)

### 1️⃣ Sign Up (2 min)
- Go to https://railway.app
- Login with GitHub
- No credit card needed for free tier

### 2️⃣ Create Project (2 min)
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your HyperDAG repository

### 3️⃣ Add Database (1 min)
- Click "New" → "Database" → "PostgreSQL"
- Railway auto-generates `DATABASE_URL`

### 4️⃣ Add Environment Variables (5 min)
Run in Replit Shell to see your variables:
```bash
./export-env-for-railway.sh
```

Copy the output to Railway's "Variables" tab.

**Critical Variables:**
- `NODE_ENV=production`
- `PORT=5000`
- `SUPABASE_URL` (from script output)
- `SUPABASE_SERVICE_KEY` (from Replit Secrets)
- `OPENAI_API_KEY` (from Replit Secrets)
- `ANTHROPIC_API_KEY` (from Replit Secrets)
- `ALCHEMY_API_KEY` (from Replit Secrets)
- `MAILGUN_API_KEY` (from Replit Secrets)
- `MAILGUN_DOMAIN` (from script output)

### 5️⃣ Deploy (5 min)
- Railway auto-deploys when you connect GitHub
- Watch logs in "Deployments" tab
- Get your URL: `https://your-app.up.railway.app`

## ✅ Verification

Test your deployment:
```bash
curl https://your-app.up.railway.app/api/health
```

Should return: `{"success":true,"data":{"status":"ok",...}}`

## 📚 Full Documentation

See `RAILWAY_DEPLOYMENT_GUIDE.md` for detailed instructions and troubleshooting.

## 🎯 Next: Trinity Symphony

After HyperDAG is on Railway:
1. Deploy APM (AI-Prompt-Manager) on separate Railway/Replit
2. Deploy MEL (ImageBearer) on Lovable.dev
3. Update Supabase coordination URLs
4. Test distributed Trinity system

## 💰 Cost

**Free Tier:**
- 500 hours/month
- $5 free credits
- Perfect for development

**Production:**
- ~$10-20/month for moderate traffic
- Scales automatically
- Set spending limits in Railway dashboard
