# 🚀 Deployment Guide — ICSE/CBSE Project Forge

## Quick Deploy (15 minutes) — Railway

### Why Railway?
- ✅ Persistent volumes (SQLite works!)
- ✅ Free $5/month credit (covers small apps)
- ✅ Auto-deploy from GitHub
- ✅ No code changes needed

### Steps

#### 1. Push to GitHub (2 min)
```bash
cd /home/z/my-project
git init
git add -A
git commit -m "ICSE/CBSE Project Forge — production ready"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/icse-cbse-forge.git
git push -u origin main
```

#### 2. Create Railway account (1 min)
- Go to https://railway.app
- Sign in with GitHub
- Click "New Project" → "Deploy from GitHub repo"
- Select your `icse-cbse-forge` repo

#### 3. Configure environment variables (3 min)
In Railway dashboard → "Variables" tab, add:

**Required:**
```
DATABASE_URL=file:/app/data/custom.db
```

**AI keys (add what you have — at minimum GITHUB_TOKEN for free DeepSeek):**
```
GITHUB_TOKEN=github_pat_xxx        # FREE DeepSeek V3 access
GROQ_API_KEY=gsk_xxx               # FREE, fastest model
GEMINI_API_KEY=AIzaSyxxx           # FREE, multimodal
MISTRAL_API_KEY=xxx                # FREE, code-focused
```

**Optional (paid):**
```
OPENAI_API_KEY=sk-xxx
DEEPSEEK_API_KEY=sk-xxx
XAI_API_KEY=xai-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
PERPLEXITY_API_KEY=pplx-xxx
OPENROUTER_API_KEY=sk-or-xxx
```

#### 4. Add persistent volume (1 min)
Railway dashboard → "Settings" → "Volumes" → "Add Volume":
- Mount path: `/app/data`
- Name: `app-data`

#### 5. Deploy (2 min)
Railway auto-builds + deploys. Wait for green "Active" status.

#### 6. Seed the knowledge base (5 min)
First deploy = empty database. Run the seed script:
```bash
# In Railway dashboard → "Shell" tab:
bun run scripts/seed-for-deployment.ts
```

This ingests all ICSE + CBSE data (10K+ chunks). Takes ~5 minutes.

#### 7. Your app is live! 🎉
Railway gives you a URL like `icse-cbse-forge-production.up.railway.app`

---

## Alternative: Render (similar process)

1. Go to https://render.com
2. "New" → "Web Service" → connect GitHub repo
3. Settings:
   - Build Command: `bun install && bun run db:generate && bun run build`
   - Start Command: `bun run db:push && node .next/standalone/server.js`
   - Add persistent disk: `/app/data` (1GB)
4. Add environment variables (same as Railway)
5. Deploy

---

## Alternative: Vercel (requires PostgreSQL migration)

Vercel is serverless — **SQLite won't work**. You'd need to:

1. Migrate to PostgreSQL (Neon/Supabase free tier)
2. Change `prisma/schema.prisma` datasource to postgresql
3. Move generated images to S3/Cloudinary
4. Deploy on Vercel

**Not recommended** unless you need massive scale. Railway/Render are easier.

---

## Files prepared for deployment

| File | Purpose |
|---|---|
| `Dockerfile` | Docker build config (works on Railway/Render/Fly.io) |
| `railway.toml` | Railway-specific config |
| `.dockerignore` | Excludes large files from Docker build |
| `.env.example` | Template for all env vars |
| `scripts/seed-for-deployment.ts` | One-command DB seeding |

## Cost estimate (Railway)

| Resource | Usage | Cost |
|---|---|---|
| Compute (512MB RAM) | Always-on | ~$3-5/month |
| Storage (1GB volume) | DB + images | ~$0.25/month |
| Bandwidth | 100GB free | $0 |
| **Total** | | **~$5/month** (covered by free credit) |

## After deployment

1. **Test the app** at your Railway URL
2. **Set up custom domain** (optional) in Railway → "Settings" → "Networking"
3. **Monitor logs** in Railway dashboard
4. **Back up DB** periodically: Railway → Shell → `cp /app/data/custom.db /tmp/backup.db`

## Need help?
- Railway docs: https://docs.railway.app
- The app is fully production-ready — all code works, just needs hosting
