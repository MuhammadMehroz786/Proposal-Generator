# Railway Deployment Guide

This guide will help you deploy the PropelAI Proposal Generator to Railway.

## Prerequisites

- A [Railway account](https://railway.app/)
- Railway CLI installed (optional): `npm i -g @railway/cli`
- Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Repository

1. Initialize git if you haven't already:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Push to your Git provider (GitHub, GitLab, or Bitbucket)

## Step 2: Create a New Project on Railway

1. Go to [Railway](https://railway.app/) and log in
2. Click "New Project"
3. Select "Deploy from GitHub repo" (or your Git provider)
4. Select your repository
5. Railway will automatically detect it's a Next.js app

## Step 3: Configure Environment Variables

In your Railway project dashboard, go to the "Variables" tab and add **ONLY** these:

```env
# OpenAI
OPENAI_API_KEY=your-openai-api-key-here

# NextAuth (generate secret with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-secret-key-here

# App
NODE_ENV=production
```

### Important Notes:
- **DATABASE_URL**: Automatically set - no configuration needed! The database is created automatically.
- **NEXTAUTH_URL**: Automatically set by Railway - no configuration needed!
- **OPENAI_API_KEY**: Get this from [OpenAI Platform](https://platform.openai.com/api-keys)
- **NEXTAUTH_SECRET**: Generate with `openssl rand -base64 32`

### That's it! Only 3 variables to set.

## Step 4: That's It!

**No database setup needed!** The SQLite database is created automatically when the app starts. Everything is handled for you:

- ✅ Database file is automatically created
- ✅ Tables are automatically created
- ✅ No manual configuration required

**Note:** Data is **non-persistent** - it will be reset on each deployment or restart. Perfect for testing!

## Step 5: Deploy

Railway will automatically deploy your app. The deployment process includes:

1. Installing dependencies
2. Generating Prisma client
3. Building Next.js app
4. Running database migrations with `prisma db push`
5. Starting the application

## Step 6: Verify Deployment

1. Once deployed, click on your service in Railway
2. Go to the "Settings" tab to find your public URL
3. Visit the URL to verify your app is running
4. Try creating an account and logging in

## Monitoring

- **Logs**: Check the "Deployments" tab to view real-time logs
- **Metrics**: Monitor CPU, memory, and network usage in the "Metrics" tab
- **Database**: The SQLite database is stored in the persistent volume at `/data/propelai.db`

## Updating Your App

To deploy updates:

1. Make your changes locally
2. Commit and push to your repository:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```
3. Railway will automatically detect the changes and redeploy

## Using Railway CLI (Optional)

If you prefer using the CLI:

1. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Login:
   ```bash
   railway login
   ```

3. Link your project:
   ```bash
   railway link
   ```

4. Deploy:
   ```bash
   railway up
   ```

## Troubleshooting

### Database Issues

If you encounter database errors:
1. Check that `DATABASE_URL=file:/data/propelai.db` is set correctly
2. Verify the volume is mounted by checking Railway logs
3. The database will be created automatically on first run

### Build Failures

If the build fails:
1. Check the build logs in Railway dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version compatibility

### Environment Variables

If features aren't working:
1. Verify all environment variables are set in Railway
2. Check that `NEXTAUTH_URL` matches your Railway domain
3. Ensure `OPENAI_API_KEY` is valid

## Costs

Railway offers:
- **Free tier**: $5 of usage per month
- **Pro plan**: $20/month with additional usage credits

Your app will likely fit within the free tier for development/testing.

## Custom Domain (Optional)

To use a custom domain:
1. Go to your service Settings in Railway
2. Click "Generate Domain" or "Custom Domain"
3. Follow the instructions to configure DNS

## Support

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Railway Help Center](https://help.railway.app/)
