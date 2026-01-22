export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/proposals/[id]/export-pdf - Export proposal to PDF
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = await params;

    // Get proposal with sections
    const proposal = await prisma.proposal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
        user: {
          include: {
            settings: true,
          },
        },
      },
    });

    if (!proposal) {
      return new Response('Proposal not found', { status: 404 });
    }

    // Dynamic import to avoid build issues
    const { generatePDF } = await import('@/lib/pdf-generator');

    const exportData = {
      title: proposal.title,
      type: proposal.type,
      sections: proposal.sections.map((s) => ({
        title: s.title,
        content: s.content,
        order: s.order,
      })),
      companyName: proposal.user.settings?.companyName ?? undefined,
      primaryColor: proposal.user.settings?.primaryColor,
    };

    const pdfBuffer = await generatePDF(exportData);
    const fileName = `${proposal.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    // Log export
    await prisma.export.create({
      data: {
        proposalId: proposal.id,
        format: 'PDF',
        fileName,
        fileSize: pdfBuffer.length,
        status: 'COMPLETED',
      },
    });

    // Return PDF file
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error exporting proposal:', error);
    return new Response('Failed to export proposal', { status: 500 });
  }
}
