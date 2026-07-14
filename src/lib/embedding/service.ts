import db from '@/lib/db';
import { chats, messages } from '@/lib/db/schema';
import { eq, sql, and, isNull } from 'drizzle-orm';
import ModelRegistry from '@/lib/models/registry';
import { getAllSettings } from '@/lib/config/settings';

class EmbeddingService {
  private static instance: EmbeddingService | null = null;
  private embeddingModel: any = null;

  private constructor() {}

  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  async getEmbeddingModel() {
    if (this.embeddingModel) return this.embeddingModel;

    const settings = await getAllSettings();
    const registry = new ModelRegistry();

    if (registry.activeProviders.length === 0) {
      console.warn('[EmbeddingService] No active providers found');
      return null;
    }

    for (const p of registry.activeProviders) {
      try {
        const models = await p.provider.getModelList();
        if (models.embedding.length > 0) {
          this.embeddingModel = await registry.loadEmbeddingModel(
            p.id,
            models.embedding[0].key,
          );
          console.log(
            `[EmbeddingService] Using embedding model: ${p.name} / ${models.embedding[0].key}`,
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
    return model.embedText(texts);
  }

  async embedChat(chatId: string): Promise<boolean> {
    const model = await this.getEmbeddingModel();
    if (!model) return false;

    const chat = await db.query.chats.findFirst({
      where: eq(chats.id, chatId),
    });

    if (!chat || chat.embedding) return true;

    try {
      const [embedding] = await model.embedText([chat.title]);
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
      const [embedding] = await model.embedText([message.query]);
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
        const [embedding] = await model.embedText([chat.title]);
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
        const [embedding] = await model.embedText([message.query]);
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
}

const embeddingService = EmbeddingService.getInstance();
export default embeddingService;