import { ResearcherOutput, SearchAgentInput } from './types';
import SessionManager from '@/lib/session';
import Researcher from './researcher';
import { getWriterPrompt } from '@/lib/prompts/search/writer';
import { WidgetExecutor } from './widgets';
import { withRetryStream } from '@/lib/utils/withRetry';

class APISearchAgent {
  async searchAsync(session: SessionManager, input: SearchAgentInput) {
    const searchAttempted = input.config.sources.length > 0;
    session.emit('data', { type: 'searchPerformed', searchPerformed: searchAttempted });

    const widgetPromise = WidgetExecutor.executeAll({
      chatHistory: input.chatHistory,
      followUp: input.followUp,
      llm: input.config.llm,
    }).catch((err) => {
      console.error(`Error executing widgets: ${err}`);
      return [];
    });

    let searchPromise: Promise<ResearcherOutput> | null = null;

    if (searchAttempted) {
      const researcher = new Researcher();
      searchPromise = researcher.research(SessionManager.createSession(), {
        chatHistory: input.chatHistory,
        followUp: input.followUp,
        config: input.config,
      });
    }

    const [widgetOutputs, searchResults] = await Promise.all([
      widgetPromise,
      searchPromise,
    ]);

    if (searchResults) {
      session.emit('data', {
        type: 'searchResults',
        data: searchResults.searchFindings,
      });
    }

    session.emit('data', {
      type: 'researchComplete',
    });

    const finalContext =
      searchResults?.searchFindings
        .map(
          (f, index) =>
            `<result index=${index + 1} title="${f.metadata.title}" url="${f.metadata.url}">${f.content}</result>`,
        )
        .join('\n') || '';

    const widgetContext = widgetOutputs
      .map((o) => {
        return `<result>${o.llmContext}</result>`;
      })
      .join('\n-------------\n');

    const finalContextWithWidgets = `<search_results note="These are the search results and assistant can cite these">\n${finalContext}\n</search_results>\n<widgets_result noteForAssistant="Its output is already showed to the user, assistant can use this information to answer the query but do not CITE this as a souce">\n${widgetContext}\n</widgets_result>`;

    const userProfileContext = input.config.userProfile
      ? (() => {
          const parts: string[] = [];
          if (input.config.userProfile.name) parts.push(`Name: ${input.config.userProfile.name}`);
          if (input.config.userProfile.location) parts.push(`Location: ${input.config.userProfile.location}`);
          if (input.config.userProfile.aboutMe) parts.push(`About: ${input.config.userProfile.aboutMe}`);
          return parts.join('\n');
        })()
      : '';

    const writerPrompt = getWriterPrompt(
      finalContextWithWidgets,
      input.config.systemInstructions,
      input.config.mode,
      undefined,
      userProfileContext,
      undefined,
      undefined,
      true,
    );

    const answerStream = await withRetryStream(
      (signal) => input.config.llm.streamText({
        messages: [
          {
            role: 'system',
            content: writerPrompt,
          },
          ...input.chatHistory,
          {
            role: 'user',
            content: input.followUp,
          },
        ],
      }),
      {
        timeout: input.config.llmTimeout || 60000,
        maxRetries: input.config.llmMaxRetries || 3,
      },
    );

    for await (const chunk of answerStream) {
      session.emit('data', {
        type: 'response',
        data: chunk.contentChunk,
      });
    }

    session.emit('end', {});
  }
}

export default APISearchAgent;
