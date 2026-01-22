// PDF export temporarily disabled
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

export async function generatePDF(data: ProposalData): Promise<Buffer> {
  throw new Error('PDF export is temporarily unavailable. Please contact support.');
}
