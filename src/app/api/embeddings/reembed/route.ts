import embeddingService from '@/lib/embedding/service';

export async function POST() {
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const send = (event: string, data: unknown) => {
    writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
  };

  (async () => {
    try {
      const result = await embeddingService.reEmbedAll((phase, done, total) => {
        send('progress', { phase, done, total });
      });
      send('complete', result);
    } catch (err) {
      send('error', { message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
