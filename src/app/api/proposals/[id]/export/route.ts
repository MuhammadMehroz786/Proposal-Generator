import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generatePDF } from '@/lib/export-pdf';
import { generateDOCX } from '@/lib/export-docx';
import { z } from 'zod';

const exportSchema = z.object({
  format: z.enum(['PDF', 'DOCX']),
});

// POST /api/proposals/[id]/export - Export proposal to PDF or DOCX
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { format } = exportSchema.parse(body);

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
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Prepare data for export
    const exportData = {
      title: proposal.title,
      type: proposal.type,
      sections: proposal.sections.map((s) => ({
        title: s.title,
        content: s.content,
        order: s.order,
      })),
      companyName: proposal.user.settings?.companyName,
      primaryColor: proposal.user.settings?.primaryColor,
    };

    let buffer: Buffer;
    let fileName: string;
    let contentType: string;

    if (format === 'PDF') {
      buffer = await generatePDF(exportData);
      fileName = `${proposal.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      contentType = 'application/pdf';
    } else {
      buffer = await generateDOCX(exportData);
      fileName = `${proposal.title.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    // Log export
    await prisma.export.create({
      data: {
        proposalId: proposal.id,
        format,
        fileName,
        fileSize: buffer.length,
        status: 'COMPLETED',
      },
    });

    // Return file as download
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Error exporting proposal:', error);
    return NextResponse.json(
      { error: 'Failed to export proposal', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
