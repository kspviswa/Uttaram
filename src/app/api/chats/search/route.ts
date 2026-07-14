import db from '@/lib/db';
import { chats, messages } from '@/lib/db/schema';
import { eq, or, like, and, desc, isNull, sql } from 'drizzle-orm';

export const GET = async (req: Request) => {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    const projectId = url.searchParams.get('projectId');
    const excludeChatId = url.searchParams.get('excludeChatId');

    const conditions = [];

    if (query.trim()) {
      conditions.push(like(chats.title, `%${query}%`));
    }

    if (projectId) {
      conditions.push(eq(chats.projectId, projectId));
    } else {
      conditions.push(or(isNull(chats.projectId), eq(chats.projectId, '')));
    }

    if (excludeChatId) {
      conditions.push(sql`${chats.id} != ${excludeChatId}`);
    }

    const results = await db
      .select({
        id: chats.id,
        title: chats.title,
        createdAt: chats.createdAt,
        projectId: chats.projectId,
      })
      .from(chats)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(chats.createdAt))
      .limit(20)
      .execute();

    const chatsWithPreview = await Promise.all(
      results.map(async (chat) => {
        const firstMessage = await db.query.messages.findFirst({
          where: eq(messages.chatId, chat.id),
          columns: { query: true },
        });
        return {
          ...chat,
          preview: firstMessage?.query || '',
        };
      }),
    );

    return Response.json({ chats: chatsWithPreview }, { status: 200 });
  } catch (err) {
    console.error('Error searching chats:', err);
    return Response.json(
      { message: 'An error occurred while searching chats' },
      { status: 500 },
    );
  }
};
