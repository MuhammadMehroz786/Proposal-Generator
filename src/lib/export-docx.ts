// Simple text-based DOCX generation
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

// Convert HTML to plain text
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

export async function generateDOCX(data: ProposalData): Promise<Buffer> {
  // Generate simple RTF format (compatible with Word)
  let rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0\\fswiss Arial;}}
{\\colortbl;\\red79\\green70\\blue229;\\red100\\green100\\blue100;}

{\\pard\\qc\\b\\fs48 ${data.title}\\par}
{\\pard\\qc\\cf2\\fs20 ${data.type} Proposal\\par}
${data.companyName ? `{\\pard\\qc\\cf2\\fs16 ${data.companyName}\\par}` : ''}
\\par\\par

`;

  // Add sections
  for (const section of data.sections) {
    const plainContent = htmlToPlainText(section.content);

    rtfContent += `{\\pard\\b\\fs28 ${section.title}\\par}
{\\pard\\fs22 ${plainContent.replace(/\n/g, '\\par ')}\\par}
\\par\\par
`;
  }

  // Add footer
  rtfContent += `{\\pard\\qc\\cf2\\i\\fs16 Generated with PropelAI • ${new Date().toLocaleDateString()}\\par}
}`;

  // Convert to Buffer (RTF files can be opened by Word)
  return Buffer.from(rtfContent, 'utf-8');
}
