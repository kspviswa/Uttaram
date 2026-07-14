import db from '@/lib/db';
import { chats, messages, chatRelations } from '@/lib/db/schema';
import ModelRegistry from '@/lib/models/registry';
import { ModelWithProvider } from '@/lib/models/types';
import { getAllSettings } from '@/lib/config/settings';
import ThrottledLLM from '@/lib/models/throttledLLM';
import { globalLlmSemaphore } from '@/lib/models/throttle';
import configManager from '@/lib/config';
import { withRetry } from '@/lib/utils/withRetry';
import embeddingService from '@/lib/embedding/service';

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const { messages: sourceMessages, chatId, title, chatModel } = body;

    if (
      !sourceMessages ||
      !Array.isArray(sourceMessages) ||
      sourceMessages.length === 0
    ) {
      return Response.json({ message: 'Messages are required' }, { status: 400 });
    }

    const registry = new ModelRegistry();
    const llm = await registry.loadChatModel(
      chatModel.providerId,
      chatModel.key,
    );

    const settings = await getAllSettings();
    let mainLlm = llm;
    if (settings.throttleEnabled) {
      globalLlmSemaphore.setMax(settings.maxParallelLlmCalls);
      mainLlm = new ThrottledLLM(llm);
    }

    const conversationText = sourceMessages
      .map((msg: any) => `User: ${msg.query}\nAssistant: ${extractText(msg.responseBlocks)}`)
      .join('\n\n');

    const searchConfig = configManager.getCurrentConfig().search;
    const summaryResult = await withRetry(
      () => mainLlm.generateText({
        messages: [
          {
            role: 'system',
            content:
              'You are an expert at summarizing conversations. Provide a concise, well-structured summary that captures the key questions, answers, insights, and conclusions from the conversation. Write in a clear narrative style.',
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

    const newChatId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(chats).values({
      id: newChatId,
      title: title || 'Forked Chat',
      createdAt: now,
      sources: [],
      files: [],
      projectId: null,
      parentId: chatId || null,
    });

    // Embed forked chat asynchronously
    embeddingService.embedChat(newChatId).catch((err) => {
      console.error('[ForkAPI] Failed to embed chat:', err);
    });

    const summaryMessageId = crypto.randomUUID();
    await db.insert(messages).values({
      chatId: newChatId,
      messageId: summaryMessageId,
      backendId: crypto.randomUUID(),
      query: 'Forked conversation — summary below',
      createdAt: now,
      responseBlocks: [
        {
          id: crypto.randomUUID(),
          type: 'text',
          data: `## Forked Conversation\n\nThis chat was forked from a previous conversation.\n\n### Summary\n\n${summaryResult.content}`,
        },
      ],
      status: 'completed',
      phase: 'writing',
    });

    // Create chat relation for fork
    if (chatId) {
      try {
        await db.insert(chatRelations).values({
          id: crypto.randomUUID(),
          chatId: newChatId,
          relatedChatId: chatId,
          relationType: 'fork',
          createdAt: now,
        });
      } catch (err) {
        console.error('Failed to create fork relation:', err);
      }
    }

    return Response.json({ chatId: newChatId }, { status: 201 });
  } catch (err) {
    console.error('Error forking thread:', err);
    return Response.json(
      { message: 'An error occurred while forking thread' },
      { status: 500 },
    );
  }
};

function extractText(responseBlocks: any[]): string {
  if (!Array.isArray(responseBlocks)) return '';
  return responseBlocks
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.data)
    .join('\n');
}
