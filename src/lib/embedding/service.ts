import db from '@/lib/db';
import { chats, messages } from '@/lib/db/schema';
import { eq, sql, and, isNull } from 'drizzle-orm';
import ModelRegistry from '@/lib/models/registry';
import { getAllSettings } from '@/lib/config/settings';
import { splitTextForEmbedding } from '@/lib/utils/splitText';

function averageEmbeddings(embeddings: number[][]): number[] | null {
  if (embeddings.length === 0) return null;
  if (embeddings.length === 1) return embeddings[0];
  const dim = embeddings[0].length;
  const avg = new Array(dim).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      avg[i] += emb[i];
    }
  }
  for (let i = 0; i < dim; i++) {
    avg[i] /= embeddings.length;
  }
  return avg;
}

class EmbeddingService {
  private static instance: EmbeddingService | null = null;
  private embeddingModel: any = null;
  private embeddingModelKey: string | null = null;

  private constructor() {}

  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  reset() {
    this.embeddingModel = null;
    this.embeddingModelKey = null;
  }

  async getEmbeddingModel() {
    const settings = await getAllSettings();
    const desiredProviderId = settings.embeddingModelProviderId;
    const desiredModelKey = settings.embeddingModelKey;

    if (
      this.embeddingModel &&
      this.embeddingModelKey === `${desiredProviderId}/${desiredModelKey}`
    ) {
      return this.embeddingModel;
    }

    this.embeddingModel = null;
    this.embeddingModelKey = null;

    const registry = new ModelRegistry();

    if (registry.activeProviders.length === 0) {
      console.warn('[EmbeddingService] No active providers found');
      return null;
    }

    if (desiredProviderId && desiredModelKey) {
      const preferred = registry.activeProviders.find(
        (p) => p.id === desiredProviderId,
      );
      if (preferred) {
        try {
          const models = await preferred.provider.getModelList();
          if (models.embedding.some((m) => m.key === desiredModelKey)) {
            this.embeddingModel = await registry.loadEmbeddingModel(
              preferred.id,
              desiredModelKey,
            );
            this.embeddingModelKey = `${preferred.id}/${desiredModelKey}`;
            console.log(
              `[EmbeddingService] Using embedding model: ${preferred.name} / ${desiredModelKey} (from settings)`,
            );
            return this.embeddingModel;
          }
          console.warn(
            `[EmbeddingService] Saved embedding model ${desiredProviderId}/${desiredModelKey} not found in provider ${preferred.name}, falling back`,
          );
        } catch (err) {
          console.warn(
            `[EmbeddingService] Saved provider ${preferred.name} has no usable embedding model:`,
            err,
          );
        }
      } else {
        console.warn(
          `[EmbeddingService] Saved embedding provider ${desiredProviderId} not found, falling back`,
        );
      }
    }

    for (const p of registry.activeProviders) {
      try {
        const models = await p.provider.getModelList();
        if (models.embedding.length > 0) {
          this.embeddingModel = await registry.loadEmbeddingModel(
            p.id,
            models.embedding[0].key,
          );
          this.embeddingModelKey = `${p.id}/${models.embedding[0].key}`;
          console.log(
            `[EmbeddingService] Using embedding model: ${p.name} / ${models.embedding[0].key} (fallback)`,
          );
          return this.embeddingModel;
        }
      } catch (err) {
        console.warn(
          `[EmbeddingService] Provider ${p.name} has no usable embedding model:`,
          err,
        );
      }
    }

    return null;
  }

  async embedText(texts: string[]): Promise<number[][]> {
    const model = await this.getEmbeddingModel();
    if (!model) {
      console.warn('[EmbeddingService] No embedding model available');
      return [];
    }

    if (texts.length === 0) {
      return [];
    }

    const settings = await getAllSettings();
    const embeddingContextLength = parseInt(
      settings.embeddingContextLength || '2048',
      10,
    );

    const allChunkedTexts: string[][] = [];
    const flatTexts: string[] = [];
    const textToChunkIndex: number[] = [];

    for (let i = 0; i < texts.length; i++) {
      const chunks = splitTextForEmbedding(
        texts[i],
        embeddingContextLength,
        0.1,
      );
      allChunkedTexts.push(chunks);
      for (const chunk of chunks) {
        textToChunkIndex.push(i);
        flatTexts.push(chunk);
      }
    }

    if (flatTexts.length === 0) {
      return texts.map(() => []);
    }

    const chunkEmbeddings = await model.embedText(flatTexts);

    const result: number[][] = Array.from({ length: texts.length }, () => []);
    for (let i = 0; i < flatTexts.length; i++) {
      const originalIndex = textToChunkIndex[i];
      result[originalIndex].push(chunkEmbeddings[i]);
    }

    return result.map((embeddings) => {
      if (!embeddings || embeddings.length === 0) return [];
      return averageEmbeddings(embeddings) ?? embeddings[0];
    });
  }

  async embedChat(chatId: string): Promise<boolean> {
    const model = await this.getEmbeddingModel();
    if (!model) return false;

    const chat = await db.query.chats.findFirst({
      where: eq(chats.id, chatId),
    });

    if (!chat || chat.embedding) return true;

    try {
      const [embedding] = await this.embedText([chat.title]);
      await db
        .update(chats)
        .set({ embedding: JSON.stringify(embedding) })
        .where(eq(chats.id, chatId));
      return true;
    } catch (err) {
      console.error(`[EmbeddingService] Failed to embed chat ${chatId}:`, err);
      return false;
    }
  }

