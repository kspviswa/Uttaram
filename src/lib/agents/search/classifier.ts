import { ClassifierInput, ClassifierOutput } from './types';
import { classifierPrompt } from '@/lib/prompts/search/classifier';
import formatChatHistoryAsString from '@/lib/utils/formatHistory';
import memoryStore from '@/lib/memory/store';
import { withRetry } from '@/lib/utils/withRetry';

const DEFAULT_OUTPUT: ClassifierOutput = {
  classification: {
    skipSearch: true,
    personalSearch: false,
    academicSearch: false,
    discussionSearch: false,
    showWeatherWidget: false,
    showStockWidget: false,
    showCalculationWidget: false,
  },
  standaloneFollowUp: '',
};

function parseClassifierResponse(raw: string): ClassifierOutput | null {
  try {
    const parsed = JSON.parse(raw);
    const c = parsed.classification || parsed;
    return {
      classification: {
        skipSearch: typeof c.skipSearch === 'boolean' ? c.skipSearch : true,
        personalSearch: typeof c.personalSearch === 'boolean' ? c.personalSearch : false,
        academicSearch: typeof c.academicSearch === 'boolean' ? c.academicSearch : false,
        discussionSearch: typeof c.discussionSearch === 'boolean' ? c.discussionSearch : false,
        showWeatherWidget: typeof c.showWeatherWidget === 'boolean' ? c.showWeatherWidget : false,
        showStockWidget: typeof c.showStockWidget === 'boolean' ? c.showStockWidget : false,
        showCalculationWidget: typeof c.showCalculationWidget === 'boolean' ? c.showCalculationWidget : false,
      },
      standaloneFollowUp: parsed.standaloneFollowUp || c.standaloneFollowUp || '',
    };
  } catch {
    return null;
  }
}

export const classify = async (input: ClassifierInput) => {
  let memoriesContext = '';
  if (input.enableMemories !== false) {
    try {
      if (input.embedding) {
        memoryStore.setEmbeddingModel(input.embedding);
        const relevantMemories = await memoryStore.queryMemories(
          input.query,
          3,
          0.45,
        );
        if (relevantMemories.length > 0) {
          memoriesContext = relevantMemories
            .map((m) => `- ${m.content}`)
            .join('\n');
        }
      }
    } catch {
      // silently ignore memory errors in classifier
    }
  }

  const userProfileString = (() => {
    if (!input.userProfile) return '';
    const parts: string[] = [];
    if (input.userProfile.name) parts.push(`Name: ${input.userProfile.name}`);
    if (input.userProfile.location)
      parts.push(`Location: ${input.userProfile.location}`);
    if (input.userProfile.aboutMe)
      parts.push(`About: ${input.userProfile.aboutMe}`);
    return parts.length > 0 ? `\n<user_profile>\n${parts.join('\n')}\n</user_profile>` : '';
  })();

  const dateTimeContext = input.metadata
    ? `\n<current_date_time>\nCurrent date and time: ${input.metadata.currentDate}\nTimezone: ${input.metadata.timezone}\n</current_date_time>`
    : `\n<current_date_time>\nCurrent date and time: ${new Date().toISOString()}\nTimezone: UTC\n</current_date_time>`;

  const userContent = `<conversation_history>\n${formatChatHistoryAsString(input.chatHistory)}\n</conversation_history>\n<user_query>\n${input.query}\n</user_query>${memoriesContext ? `\n<user_memories>\n${memoriesContext}\n</user_memories>` : ''}${userProfileString}${dateTimeContext}`;

  const llm = input.classificationLlm || input.llm;

  const raw = await withRetry(
    async () => {
      const result = await llm.generateText({
        messages: [
          {
            role: 'system',
            content: classifierPrompt,
          },
          {
            role: 'user',
            content: `${userContent}\n\nRespond with valid JSON only. No markdown, no code fences, no explanation.`,
          },
        ],
        options: { temperature: 0 },
      });
      return result.content;
    },
    {
      timeout: 30000,
      maxRetries: 3,
    },
  );

  const parsed = parseClassifierResponse(raw);
  if (parsed) {
    return parsed;
  }

  // Try to extract JSON from code fences
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const extracted = parseClassifierResponse(jsonMatch[0]);
    if (extracted) return extracted;
  }

  console.warn('[Classifier] Failed to parse LLM response, using defaults:', raw.slice(0, 200));
  return {
    ...DEFAULT_OUTPUT,
    standaloneFollowUp: input.query,
  };
};
