import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const {
      proposalType,
      title,
      client,
      problem,
      solution,
      deliverables,
      timeline,
      budget,
    } = data;

    // Map proposal type to enum
    const typeMap: Record<string, string> = {
      business: 'BUSINESS',
      project: 'PROJECT',
      grant: 'GRANT',
      marketing: 'MARKETING',
      consulting: 'CONSULTING',
      partnership: 'PARTNERSHIP',
      sales: 'SALES',
    };

    const proposalTypeEnum = typeMap[proposalType?.toLowerCase()] || 'CUSTOM';

    // Define sections based on proposal type
    const sections = [
      { title: 'Executive Summary', order: 0 },
      { title: 'Problem Statement', order: 1 },
      { title: 'Proposed Solution', order: 2 },
      { title: 'Deliverables', order: 3 },
      { title: 'Timeline', order: 4 },
      { title: 'Investment', order: 5 },
      { title: 'Next Steps', order: 6 },
    ];

    // Generate content for each section using OpenAI
    const sectionContents: Record<string, string> = {};

    for (const section of sections) {
      const prompt = generatePromptForSection(section.title, {
        title,
        client,
        problem,
        solution,
        deliverables,
        timeline,
        budget,
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert business proposal writer. Generate professional, compelling content for proposal sections.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      sectionContents[section.title] = completion.choices[0]?.message?.content || '';

      // Log AI usage
      await prisma.aIUsage.create({
        data: {
          userId: session.user.id,
          model: 'gpt-4',
          tokensUsed: completion.usage?.total_tokens || 0,
          operation: 'generate-proposal',
          metadata: { section: section.title },
        },
      });
    }

    // Create the proposal with all sections
    const proposal = await prisma.proposal.create({
      data: {
        title: title || 'New Proposal',
        type: proposalTypeEnum as any,
        userId: session.user.id,
        sections: {
          create: sections.map((section) => ({
            title: section.title,
            content: sectionContents[section.title] || '',
            order: section.order,
            aiGenerated: true,
          })),
        },
      },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error('Error generating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to generate proposal', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function generatePromptForSection(sectionTitle: string, context: any): string {
  const baseContext = `
Project Title: ${context.title}
Client/Audience: ${context.client}
Problem: ${context.problem}
Solution: ${context.solution}
Deliverables: ${context.deliverables}
Timeline: ${context.timeline}
Budget: ${context.budget}
`;

  const prompts: Record<string, string> = {
    'Executive Summary': `Write a compelling executive summary for this proposal. Summarize the key points in 2-3 paragraphs.\n\n${baseContext}`,

    'Problem Statement': `Write a detailed problem statement that clearly describes the challenge or need. Make it relatable and show understanding of the client's situation.\n\n${baseContext}`,

    'Proposed Solution': `Describe the proposed solution in detail. Explain how it addresses the problem and why it's the best approach.\n\n${baseContext}`,

    'Deliverables': `List and describe the key deliverables or outcomes. Be specific and measurable.\n\n${baseContext}`,

    'Timeline': `Create a realistic timeline with key milestones. Be specific about phases and durations.\n\n${baseContext}`,

    'Investment': `Present the budget/investment in a professional way. Break down costs if applicable and emphasize value.\n\n${baseContext}`,

    'Next Steps': `Outline the immediate next steps and call to action. Make it clear and actionable.\n\n${baseContext}`,
  };

  return prompts[sectionTitle] || `Write content for the ${sectionTitle} section.\n\n${baseContext}`;
}
