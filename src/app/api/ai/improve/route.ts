import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { improveContent } from '@/lib/openai';
import { z } from 'zod';

const improveSchema = z.object({
  content: z.string().min(1),
  instruction: z.string().min(1),
  proposalId: z.string().optional(),
  sectionId: z.string().optional(),
});

// POST /api/ai/improve - Improve existing content
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = improveSchema.parse(body);

    // Generate improved content using OpenAI
    const { content, tokensUsed, model } = await improveContent(
      validatedData.content,
      validatedData.instruction
    );

    // Log AI usage
    await prisma.aIUsage.create({
      data: {
        userId: session.user.id,
        model,
        tokensUsed,
        operation: 'improve',
        metadata: {
          proposalId: validatedData.proposalId,
          sectionId: validatedData.sectionId,
          instruction: validatedData.instruction,
        },
      },
    });

    return NextResponse.json({
      content,
      tokensUsed,
      model,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Error improving content:', error);
    return NextResponse.json(
      { error: 'Failed to improve content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
