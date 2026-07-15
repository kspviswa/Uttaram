import { z } from 'zod';
import ModelRegistry from '@/lib/models/registry';
import { ModelWithProvider } from '@/lib/models/types';
import SearchAgent from '@/lib/agents/search';
import SessionManager from '@/lib/session';
import { ChatTurnMessage } from '@/lib/types';
import { SearchSources } from '@/lib/agents/search/types';
import db from '@/lib/db';
import { eq } from 'drizzle-orm';
import { chats, messages, chatRelations } from '@/lib/db/schema';
import UploadManager from '@/lib/uploads/manager';
import { extractMemories } from '@/lib/memory/extractor';
import { analyzeImagesWithVLM } from '@/lib/vision/analyze';
import path from 'path';
import configManager from '@/lib/config';
import { getAllSettings } from '@/lib/config/settings';
import ThrottledLLM from '@/lib/models/throttledLLM';
import { globalLlmSemaphore } from '@/lib/models/throttle';
import { withRetry } from '@/lib/utils/withRetry';
import embeddingService from '@/lib/embedding/service';

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);

function isImageFile(fileId: string): boolean {
  const file = UploadManager.getFile(fileId);
  if (!file) return false;
  const ext = path.extname(file.filePath).toLowerCase();
  return IMAGE_EXTS.has(ext);
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const messageSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  chatId: z.string().min(1, 'Chat ID is required'),
  content: z.string().min(1, 'Message content is required'),
});

const chatModelSchema: z.ZodType<ModelWithProvider> = z.object({
  providerId: z.string({ message: 'Chat model provider id must be provided' }),
  key: z.string({ message: 'Chat model key must be provided' }),
});

const embeddingModelSchema: z.ZodType<ModelWithProvider> = z.object({
  providerId: z.string({
    message: 'Embedding model provider id must be provided',
  }),
  key: z.string({ message: 'Embedding model key must be provided' }),
});

const visionModelSchema: z.ZodType<ModelWithProvider | null> = z
  .object({
    providerId: z.string(),
    key: z.string(),
  })
  .nullable()
  .optional()
  .default(null);

const bodySchema = z.object({
  message: messageSchema,
  optimizationMode: z.enum(['speed', 'balanced', 'quality'], {
    message: 'Optimization mode must be one of: speed, balanced, quality',
  }),
  sources: z.array(z.string()).optional().default([]),
  history: z
    .array(z.tuple([z.string(), z.string()]))
    .optional()
    .default([]),
  files: z.array(z.string()).optional().default([]),
  projectId: z.string().nullable().optional().default(null),
  chatModel: chatModelSchema,
  embeddingModel: embeddingModelSchema,
  visionModel: visionModelSchema,
  systemInstructions: z.string().nullable().optional().default(''),
  userProfile: z
    .object({
      name: z.string().optional().default(''),
      location: z.string().optional().default(''),
      aboutMe: z.string().optional().default(''),
    })
    .optional()
    .default({ name: '', location: '', aboutMe: '' }),
  enableMemories: z.boolean().optional().default(true),
  metadata: z
    .object({
      currentDate: z.string(),
      timezone: z.string(),
    })
    .optional(),
  referenceChatId: z.string().nullable().optional().default(null),
});

type Body = z.infer<typeof bodySchema>;

const safeValidateBody = (data: unknown) => {
  const result = bodySchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues.map((e: any) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    };
  }

  return {
    success: true,
    data: result.data,
  };
};

const extractTextFromBlocks = (responseBlocks: any[]): string => {
  if (!Array.isArray(responseBlocks)) return '';
  return responseBlocks
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.data)
    .join('\n');
};

