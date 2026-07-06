import db from '@/lib/db';
import { chats } from '@/lib/db/schema';

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const { title, projectId } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return Response.json({ message: 'Chat title is required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(chats).values({
      id,
      title: title.trim(),
      createdAt: now,
      sources: [],
      files: [],
      projectId: projectId || null,
    });

    return Response.json({ chat: { id, title: title.trim(), createdAt: now, projectId: projectId || null } }, { status: 201 });
  } catch (err) {
    console.error('Error creating chat:', err);
    return Response.json({ message: 'An error occurred' }, { status: 500 });
  }
};

export const GET = async (req: Request) => {
  try {
    let chats = await db.query.chats.findMany();
    chats = chats.reverse();
    return Response.json({ chats: chats }, { status: 200 });
  } catch (err) {
    console.error('Error in getting chats: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};
