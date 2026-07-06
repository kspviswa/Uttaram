import db from '@/lib/db';
import { projects, chats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const PATCH = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description } = body;

    const existing = await db.query.projects.findFirst({
      where: eq(projects.id, id),
    });

    if (!existing) {
      return Response.json({ message: 'Project not found' }, { status: 404 });
    }

    await db
      .update(projects)
      .set({
        name: name?.trim() || existing.name,
        description: description?.trim() ?? existing.description,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(projects.id, id))
      .execute();

    const updated = await db.query.projects.findFirst({
      where: eq(projects.id, id),
    });

    return Response.json({ project: updated }, { status: 200 });
  } catch (err) {
    console.error('Error updating project:', err);
    return Response.json({ message: 'An error occurred' }, { status: 500 });
  }
};

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;

    const existing = await db.query.projects.findFirst({
      where: eq(projects.id, id),
    });

    if (!existing) {
      return Response.json({ message: 'Project not found' }, { status: 404 });
    }

    await db
      .update(chats)
      .set({ projectId: null })
      .where(eq(chats.projectId, id))
      .execute();

    await db.delete(projects).where(eq(projects.id, id)).execute();

    return Response.json({ message: 'Project deleted' }, { status: 200 });
  } catch (err) {
    console.error('Error deleting project:', err);
    return Response.json({ message: 'An error occurred' }, { status: 500 });
  }
};