const fetchAndSummarizeReference = async (
  referenceChatId: string,
  userQuestion: string,
  llm: any,
  searchConfig: any,
): Promise<string | null> => {
  try {
    const refChat = await db.query.chats.findFirst({
      where: eq(chats.id, referenceChatId),
    });
    if (!refChat) return null;

    const refMessages = await db.query.messages.findMany({
      where: eq(messages.chatId, referenceChatId),
    });
    if (refMessages.length === 0) return null;

    const conversationText = refMessages
      .map((msg) => {
        const assistantText = extractTextFromBlocks(msg.responseBlocks || []);
        return `User: ${msg.query}\nAssistant: ${assistantText}`;
      })
      .join('\n\n');

    const result = await withRetry(
      () => llm.generateText({
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting relevant context from previous conversations. The user is now asking a new question. Summarize the key points from the referenced conversation that are relevant to the user's current question. Be concise and focused on what's useful for answering their new question. If the referenced conversation is not relevant, provide a brief note that it was referenced but may not be directly related.`,
          },
          {
            role: 'user',
            content: `## Referenced Conversation (titled: "${refChat.title}")\n\n${conversationText}\n\n---\n\n## User's New Question\n\n${userQuestion}\n\n---\n\nProvide a concise summary of the relevant context from the referenced conversation that will help answer the user's new question.`,
          },
        ],
      }),
      {
        timeout: searchConfig.llmTimeout || 60000,
        maxRetries: searchConfig.llmMaxRetries || 3,
      },
    );

    return `## Context from Referenced Chat: "${refChat.title}"\n\n${(result as any).content}\n\n---\n\n`;
  } catch (err) {
    console.error('Error fetching/summarizing reference:', err);
    return null;
  }
};

const ensureChatExists = async (input: {
  id: string;
  sources: SearchSources[];
  query: string;
  fileIds: string[];
  projectId?: string | null;
}) => {
  try {
    const exists = await db.query.chats
      .findFirst({
        where: eq(chats.id, input.id),
      })
      .execute();

    if (!exists) {
      await db.insert(chats).values({
        id: input.id,
        createdAt: new Date().toISOString(),
        sources: input.sources,
        title: input.query,
        files: input.fileIds.map((id) => {
          return {
            fileId: id,
            name: UploadManager.getFile(id)?.name || 'Uploaded File',
          };
        }),
        projectId: input.projectId || null,
      });

      // Embed chat title asynchronously
      embeddingService.embedChat(input.id).catch((err) => {
        console.error('[ChatAPI] Failed to embed chat:', err);
      });
    } else {
      const existingFileIds = new Set(
        (exists.files as Array<{ fileId: string; name: string }> | null)?.map(
          (f) => f.fileId,
        ) ?? [],
      );
      const newFiles = input.fileIds
        .filter((id) => !existingFileIds.has(id))
        .map((id) => ({
          fileId: id,
          name: UploadManager.getFile(id)?.name || 'Uploaded File',
        }));
      const updateData: Record<string, any> = {};
      if (exists.title === 'New Chat') {
        updateData.title = input.query;
      }
      if (newFiles.length > 0) {
        updateData.files = [
          ...(exists.files as Array<{ fileId: string; name: string }> | null ??
            []),
          ...newFiles,
        ];
      }
      if (Object.keys(updateData).length > 0) {
        await db
          .update(chats)
          .set(updateData)
          .where(eq(chats.id, input.id))
          .execute();
      }
    }
  } catch (err) {
    console.error('Failed to check/save chat:', err);
  }
};

