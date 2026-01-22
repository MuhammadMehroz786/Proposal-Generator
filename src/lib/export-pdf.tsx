import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface ProposalData {
  title: string;
  type: string;
  sections: {
    title: string;
    content: string;
    order: number;
  }[];
  companyName?: string;
  primaryColor?: string;
}

// Convert HTML to plain text for PDF rendering
function htmlToPlainText(html: string): string {
  if (!html) return '';

  let text = html
    // Convert block elements to line breaks
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<ul>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up multiple line breaks
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();

  return text;
}

// Wrap text to fit within max width
function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);

    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export async function generatePDF(data: ProposalData): Promise<Buffer> {
  try {
    console.log('📄 Starting PDF generation with pdf-lib for:', data.title);

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Embed fonts
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Add first page
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;
    const contentWidth = width - 2 * margin;
    let yPosition = height - margin;

    // --- Header ---
    // Title
    yPosition -= 30;
    page.drawText(data.title, {
      x: margin,
      y: yPosition,
      size: 28,
      font: fontBold,
      color: rgb(0.118, 0.161, 0.231), // #1E293B
    });

    // Subtitle
    yPosition -= 25;
    page.drawText(`${data.type.toUpperCase()} PROPOSAL`, {
      x: margin,
      y: yPosition,
      size: 12,
      font: fontRegular,
      color: rgb(0.392, 0.455, 0.545), // #64748B
    });

    // Company name
    if (data.companyName) {
      yPosition -= 18;
      page.drawText(data.companyName, {
        x: margin,
        y: yPosition,
        size: 10,
        font: fontRegular,
        color: rgb(0.392, 0.455, 0.545),
      });
    }

    // Header line
    yPosition -= 20;
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 2,
      color: rgb(0.310, 0.275, 0.898), // #4F46E5
    });

    yPosition -= 40;

    // --- Sections ---
    for (const section of data.sections) {
      // Check if we need a new page
      if (yPosition < 150) {
        page = pdfDoc.addPage();
        yPosition = height - margin - 30;
      }

      // Section title with left border
      page.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: margin, y: yPosition - 20 },
        thickness: 4,
        color: rgb(0.310, 0.275, 0.898),
      });

      page.drawText(section.title, {
        x: margin + 12,
        y: yPosition - 14,
        size: 18,
        font: fontBold,
        color: rgb(0.059, 0.090, 0.165), // #0F172A
      });

      yPosition -= 35;

      // Section content
      const plainText = htmlToPlainText(section.content);
      if (plainText) {
        const paragraphs = plainText.split('\n');

        for (const paragraph of paragraphs) {
          if (!paragraph.trim()) {
            yPosition -= 8;
            continue;
          }

          const lines = wrapText(paragraph, fontRegular, 11, contentWidth);

          for (const line of lines) {
            if (yPosition < 100) {
              page = pdfDoc.addPage();
              yPosition = height - margin - 30;
            }

            page.drawText(line, {
              x: margin,
              y: yPosition,
              size: 11,
              font: fontRegular,
              color: rgb(0.2, 0.255, 0.333), // #334155
              lineHeight: 16,
            });

            yPosition -= 16;
          }
        }
      }

      yPosition -= 30;
    }

    // --- Footer on all pages ---
    const pages = pdfDoc.getPages();
    const footerText = `Generated with PropelAI • ${new Date().toLocaleDateString()}`;

    for (const p of pages) {
      const textWidth = fontRegular.widthOfTextAtSize(footerText, 9);
      p.drawText(footerText, {
        x: (width - textWidth) / 2,
        y: 30,
        size: 9,
        font: fontRegular,
        color: rgb(0.58, 0.639, 0.722), // #94A3B8
      });
    }

    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    console.log('✅ PDF generated successfully! Size:', buffer.length, 'bytes');

    return buffer;
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    throw error;
  }
}
