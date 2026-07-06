import db from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = async () => {
  try {
    const allProjects = await db.query.projects.findMany({
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
    });
    return Response.json({ projects: allProjects }, { status: 200 });
  } catch (err) {
    console.error('Error fetching projects:', err);
    return Response.json({ message: 'An error occurred' }, { status: 500 });
  }
};

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return Response.json({ message: 'Project name is required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(projects).values({
      id,
      name: name.trim(),
      description: description?.trim() || '',
      createdAt: now,
      updatedAt: now,
    });

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, id),
    });

    return Response.json({ project }, { status: 201 });
  } catch (err) {
    console.error('Error creating project:', err);
    return Response.json({ message: 'An error occurred' }, { status: 500 });
  }
};
