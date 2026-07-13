import searchImages from '@/lib/agents/media/image';
import ModelRegistry from '@/lib/models/registry';
import { ModelWithProvider } from '@/lib/models/types';
import { getAllSettings } from '@/lib/config/settings';
import ThrottledLLM from '@/lib/models/throttledLLM';
import { globalLlmSemaphore } from '@/lib/models/throttle';

interface ImageSearchBody {
  query: string;
  chatHistory: any[];
  chatModel: ModelWithProvider;
}

export const POST = async (req: Request) => {
  try {
    const body: ImageSearchBody = await req.json();

    const registry = new ModelRegistry();

    const llm = await registry.loadChatModel(
      body.chatModel.providerId,
      body.chatModel.key,
    );

    const settings = await getAllSettings();
    let mainLlm = llm;
    if (settings.throttleEnabled) {
      globalLlmSemaphore.setMax(settings.maxParallelLlmCalls);
      mainLlm = new ThrottledLLM(llm);
    }

    const images = await searchImages(
      {
        chatHistory: body.chatHistory.map(([role, content]) => ({
          role: role === 'human' ? 'user' : 'assistant',
          content,
        })),
        query: body.query,
      },
      mainLlm,
    );

    return Response.json({ images }, { status: 200 });
  } catch (err) {
    console.error(`An error occurred while searching images: ${err}`);
    return Response.json(
      { message: 'An error occurred while searching images' },
      { status: 500 },
    );
  }
};
