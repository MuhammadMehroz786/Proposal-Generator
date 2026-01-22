import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateProposalSection = async ({
  title,
  context,
  tone = 'professional',
  length = 'medium',
  previousSections = [],
}: {
  title: string;
  context?: string;
  tone?: string;
  length?: string;
  previousSections?: { title: string; content: string }[];
}) => {
  const lengthInstructions = {
    short: 'Keep it concise, 2-3 paragraphs maximum.',
    medium: 'Provide detailed content, 4-6 paragraphs.',
    long: 'Provide comprehensive content, 6-10 paragraphs with examples.',
  };

  const toneInstructions = {
    professional: 'Use a professional, business-appropriate tone.',
    casual: 'Use a friendly, conversational tone while maintaining professionalism.',
    formal: 'Use a very formal, corporate tone with traditional business language.',
    persuasive: 'Use a compelling, persuasive tone focused on benefits and value.',
  };

  const previousContext = previousSections.length > 0
    ? `\n\nPrevious sections for context:\n${previousSections.map(s => `${s.title}:\n${s.content}`).join('\n\n')}`
    : '';

  const prompt = `You are a professional proposal writer. Generate content for the "${title}" section of a business proposal.

${context ? `Additional context: ${context}` : ''}

Tone: ${toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.professional}
Length: ${lengthInstructions[length as keyof typeof lengthInstructions] || lengthInstructions.medium}
${previousContext}

Write clear, compelling content that fits naturally in a professional business proposal. Do not include the section title in your response, just the content.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert business proposal writer with years of experience crafting winning proposals.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const content = completion.choices[0]?.message?.content || '';
  const tokensUsed = completion.usage?.total_tokens || 0;

  return { content, tokensUsed, model: 'gpt-4' };
};

export const improveContent = async (content: string, instruction: string) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert editor helping improve business proposal content.',
      },
      {
        role: 'user',
        content: `Improve the following content based on this instruction: "${instruction}"\n\nContent:\n${content}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const improvedContent = completion.choices[0]?.message?.content || content;
  const tokensUsed = completion.usage?.total_tokens || 0;

  return { content: improvedContent, tokensUsed, model: 'gpt-4' };
};
