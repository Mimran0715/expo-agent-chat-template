Expo Agent Chat Template is a configurable mobile AI chat starter built with Expo Router and LangChain. Chat responses stream from a server route, keeping model credentials out of the client bundle.

## Run with local Ollama

1. Install and start Ollama, then pull the model configured in `.env`:

   ```bash
   ollama pull llama3.2
   ```

2. Copy `.env.example` to `.env` if needed and adjust `MODEL_NAME`, `OLLAMA_BASE_URL`, or the shared generation settings.
3. Start the app with `npm start`. Expo Router serves `/api/chat` during development, and that server route connects to Ollama.

On a physical device, Ollama still runs on the development computer: the Expo API route is the bridge, so `OLLAMA_BASE_URL=http://127.0.0.1:11434` remains server-local.

## Change model providers

Set `MODEL_PROVIDER` and the matching credentials in `.env`:

- `ollama`: local Ollama using `OLLAMA_BASE_URL`
- `ollama-cloud`: hosted Ollama using `OLLAMA_BASE_URL` and `OLLAMA_API_KEY`
- `openai`: `OPENAI_API_KEY` and optional `OPENAI_BASE_URL`
- `anthropic`: `ANTHROPIC_API_KEY` and optional `ANTHROPIC_BASE_URL`
- `google`: `GOOGLE_API_KEY` and optional `GOOGLE_BASE_URL`

All providers are instantiated behind the same LangChain chat-model interface in `agent/model.server.ts`; the API and app streaming code do not change when providers change.

To send camera or photo-library images to a vision-capable model, set `MODEL_SUPPORTS_IMAGES=true`. It defaults to false so image messages receive a clear compatibility notice instead of being sent to a text-only model.

Set `CHAT_DEBUG_LOGGING=true` to print structured LangChain chat lifecycle logs on the server. Logs cover request receipt and parsing, input validation, model creation and connection, prompt preparation, generation start and first token, completion, cancellation, timeout, and sanitized errors.

Chat text remains excluded by default. To include received messages and each generated chunk temporarily, also set `CHAT_DEBUG_LOG_CONTENT=true`. Content logging can expose sensitive user data, so use it only during local debugging and disable it afterward.

`MODEL_REQUEST_TIMEOUT_MS` sets the maximum duration of a model generation and defaults to 120 seconds. When it expires, the server aborts the LangChain stream and returns a timeout error to the chat UI.

For a production native build, deploy the Expo Router server and configure its origin, or set `EXPO_PUBLIC_CHAT_API_URL` to the deployed `/api/chat` URL. Never put provider API keys in an `EXPO_PUBLIC_` variable.
