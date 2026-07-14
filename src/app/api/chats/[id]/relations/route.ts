import db from '@/lib/db';
import { chatRelations, chats } from '@/lib/db/schema';
import { eq, or, and } from 'drizzle-orm';

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const direction = url.searchParams.get('direction') || 'both';

    let relations;

    if (direction === 'children') {
      relations = await db
        .select({
          id: chatRelations.id,
          chatId: chatRelations.chatId,
          relatedChatId: chatRelations.relatedChatId,
          relationType: chatRelations.relationType,
          createdAt: chatRelations.createdAt,
        })
        .from(chatRelations)
        .where(eq(chatRelations.relatedChatId, id))
        .execute();
    } else if (direction === 'parents') {
      relations = await db
        .select({
          id: chatRelations.id,
          chatId: chatRelations.chatId,
          relatedChatId: chatRelations.relatedChatId,
          relationType: chatRelations.relationType,
          createdAt: chatRelations.createdAt,
        })
        .from(chatRelations)
        .where(eq(chatRelations.chatId, id))
        .execute();
    } else {
      relations = await db
        .select({
          id: chatRelations.id,
          chatId: chatRelations.chatId,
          relatedChatId: chatRelations.relatedChatId,
          relationType: chatRelations.relationType,
          createdAt: chatRelations.createdAt,
        })
        .from(chatRelations)
        .where(
          or(
            eq(chatRelations.chatId, id),
            eq(chatRelations.relatedChatId, id),
          ),
        )
        .execute();
    }

    const enrichedRelations = await Promise.all(
      relations.map(async (rel) => {
        const childChat = await db.query.chats.findFirst({
          where: eq(chats.id, rel.chatId),
          columns: { id: true, title: true },
        });
        const parentChat = await db.query.chats.findFirst({
          where: eq(chats.id, rel.relatedChatId),
          columns: { id: true, title: true },
        });
        return {
          ...rel,
          childChat,
          parentChat,
        };
      }),
    );

    return Response.json({ relations: enrichedRelations }, { status: 200 });
  } catch (err) {
    console.error('Error getting chat relations:', err);
    return Response.json(
      { message: 'An error occurred while getting chat relations' },
      { status: 500 },
    );
  }
};
