import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createProposalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['BUSINESS', 'PROJECT', 'GRANT', 'MARKETING', 'PARTNERSHIP', 'CONSULTING', 'SALES', 'CUSTOM']),
  templateId: z.string().optional(),
  sections: z.array(z.object({
    title: z.string(),
    content: z.string(),
    order: z.number(),
  })).optional(),
});

// GET /api/proposals - List all proposals for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: any = { userId: session.user.id };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const proposals = await prisma.proposal.findMany({
      where,
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
        template: true,
        _count: {
          select: { sections: true, exports: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(proposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }
}

// POST /api/proposals - Create a new proposal
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createProposalSchema.parse(body);

    // If templateId is provided, fetch template and create sections from it
    let templateSections: any[] = [];
    if (validatedData.templateId) {
      const template = await prisma.template.findUnique({
        where: { id: validatedData.templateId },
      });

      if (template && template.sections) {
        templateSections = template.sections as any[];
      }
    }

    const proposal = await prisma.proposal.create({
      data: {
        title: validatedData.title,
        type: validatedData.type,
        userId: session.user.id,
        templateId: validatedData.templateId,
        sections: {
          create: validatedData.sections || templateSections.map((section: any, index: number) => ({
            title: section.title,
            content: section.content || '',
            order: index,
          })),
        },
      },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
        template: true,
      },
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Error creating proposal:', error);
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 });
  }
}
