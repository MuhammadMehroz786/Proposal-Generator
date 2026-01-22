# PropelAI - Professional Proposal Generator

A modern, AI-powered proposal generator built with Next.js, React, OpenAI, and PostgreSQL. Create professional business proposals with intelligent AI assistance, beautiful templates, and seamless export to PDF/DOCX.

## Features

- **AI-Powered Content Generation**: Generate proposal sections using GPT-4
- **Beautiful Templates**: Pre-built templates for various proposal types
- **Rich Text Editor**: Intuitive editing experience with real-time updates
- **Smart Export**: Export to PDF or DOCX with professional formatting
- **User Management**: Secure authentication with NextAuth.js
- **Analytics Dashboard**: Track proposal metrics and AI usage
- **Customizable Branding**: Add your company logo and colors
- **Responsive Design**: Works seamlessly on desktop and mobile

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **AI**: OpenAI GPT-4 API
- **Authentication**: NextAuth.js with JWT
- **State Management**: Zustand
- **Export**: @react-pdf/renderer, docx.js
- **Icons**: Lucide React

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- OpenAI API key

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Proposal
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file and update it with your credentials:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Database - Update with your PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/propelai?schema=public"

# OpenAI - Add your API key from https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-your-openai-api-key-here"

# NextAuth - Generate a secret with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# App Environment
NODE_ENV="development"
```

### 4. Set up the database

Run Prisma migrations to create your database schema:

```bash
npx prisma migrate dev --name init
```

### 5. Seed the database

Populate the database with templates and a demo user:

```bash
npx prisma db seed
```

This creates:
- Demo user: `demo@propelai.com` / `demo123`
- 5 professional proposal templates
- 1 sample proposal

### 6. Start the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## Usage

### Creating Your First Proposal

1. **Login** with demo credentials or create an account
2. **Choose a Template** from the template gallery
3. **Add Content** - Type manually or use AI generation
4. **Generate with AI** - Click "Generate with AI" on any section
5. **Export** - Download as PDF or DOCX when ready

### AI Features

#### Generate Section Content
- Click "Generate with AI" button in the editor
- Add context and customize tone/length
- AI generates professional content based on your inputs

#### Improve Existing Content
- Select content you want to improve
- Use quick actions: "Improve Writing", "Make Longer", "Fix Grammar"
- AI enhances your content while maintaining your voice

### Templates

Built-in templates include:
- **Web Development Proposal** - For software projects
- **Marketing Retainer** - For agency services
- **Grant Application** - For funding requests
- **Consulting Agreement** - For professional services
- **Business Partnership** - For strategic collaborations

### Exporting Proposals

1. Click "Review & Export" in the editor
2. Choose your format (PDF or DOCX)
3. Customize branding (logo, colors)
4. Click "Export Now" to download

## Project Structure

```
Proposal/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication
│   │   │   ├── proposals/     # Proposal CRUD
│   │   │   ├── ai/            # AI generation
│   │   │   ├── templates/     # Templates
│   │   │   └── stats/         # Analytics
│   │   ├── (dashboard)/       # Dashboard pages
│   │   ├── globals.css        # Global styles
│   │   └── layout.tsx         # Root layout
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   ├── openai.ts          # OpenAI utilities
│   │   ├── auth.ts            # Auth configuration
│   │   ├── api-client.ts      # Frontend API client
│   │   ├── export-pdf.ts      # PDF generation
│   │   └── export-docx.ts     # DOCX generation
│   └── store/
│       └── proposal-store.ts  # Zustand state management
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## API Endpoints

### Proposals
- `GET /api/proposals` - List all proposals
- `POST /api/proposals` - Create new proposal
- `GET /api/proposals/[id]` - Get single proposal
- `PATCH /api/proposals/[id]` - Update proposal
- `DELETE /api/proposals/[id]` - Delete proposal
- `POST /api/proposals/[id]/export` - Export proposal

### Sections
- `GET /api/proposals/[id]/sections` - List sections
- `POST /api/proposals/[id]/sections` - Create section
- `PATCH /api/proposals/[id]/sections/[sectionId]` - Update section
- `DELETE /api/proposals/[id]/sections/[sectionId]` - Delete section

### AI
- `POST /api/ai/generate` - Generate content
- `POST /api/ai/improve` - Improve content

### Other
- `GET /api/templates` - List templates
- `GET /api/stats` - Get user statistics

## Database Management

### View your database
```bash
npx prisma studio
```

### Create a new migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Reset database
```bash
npx prisma migrate reset
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Other Platforms

Works with any platform supporting Next.js:
- Railway
- Render
- AWS
- DigitalOcean

## Environment Variables for Production

```env
DATABASE_URL="your-production-database-url"
OPENAI_API_KEY="your-openai-api-key"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-production-secret"
NODE_ENV="production"
```

## Troubleshooting

### Database connection failed
- Verify PostgreSQL is running
- Check DATABASE_URL is correct
- Ensure database exists

### OpenAI API errors
- Verify API key is valid
- Check you have credits
- Ensure key has proper permissions

### Build errors
- Clear `.next` folder: `rm -rf .next`
- Delete node_modules: `rm -rf node_modules`
- Reinstall: `npm install`
- Rebuild: `npm run build`

## Cost Considerations

### OpenAI API Usage
- Average tokens per section: 500-1500
- GPT-4 pricing: ~$0.03-$0.09 per section
- Monitor usage in dashboard
- Consider GPT-3.5-turbo for lower costs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions:
- Create an issue on GitHub
- Email: support@propelai.com

## Roadmap

- [ ] Real-time collaboration
- [ ] Template marketplace
- [ ] Advanced AI fine-tuning
- [ ] Email delivery integration
- [ ] Version history
- [ ] Mobile app

---

Built with ❤️ using Next.js and OpenAI