  async embedMessage(messageId: string): Promise<boolean> {
    const model = await this.getEmbeddingModel();
    if (!model) return false;

    const message = await db.query.messages.findFirst({
      where: eq(messages.messageId, messageId),
    });

    if (!message || message.embedding) return true;

    try {
      const [embedding] = await this.embedText([message.query]);
      await db
        .update(messages)
        .set({ embedding: JSON.stringify(embedding) })
        .where(eq(messages.messageId, messageId));
      return true;
    } catch (err) {
      console.error(
        `[EmbeddingService] Failed to embed message ${messageId}:`,
        err,
      );
      return false;
    }
  }

  async backfillChats(): Promise<{ embedded: number; skipped: number; errors: number }> {
    const model = await this.getEmbeddingModel();
    if (!model) {
      console.warn('[EmbeddingService] No embedding model available for backfill');
      return { embedded: 0, skipped: 0, errors: 0 };
    }

    const unembeddedChats = await db
      .select()
      .from(chats)
      .where(sql`${chats.embedding} IS NULL`)
      .all();

    let embedded = 0;
    let errors = 0;

    for (const chat of unembeddedChats) {
      try {
        const [embedding] = await this.embedText([chat.title]);
        await db
          .update(chats)
          .set({ embedding: JSON.stringify(embedding) })
          .where(eq(chats.id, chat.id));
        embedded++;
      } catch (err) {
        console.error(`[EmbeddingService] Failed to embed chat ${chat.id}:`, err);
        errors++;
      }
    }

    return { embedded, skipped: 0, errors };
  }

  async backfillMessages(): Promise<{ embedded: number; skipped: number; errors: number }> {
    const model = await this.getEmbeddingModel();
    if (!model) {
      console.warn('[EmbeddingService] No embedding model available for backfill');
      return { embedded: 0, skipped: 0, errors: 0 };
    }

    const unembeddedMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          sql`${messages.embedding} IS NULL`,
          sql`${messages.query} IS NOT NULL`,
          sql`${messages.query} != ''`,
        ),
      )
      .all();

    let embedded = 0;
    let errors = 0;

    for (const message of unembeddedMessages) {
      try {
        const [embedding] = await this.embedText([message.query]);
        await db
          .update(messages)
          .set({ embedding: JSON.stringify(embedding) })
          .where(eq(messages.messageId, message.messageId));
        embedded++;
      } catch (err) {
        console.error(
          `[EmbeddingService] Failed to embed message ${message.messageId}:`,
          err,
        );
        errors++;
      }
    }

    return { embedded, skipped: 0, errors };
  }

  async backfillAll(): Promise<{
    chats: { embedded: number; errors: number };
    messages: { embedded: number; errors: number };
  }> {
    const chatResult = await this.backfillChats();
    const messageResult = await this.backfillMessages();

    return {
      chats: { embedded: chatResult.embedded, errors: chatResult.errors },
      messages: { embedded: messageResult.embedded, errors: messageResult.errors },
    };
  }

  async reEmbedChats(
    onProgress?: (done: number, total: number) => void,
  ): Promise<{ embedded: number; errors: number }> {
    const model = await this.getEmbeddingModel();
    if (!model) {
      console.warn('[EmbeddingService] No embedding model available for re-embed');
      return { embedded: 0, errors: 0 };
    }

    // Clear all existing chat embeddings
    await db.update(chats).set({ embedding: null });

    // Fetch all chats (now all have NULL embeddings)
    const allChats = await db.select().from(chats).all();

    let embedded = 0;
    let errors = 0;

    for (let i = 0; i < allChats.length; i++) {
      const chat = allChats[i];
      try {
        const [embedding] = await this.embedText([chat.title]);
        await db
          .update(chats)
          .set({ embedding: JSON.stringify(embedding) })
          .where(eq(chats.id, chat.id));
        embedded++;
      } catch (err) {
        console.error(`[EmbeddingService] Failed to re-embed chat ${chat.id}:`, err);
        errors++;
      }
      onProgress?.(i + 1, allChats.length);
    }

    return { embedded, errors };
  }

  async reEmbedMessages(
    onProgress?: (done: number, total: number) => void,
  ): Promise<{ embedded: number; errors: number }> {
    const model = await this.getEmbeddingModel();
    if (!model) {
      console.warn('[EmbeddingService] No embedding model available for re-embed');
      return { embedded: 0, errors: 0 };
    }

    // Clear all existing message embeddings
    await db.update(messages).set({ embedding: null });

    // Fetch all messages with non-empty query
    const allMessages = await db
      .select()
      .from(messages)
      .where(and(sql`${messages.query} IS NOT NULL`, sql`${messages.query} != ''`))
      .all();

    let embedded = 0;
    let errors = 0;

    for (let i = 0; i < allMessages.length; i++) {
      const message = allMessages[i];
      try {
        const [embedding] = await this.embedText([message.query]);
        await db
          .update(messages)
          .set({ embedding: JSON.stringify(embedding) })
          .where(eq(messages.messageId, message.messageId));
        embedded++;
      } catch (err) {
        console.error(
          `[EmbeddingService] Failed to re-embed message ${message.messageId}:`,
          err,
        );
        errors++;
      }
      onProgress?.(i + 1, allMessages.length);
    }

    return { embedded, errors };
  }

  async reEmbedAll(
    onProgress?: (phase: 'chats' | 'messages', done: number, total: number) => void,
  ): Promise<{
    chats: { embedded: number; errors: number };
    messages: { embedded: number; errors: number };
  }> {
    const chatResult = await this.reEmbedChats((done, total) =>
      onProgress?.('chats', done, total),
    );
    const messageResult = await this.reEmbedMessages((done, total) =>
      onProgress?.('messages', done, total),
    );

    return {
      chats: { embedded: chatResult.embedded, errors: chatResult.errors },
      messages: { embedded: messageResult.embedded, errors: messageResult.errors },
    };
  }
}

const embeddingService = EmbeddingService.getInstance();
export default embeddingService;