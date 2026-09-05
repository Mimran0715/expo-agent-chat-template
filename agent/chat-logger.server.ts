type LogDetails = Record<string, unknown>;

const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on']);

export function isChatDebugLoggingEnabled() {
  return TRUTHY_VALUES.has((process.env.CHAT_DEBUG_LOGGING ?? '').trim().toLowerCase());
}

function isChatDebugContentEnabled() {
  return TRUTHY_VALUES.has((process.env.CHAT_DEBUG_LOG_CONTENT ?? '').trim().toLowerCase());
}

function sanitize(value: string) {
  let sanitized = value
    .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/\b(sk|key)-[A-Za-z0-9_-]+\b/g, '[REDACTED]');

  for (const secret of [
    process.env.OLLAMA_API_KEY,
    process.env.OPENAI_API_KEY,
    process.env.ANTHROPIC_API_KEY,
    process.env.GOOGLE_API_KEY,
  ]) {
    if (secret) sanitized = sanitized.replaceAll(secret, '[REDACTED]');
  }

  return sanitized;
}

function write(level: 'debug' | 'error', event: string, details: LogDetails) {
  if (!isChatDebugLoggingEnabled()) return;

  const entry = {
    scope: 'langchain-chat',
    event,
    timestamp: new Date().toISOString(),
    ...details,
  };

  if (level === 'error') console.error(entry);
  else console.log(entry);
}

export function createChatLogger(requestId: string) {
  return {
    debug(event: string, details: LogDetails = {}) {
      write('debug', event, { requestId, ...details });
    },
    content(event: string, details: LogDetails = {}) {
      if (!isChatDebugContentEnabled()) return;
      write('debug', event, { requestId, containsChatContent: true, ...details });
    },
    error(event: string, error: unknown, details: LogDetails = {}) {
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      const errorMessage = error instanceof Error ? error.message : String(error);
      write('error', event, {
        requestId,
        ...details,
        errorName,
        errorMessage: sanitize(errorMessage),
      });
    },
  };
}
