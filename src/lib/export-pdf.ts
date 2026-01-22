// PDF export temporarily disabled - will be re-enabled after deployment
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
  throw new Error('PDF export is temporarily unavailable. Will be enabled after deployment.');
}
