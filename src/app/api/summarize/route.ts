import ModelRegistry from '@/lib/models/registry';
import { ModelWithProvider } from '@/lib/models/types';

interface SummarizeBody {
  chatHistory: [string, string][];
  chatModel: ModelWithProvider;
}

export const POST = async (req: Request) => {
  try {
    const body: SummarizeBody = await req.json();
    const registry = new ModelRegistry();
    const llm = await registry.loadChatModel(
      body.chatModel.providerId,
      body.chatModel.key,
    );

    const conversationText = body.chatHistory
      .map(
        ([role, content]) =>
          `${role === 'human' ? 'User' : 'Assistant'}: ${content}`,
      )
      .join('\n\n');

    const result = await llm.generateText({
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at summarizing conversations. Provide a concise, well-structured summary of the following conversation. Capture key questions, answers, insights, and conclusions.',
        },
        {
          role: 'user',
          content: conversationText,
        },
      ],
    });

    return Response.json({ summary: result.content }, { status: 200 });
  } catch (err) {
    console.error('Error generating summary:', err);
    return Response.json(
      { message: 'An error occurred while generating summary' },
      { status: 500 },
    );
  }
};
