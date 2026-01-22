import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateProposalSection } from '@/lib/openai';
import { z } from 'zod';

const generateSchema = z.object({
  proposalId: z.string(),
  sectionId: z.string().optional(),
  title: z.string().min(1),
  context: z.string().optional(),
  tone: z.string().optional(),
  length: z.string().optional(),
  includePreviousSections: z.boolean().optional(),
});

// POST /api/ai/generate - Generate content for a proposal section
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = generateSchema.parse(body);

    // Verify ownership
    const proposal = await prisma.proposal.findFirst({
      where: {
        id: validatedData.proposalId,
        userId: session.user.id,
      },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Get user settings for default tone/length
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    const tone = validatedData.tone || userSettings?.defaultTone || 'professional';
    const length = validatedData.length || userSettings?.defaultLength || 'medium';

    // Prepare previous sections for context
    let previousSections: { title: string; content: string }[] = [];
    if (validatedData.includePreviousSections) {
      previousSections = proposal.sections
        .filter((s) => s.content && s.content.trim().length > 0)
        .map((s) => ({ title: s.title, content: s.content }));
    }

    // Generate content using OpenAI
    const { content, tokensUsed, model } = await generateProposalSection({
      title: validatedData.title,
      context: validatedData.context,
      tone,
      length,
      previousSections,
    });

    // Log AI usage
    await prisma.aIUsage.create({
      data: {
        userId: session.user.id,
        model,
        tokensUsed,
        operation: 'generate',
        metadata: {
          proposalId: validatedData.proposalId,
          sectionId: validatedData.sectionId,
          title: validatedData.title,
          tone,
          length,
        },
      },
    });

    // Update section if sectionId is provided
    if (validatedData.sectionId) {
      await prisma.proposalSection.update({
        where: { id: validatedData.sectionId },
        data: {
          content,
          aiGenerated: true,
          metadata: {
            tokensUsed,
            model,
            tone,
            length,
            generatedAt: new Date().toISOString(),
          },
        },
      });
    }

    return NextResponse.json({
      content,
      tokensUsed,
      model,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: 'Failed to generate content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
