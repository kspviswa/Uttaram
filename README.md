# ऊttaram — Direct Your Curiosity and Personalize it Privately

ऊttaram is a **privacy-focused AI answering engine** forked from [Vane](https://github.com/ItzCrazyKns/Vane). It runs on your own hardware, combines web knowledge with local and cloud LLMs (Ollama, OpenAI, Anthropic, Gemini, Groq, and more), and delivers cited answers — all while keeping your data private.

## What Makes ऊttaram Different?

This fork introduces several features not found in the upstream Vane project:

- **Memories** — Automatically extracts personal facts, preferences, and project info from your conversations. The LLM uses these to personalize answers across sessions. A health-check routine (dedup, merge, paraphrase, recategorize) keeps the memory store clean.
- **Projects** — Organize chats into named groups. Create, rename, and delete projects; move chats between them; start new chats directly inside a project.
- **Context length slider + token tracking** — See exactly how many tokens your conversation uses, set your model's context window, and get visual warnings as you approach the limit. Separate context length controls for chat/vision models and embedding models.
- **Embedding context length + text chunking** — Configure the embedding model's context window (up to 8K). Long texts are automatically split into chunks with 10% overlap and averaged into a single embedding, preventing errors with limited-context embedding models like `text-embedding-embeddinggemma-300m`.
- **Post-answer actions** — Summarize long answers with one click, or fork a thread to continue a sub-topic without losing the original conversation.
- **Image upload with VLM analysis** — Upload images; a Vision Language Model describes them before the main LLM responds, so the model can answer questions about visual content.
- **Pipeline state tracking** — Real-time phase display during research (searching, extracting, writing, etc.) so you always know what the agent is doing.
- **Timeout + automatic retries** — Failed LLM calls and SearXNG requests get up to 3 retries with visible progress. No silent failures.
- **Settings as a dedicated page** — Full-page settings UI instead of a modal, with DB-backed persistence for all preferences (theme, location, name, model selection, etc.).
- **LLM throttle** — Limit the number of concurrent LLM calls from the settings page. Essential when sharing a local model server with other users or avoiding GPU memory exhaustion.
- **Mid-conversation mode switching** — Change between Speed, Balanced, and Quality modes on follow-up messages, not just the first query.
- **@ reference system** — Link chats to related chats using `@` references, creating a web of interconnected conversations.
- **Knowledge graph** — Obsidian-style interactive knowledge graph with hierarchical clustering and LLM-generated topic labels.
- **Chat embeddings + analytics** — Semantic search across your chat history with an analytics dashboard showing embedding status and cluster visualization.
- **MCP server** — Expose search and crawl capabilities as an MCP server via `/api/mcp` for integration with AI assistants and tools.
- **Speed mode** — Answers directly without a template structure for faster responses when you don't need formatted output.
- **Math rendering & PDF export** — KaTeX-rendered math expressions in answers, with DOM-clone PDF export for sharing.
- **Smarter citations** — Copy answers to clipboard with citation HTML tags properly stripped.
- **iOS PWA support** — Installable as a standalone web app on iOS Safari.
- **Chat state reliability** — Loading and navigation states derived from backend message data, so refreshing or navigating between chats always shows the correct state.

## ✨ Features

🤖 **Support for all major AI providers** — Use local LLMs through Ollama/LM Studio or connect to OpenAI, Anthropic Claude, Google Gemini, Groq, and more. Mix and match models.

⚡ **Smart search modes** — Speed, Balanced, or Quality mode depending on how deep you need to go.

🧭 **Pick your sources** — Search the web, discussions, or academic papers.

🧩 **Widgets** — Weather, calculations, stock prices, and other contextual UI cards.

🔍 **Web search powered by SearxNG** — Access multiple search engines privately.

📷 **Image and video search** — Visual content alongside text results.

📄 **File uploads** — Upload PDFs, text files, and images; ask questions about them.

🌐 **Domain-specific search** — Limit searches to specific websites.

💡 **Smart suggestions** — Search suggestions as you type.

📚 **Discover** — Browse trending articles throughout the day.

🕒 **Search history** — All searches saved locally in the library.

## Installation

### Docker (Recommended)

```bash
docker run -d \
  -p 7777:3000 \
  -v $(pwd)/data:/home/uttaram/data \
  --name uttaram \
  kspviswa/uttaram:latest
```

Open http://localhost:7777 and configure your AI provider + SearXNG URL in the setup screen.

### Docker Compose

```yaml
services:
  uttaram:
    image: kspviswa/uttaram
    ports:
      - '7777:3000'
    volumes:
      - ./data:/home/uttaram/data
    restart: unless-stopped
```

### Building from Source

```bash
git clone https://github.com/kspviswa/Uttaram.git
cd Uttaram
npm install
npm run build
npm start
```

## Configuration

On first launch you'll enter the setup wizard:

1. Enter your name and location (used to personalize greetings and timezone-aware responses).
2. Add one or more AI providers (API keys, endpoints).
3. Select your default chat and embedding models.
4. Optionally configure a SearXNG URL for web search.
5. Set context length sliders for chat/vision models and embedding models.

All settings persist in the database and can be changed later under **Settings**.

## Recent Changes

### Embedding & Search
- **Embedding context length slider** — Separate control for embedding model context window (up to 8K). Long texts are automatically chunked with 10% overlap and averaged into a single embedding.
- **Re-embed with progress** — Backfill or re-generate embeddings with a progress bar.
- **MCP server** — Search and crawl capabilities exposed via `/api/mcp` for tool integration.
- **Search performance indicator** — Visual indicator showing whether results came from live web search or cached knowledge.

### Knowledge & Analytics
- **Knowledge graph** — Obsidian-style interactive graph with hierarchical clustering and LLM-generated topic labels.
- **Chat embeddings & analytics** — Semantic search across chat history with cluster visualization and embedding status tracking.
- **@ chat references** — Link chats to related conversations using `@` references.

### Performance
- **Speed mode** — Answers directly without template structure for faster responses.
- **Classifier LLM removed** — Eliminated an extra LLM call per query.
- **LLM label caching** — Cluster topic labels are cached to avoid redundant LLM calls.
- **Memory health check batch size** — Reduced to 10 memories per batch for more reliable processing.

## Using as a Search Engine

Add a custom search engine in your browser pointing to:

```
http://localhost:7777/?q=%s
```

## Why Fork?

ऊttaram started as a fork to address specific needs:

- **Persistent personalization** — The memories feature lets the LLM learn from past conversations, something the upstream didn't have.
- **Better organization** — Projects let you group related chats together.
- **Transparency** — Real-time pipeline state and token usage tracking give you visibility into what the agent is doing.
- **Resilience** — Timeouts, automatic retries, and LLM throttling prevent silent failures and resource exhaustion.
- **Everyday usability** — Image uploads, mid-conversation mode switching, math rendering, PDF export, and citation fixes make it practical for daily use.
- **Knowledge management** — Chat embeddings, hierarchical clustering, and an Obsidian-style knowledge graph help you explore and connect your conversations.
- **Performance** — Removed the classifier LLM call, added LLM label caching, and introduced Speed mode for direct answers without template overhead.
- **Mobile experience** — Full responsive UI with mobile-optimized settings, scrollable tab bars, and properly positioned popovers.
- **Embedding reliability** — Automatic text chunking based on embedding model context length prevents errors with limited-context embedding models.

## License

MIT
