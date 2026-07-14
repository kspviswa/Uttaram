import { NextResponse } from 'next/server';
import embeddingService from '@/lib/embedding/service';

export async function POST() {
  try {
    console.log('[API] Starting embedding backfill...');
    const result = await embeddingService.backfillAll();
    console.log('[API] Backfill complete:', result);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[API] Backfill failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const db = (await import('@/lib/db')).default;
    const { chats, messages } = await import('@/lib/db/schema');
    const { sql } = await import('drizzle-orm');

    const chatStats = await db
      .select({
        total: sql<number>`count(*)`,
        embedded: sql<number>`count(CASE WHEN ${chats.embedding} IS NOT NULL THEN 1 END)`,
      })
      .from(chats);

    const messageStats = await db
      .select({
        total: sql<number>`count(*)`,
        embedded: sql<number>`count(CASE WHEN ${messages.embedding} IS NOT NULL THEN 1 END)`,
      })
      .from(messages);

    return NextResponse.json({
      success: true,
      data: {
        chats: {
          total: chatStats[0]?.total ?? 0,
          embedded: chatStats[0]?.embedded ?? 0,
          pending: (chatStats[0]?.total ?? 0) - (chatStats[0]?.embedded ?? 0),
        },
        messages: {
          total: messageStats[0]?.total ?? 0,
          embedded: messageStats[0]?.embedded ?? 0,
          pending: (messageStats[0]?.total ?? 0) - (messageStats[0]?.embedded ?? 0),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}