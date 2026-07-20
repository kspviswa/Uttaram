import { NextRequest, NextResponse } from 'next/server';
import { getAllSettings, updateSettings } from '@/lib/config/settings';
import embeddingService from '@/lib/embedding/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getAllSettings();
    return NextResponse.json({ data });
  } catch (err) {
    console.error('[Settings] Failed to read settings:', err);
    return NextResponse.json({ error: 'Failed to read settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const previous = await getAllSettings();
    const data = await updateSettings(body);

    if (
      previous.embeddingModelProviderId !== data.embeddingModelProviderId ||
      previous.embeddingModelKey !== data.embeddingModelKey
    ) {
      embeddingService.reset();
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[Settings] Failed to update settings:', err);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
