import db from '@/lib/db';
import { messages } from '@/lib/db/schema';

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const { chatId, messageId, backendId, query, responseBlocks } = body;

    if (!chatId || !messageId || !query) {
      return Response.json(
        { message: 'chatId, messageId, and query are required' },
        { status: 400 },
      );
    }

    await db.insert(messages).values({
      chatId,
      messageId,
      backendId: backendId || crypto.randomUUID(),
      query,
      createdAt: new Date().toISOString(),
      responseBlocks: responseBlocks || [],
      status: 'completed',
      phase: 'writing',
    });

    return Response.json({ message: 'Message saved' }, { status: 201 });
  } catch (err) {
    console.error('Error saving message:', err);
    return Response.json(
      { message: 'An error occurred while saving message' },
      { status: 500 },
    );
  }
};
