import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@propelai.com' },
    update: {},
    create: {
      email: 'demo@propelai.com',
      password: hashedPassword,
      name: 'Demo User',
      settings: {
        create: {
          companyName: 'PropelAI Solutions',
          primaryColor: '#4F46E5',
          accentColor: '#10B981',
          defaultTone: 'professional',
          defaultLength: 'medium',
          footerText: 'Generated with PropelAI',
        },
      },
    },
  });

  console.log('✅ Created demo user:', user.email);

  // Create templates
  const templates = [
    {
      name: 'Web Development Proposal',
      description: 'Standard structure for software development projects',
      type: 'PROJECT',
      icon: 'Layout',
      color: 'text-blue-600',
      isPublic: true,
      sections: [
        { title: 'Executive Summary', content: '', order: 0 },
        { title: 'Project Overview', content: '', order: 1 },
        { title: 'Technical Approach', content: '', order: 2 },
        { title: 'Timeline & Milestones', content: '', order: 3 },
        { title: 'Team & Resources', content: '', order: 4 },
        { title: 'Investment', content: '', order: 5 },
        { title: 'Next Steps', content: '', order: 6 },
      ],
    },
    {
      name: 'Marketing Retainer',
      description: 'Monthly services and analytics breakdown for marketing agencies',
      type: 'MARKETING',
      icon: 'BarChart3',
      color: 'text-pink-600',
      isPublic: true,
      sections: [
        { title: 'Executive Summary', content: '', order: 0 },
        { title: 'Scope of Services', content: '', order: 1 },
        { title: 'Strategy & Approach', content: '', order: 2 },
        { title: 'Deliverables', content: '', order: 3 },
        { title: 'Pricing & Terms', content: '', order: 4 },
        { title: 'Success Metrics', content: '', order: 5 },
      ],
    },
    {
      name: 'Grant Application',
      description: 'Formal structure for non-profit and research funding requests',
      type: 'GRANT',
      icon: 'FileText',
      color: 'text-emerald-600',
      isPublic: true,
      sections: [
        { title: 'Project Summary', content: '', order: 0 },
        { title: 'Need Statement', content: '', order: 1 },
        { title: 'Goals & Objectives', content: '', order: 2 },
        { title: 'Methods & Strategies', content: '', order: 3 },
        { title: 'Evaluation Plan', content: '', order: 4 },
        { title: 'Budget & Justification', content: '', order: 5 },
        { title: 'Organizational Capacity', content: '', order: 6 },
      ],
    },
    {
      name: 'Consulting Agreement',
      description: 'Professional services proposal for consulting engagements',
      type: 'CONSULTING',
      icon: 'User',
      color: 'text-amber-600',
      isPublic: true,
      sections: [
        { title: 'Executive Summary', content: '', order: 0 },
        { title: 'Problem Analysis', content: '', order: 1 },
        { title: 'Proposed Solution', content: '', order: 2 },
        { title: 'Methodology', content: '', order: 3 },
        { title: 'Deliverables', content: '', order: 4 },
        { title: 'Timeline', content: '', order: 5 },
        { title: 'Investment & Terms', content: '', order: 6 },
      ],
    },
    {
      name: 'Business Partnership',
      description: 'Strategic partnership and collaboration proposals',
      type: 'PARTNERSHIP',
      icon: 'Users',
      color: 'text-purple-600',
      isPublic: true,
      sections: [
        { title: 'Partnership Overview', content: '', order: 0 },
        { title: 'Strategic Alignment', content: '', order: 1 },
        { title: 'Value Proposition', content: '', order: 2 },
        { title: 'Collaboration Framework', content: '', order: 3 },
        { title: 'Roles & Responsibilities', content: '', order: 4 },
        { title: 'Terms & Conditions', content: '', order: 5 },
      ],
    },
  ];

  // Delete existing templates (for clean seed)
  await prisma.template.deleteMany({});

  // Create all templates
  for (const template of templates) {
    await prisma.template.create({
      data: template,
    });
  }

  console.log(`✅ Created ${templates.length} templates`);

  // Create a sample proposal for the demo user
  const sampleProposal = await prisma.proposal.create({
    data: {
      title: 'Sample Web Development Proposal',
      type: 'PROJECT',
      status: 'DRAFT',
      userId: user.id,
      sections: {
        create: [
          {
            title: 'Executive Summary',
            content: 'This proposal outlines our approach to developing a modern, scalable web application that will transform your digital presence and drive business growth.',
            order: 0,
          },
          {
            title: 'Technical Approach',
            content: 'We recommend a headless architecture utilizing React for the frontend and Node.js for the backend, ensuring maximum performance and scalability.',
            order: 1,
          },
        ],
      },
    },
  });

  console.log('✅ Created sample proposal:', sampleProposal.title);

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📧 Demo credentials:');
  console.log('   Email: demo@propelai.com');
  console.log('   Password: demo123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
