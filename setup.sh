#!/bin/bash

echo "🚀 PropelAI Setup Script"
echo "========================"
echo ""

# Check if .env exists and has API key
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    exit 1
fi

if grep -q "YOUR_API_KEY_HERE" .env; then
    echo "⚠️  Please add your OpenAI API key to the .env file first"
    echo "   Edit the line: OPENAI_API_KEY=\"YOUR_API_KEY_HERE\""
    echo ""
    echo "   Then run this script again!"
    exit 1
fi

echo "✅ Environment variables configured"
echo ""

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️  Setting up SQLite database..."
npx prisma db push --accept-data-loss

# Seed database
echo "🌱 Seeding database with templates and demo user..."
npm run db:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎉 You can now run: npm run dev"
echo ""
echo "📧 Demo Login:"
echo "   Email: demo@propelai.com"
echo "   Password: demo123"
echo ""
