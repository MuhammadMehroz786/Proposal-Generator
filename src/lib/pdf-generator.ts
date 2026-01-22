import { jsPDF } from 'jspdf';

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
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<ul>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();

  return text;
}

export async function generatePDF(data: ProposalData): Promise<Buffer> {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  const checkPageBreak = (neededSpace: number) => {
    if (yPosition + neededSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(data.title, margin, yPosition);
  yPosition += 12;

  // Subtitle
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`${data.type} Proposal`, margin, yPosition);
  yPosition += 8;

  // Line separator
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Company name
  if (data.companyName) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(data.companyName, margin, yPosition);
    yPosition += 10;
  }

  doc.setTextColor(0, 0, 0);

  // Sections
  for (const section of data.sections) {
    checkPageBreak(20);

    // Section title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, margin, yPosition);
    yPosition += 8;

    // Section content
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const plainText = htmlToPlainText(section.content);
    const lines = doc.splitTextToSize(plainText, maxWidth);

    for (const line of lines) {
      checkPageBreak(7);
      doc.text(line, margin, yPosition);
      yPosition += 7;
    }

    yPosition += 5;
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    const footerText = `Generated with PropelAI • ${new Date().toLocaleDateString()}`;
    const textWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - textWidth) / 2, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}
