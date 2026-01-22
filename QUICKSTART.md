# Quick Start Guide

Get your PropelAI Proposal Generator running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Update these required values in `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/propelai"
OPENAI_API_KEY="sk-your-key-here"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
```

## Step 3: Set Up Database

```bash
# Create database tables
npx prisma migrate dev --name init

# Seed with templates and demo user
npx prisma db seed
```

## Step 4: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 5: Login

Use the demo account:
- **Email**: demo@propelai.com
- **Password**: demo123

## What's Next?

1. **Create a Proposal** - Click "Create New Proposal"
2. **Choose a Template** - Select from pre-built templates
3. **Generate Content** - Use AI to write sections
4. **Export** - Download as PDF or DOCX

## Common Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Start production server

# Database
npm run db:studio              # Open Prisma Studio
npm run db:seed                # Seed database
npm run db:migrate             # Run migrations
npm run db:push                # Push schema changes

# Other
npm run lint                   # Run linter
```

## Troubleshooting

### Can't connect to database?
Make sure PostgreSQL is running and DATABASE_URL is correct.

### OpenAI API errors?
Verify your OPENAI_API_KEY is valid and has credits.

### Port 3000 already in use?
Run on a different port: `npm run dev -- -p 3001`

## Need Help?

Check the full [README.md](./README.md) for detailed documentation.
