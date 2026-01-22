import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateProposalSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(['DRAFT', 'REVIEW', 'COMPLETED', 'SENT', 'ARCHIVED']).optional(),
  type: z.enum(['BUSINESS', 'PROJECT', 'GRANT', 'MARKETING', 'PARTNERSHIP', 'CONSULTING', 'SALES', 'CUSTOM']).optional(),
});

// GET /api/proposals/[id] - Get a single proposal
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const proposal = await prisma.proposal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
        template: true,
        exports: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json({ error: 'Failed to fetch proposal' }, { status: 500 });
  }
}

// PATCH /api/proposals/[id] - Update a proposal
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.proposal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = updateProposalSchema.parse(body);

    const proposal = await prisma.proposal.update({
      where: { id },
      data: validatedData,
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
        template: true,
      },
    });

    return NextResponse.json(proposal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Error updating proposal:', error);
    return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 });
  }
}

// DELETE /api/proposals/[id] - Delete a proposal
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.proposal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    await prisma.proposal.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json({ error: 'Failed to delete proposal' }, { status: 500 });
  }
}