export const POST = async (req: Request) => {
  try {
    const reqBody = (await req.json()) as Body;

    const parseBody = safeValidateBody(reqBody);

    if (!parseBody.success) {
      return Response.json(
        { message: 'Invalid request body', error: parseBody.error },
        { status: 400 },
      );
    }

    const body = parseBody.data as Body;
    const { message } = body;

    if (message.content === '') {
      return Response.json(
        {
          message: 'Please provide a message to process',
        },
        { status: 400 },
      );
    }

    const registry = new ModelRegistry();

    const [llm, embedding] = await Promise.all([
      registry.loadChatModel(body.chatModel.providerId, body.chatModel.key),
      registry.loadEmbeddingModel(
        body.embeddingModel.providerId,
        body.embeddingModel.key,
      ),
    ]);

    const llmSettings = await getAllSettings();
    let mainLlm = llm;
    if (llmSettings.throttleEnabled) {
      globalLlmSemaphore.setMax(llmSettings.maxParallelLlmCalls);
      mainLlm = new ThrottledLLM(llm);
    }

    const history: ChatTurnMessage[] = body.history.map((msg) => {
      if (msg[0] === 'human') {
        return {
          role: 'user',
          content: msg[1],
        };
      } else {
        return {
          role: 'assistant',
          content: msg[1],
        };
      }
    });

    let followUpContent = message.content;

    const searchConfig = configManager.getCurrentConfig().search;

    // Handle @ reference context injection
    if (body.referenceChatId && body.history.length === 0) {
      const referenceContext = await fetchAndSummarizeReference(
        body.referenceChatId,
        message.content,
        mainLlm,
        searchConfig,
      );
      if (referenceContext) {
        followUpContent = `${referenceContext}\n\n## User's Question\n\n${message.content}`;
      }
    }

    const imageFileIds = body.files.filter((fid) => isImageFile(fid));

    if (imageFileIds.length > 0) {
      try {
        const visionModelInfo = body.visionModel;
        let vllm;
        if (visionModelInfo && visionModelInfo.providerId && visionModelInfo.key) {
          vllm = await registry.loadChatModel(visionModelInfo.providerId, visionModelInfo.key);
          if (llmSettings.throttleEnabled) {
            vllm = new ThrottledLLM(vllm);
          }
        } else {
          vllm = mainLlm;
        }
        const vlmAnalysis = await analyzeImagesWithVLM(
          vllm,
          imageFileIds,
          message.content,
        );
        if (vlmAnalysis) {
          followUpContent = `[Image Analysis from VLM]\n${vlmAnalysis}\n\nUser's original question: ${message.content}`;
        }
      } catch (err) {
        console.error('VLM analysis failed, continuing without it:', err);
      }
    }

    const agent = new SearchAgent();
    const session = SessionManager.createSession();

    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    const disconnect = session.subscribe((event: string, data: any) => {
      if (event === 'data') {
        if (data.type === 'block') {
          writer.write(
            encoder.encode(
              JSON.stringify({
                type: 'block',
                block: data.block,
              }) + '\n',
            ),
          );
        } else if (data.type === 'updateBlock') {
          writer.write(
            encoder.encode(
              JSON.stringify({
                type: 'updateBlock',
                blockId: data.blockId,
                patch: data.patch,
              }) + '\n',
            ),
          );
        } else if (data.type === 'researchComplete') {
          writer.write(
            encoder.encode(
              JSON.stringify({
                type: 'researchComplete',
              }) + '\n',
            ),
          );
        } else if (data.type === 'phase') {
          writer.write(
            encoder.encode(
              JSON.stringify({
                type: 'phase',
                phase: data.phase,
              }) + '\n',
            ),
          );
        } else if (data.type === 'searchPerformed') {
          writer.write(
            encoder.encode(
              JSON.stringify({
                type: 'searchPerformed',
                searchPerformed: data.searchPerformed,
              }) + '\n',
            ),
          );
        }
      } else if (event === 'end') {
        writer.write(
          encoder.encode(
            JSON.stringify({
              type: 'messageEnd',
            }) + '\n',
          ),
        );

        const cleanup = () => {
          writer.close();
          session.removeAllListeners();
        };

        if (body.enableMemories !== false) {
          extractMemories()
            .catch((err) =>
              console.error('[Chat] Async memory extraction failed:', err),
            )
            .finally(cleanup);
        } else {
          cleanup();
        }
      } else if (event === 'error') {
        writer.write(
          encoder.encode(
            JSON.stringify({
              type: 'error',
              data: data.data,
            }) + '\n',
          ),
        );
        writer.close();
        session.removeAllListeners();
      }
    });

    agent.searchAsync(session, {
      chatHistory: history,
      followUp: followUpContent,
      originalQuery: message.content,
      chatId: body.message.chatId,
      messageId: body.message.messageId,
      config: {
        llm: mainLlm,
        embedding: embedding,
        sources: body.sources as SearchSources[],
        mode: body.optimizationMode,
        fileIds: body.files,
        systemInstructions: body.systemInstructions || 'None',
        userProfile: body.userProfile || { name: '', location: '', aboutMe: '' },
        enableMemories: body.enableMemories,
        metadata: body.metadata,
        llmTimeout: searchConfig.llmTimeout || 60000,
        llmMaxRetries: searchConfig.llmMaxRetries || 3,
      },
    });

    ensureChatExists({
      id: body.message.chatId,
      sources: body.sources as SearchSources[],
      fileIds: body.files,
      query: message.content,
      projectId: body.projectId,
    });

    // Create chat relation if reference was used
    if (body.referenceChatId && body.history.length === 0) {
      try {
        await db.insert(chatRelations).values({
          id: crypto.randomUUID(),
          chatId: body.message.chatId,
          relatedChatId: body.referenceChatId,
          relationType: 'reference',
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to create chat relation:', err);
      }
    }

    req.signal.addEventListener('abort', () => {
      disconnect();
      writer.close();
    });

    return new Response(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (err) {
    console.error('An error occurred while processing chat request:', err);
    return Response.json(
      { message: 'An error occurred while processing chat request' },
      { status: 500 },
    );
  }
};
