import ModelRegistry from '@/lib/models/registry';
import { ModelWithProvider } from '@/lib/models/types';
import { getAllSettings } from '@/lib/config/settings';
import ThrottledLLM from '@/lib/models/throttledLLM';
import { globalLlmSemaphore } from '@/lib/models/throttle';
import configManager from '@/lib/config';
import { withRetry } from '@/lib/utils/withRetry';

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

    const settings = await getAllSettings();
    let mainLlm = llm;
    if (settings.throttleEnabled) {
      globalLlmSemaphore.setMax(settings.maxParallelLlmCalls);
      mainLlm = new ThrottledLLM(llm);
    }

    const conversationText = body.chatHistory
      .map(
        ([role, content]) =>
          `${role === 'human' ? 'User' : 'Assistant'}: ${content}`,
      )
      .join('\n\n');

    const searchConfig = configManager.getCurrentConfig().search;
    const result = await withRetry(
      () => mainLlm.generateText({
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
      }),
      {
        timeout: searchConfig.llmTimeout || 60000,
        maxRetries: searchConfig.llmMaxRetries || 3,
      },
    );

    return Response.json({ summary: result.content }, { status: 200 });
  } catch (err) {
    console.error('Error generating summary:', err);
    return Response.json(
      { message: 'An error occurred while generating summary' },
      { status: 500 },
    );
  }
};
