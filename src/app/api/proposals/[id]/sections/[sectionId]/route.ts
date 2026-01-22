import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSectionSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  order: z.number().optional(),
});

// PATCH /api/proposals/[id]/sections/[sectionId] - Update a section
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; sectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const proposal = await prisma.proposal.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = updateSectionSchema.parse(body);

    const section = await prisma.proposalSection.update({
      where: { id: params.sectionId },
      data: validatedData,
    });

    return NextResponse.json(section);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Error updating section:', error);
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
  }
}

// DELETE /api/proposals/[id]/sections/[sectionId] - Delete a section
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; sectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const proposal = await prisma.proposal.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    await prisma.proposalSection.delete({
      where: { id: params.sectionId },
    });

    return NextResponse.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 });
  }
}
