// DOCX export temporarily disabled
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
  throw new Error('DOCX export is temporarily unavailable. Please use PDF export instead.');
}
