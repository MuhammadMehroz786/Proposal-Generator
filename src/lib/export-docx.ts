import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';

interface ProposalData {
  title: string;
  type: string;
  sections: {
    title: string;
    content: string;
    order: number;
  }[];
  companyName?: string;
}

export async function generateDOCX(data: ProposalData): Promise<Buffer> {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      text: data.title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.LEFT,
      spacing: { after: 200 },
    })
  );

  // Subtitle
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${data.type} Proposal`,
          size: 24,
          color: '64748B',
          allCaps: true,
        }),
      ],
      spacing: { after: 400 },
      border: {
        bottom: {
          color: '4F46E5',
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
    })
  );

  // Company name if provided
  if (data.companyName) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.companyName,
            size: 20,
            color: '64748B',
          }),
        ],
        spacing: { after: 600 },
      })
    );
  }

  // Sections
  data.sections.forEach((section) => {
    // Section title
    children.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    // Section content - split into paragraphs
    const paragraphs = section.content.split('\n\n');
    paragraphs.forEach((para) => {
      if (para.trim()) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: para.trim(),
                size: 22,
              }),
            ],
            spacing: { after: 200 },
            alignment: AlignmentType.JUSTIFIED,
          })
        );
      }
    });
  });

  // Footer
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated with PropelAI • ${new Date().toLocaleDateString()}`,
          size: 18,
          color: '94A3B8',
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 800 },
      border: {
        top: {
          color: 'E2E8F0',
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
    })
  );

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
