import { fetch } from 'expo/fetch';

import type { ChatMessage } from '@/constants/chat';

type StreamEvent =
  | { type: 'token'; content: string }
  | { type: 'done' }
  | { type: 'error'; error: string };

const CONFIGURED_CHAT_API_URL = process.env.EXPO_PUBLIC_CHAT_API_URL || '/api/chat';

function chatApiUrl() {
  if (!CONFIGURED_CHAT_API_URL.startsWith('/')) return CONFIGURED_CHAT_API_URL;

  const origin = typeof window !== 'undefined' ? window.location?.origin : undefined;
  if (!origin) {
    throw new Error(
      'Unable to resolve the relative chat API URL. Set EXPO_PUBLIC_CHAT_API_URL to an absolute URL.',
    );
  }
  return new URL(CONFIGURED_CHAT_API_URL, origin).toString();
}

function logChat(event: string, details: Record<string, unknown> = {}) {
  if (__DEV__) console.log('[CHAT]', event, details);
}

function logChatError(event: string, error: unknown, details: Record<string, unknown> = {}) {
  if (!__DEV__) return;
  console.error('[CHAT]', event, {
    ...details,
    errorName: error instanceof Error ? error.name : 'UnknownError',
    errorMessage: error instanceof Error ? error.message : String(error),
  });
}

export async function streamChatResponse(
  messages: ChatMessage[],
  onToken: (token: string) => void,
  signal?: AbortSignal,
) {
  const startedAt = Date.now();
  const url = chatApiUrl();
  let requestId: string | null = null;
  let chunkCount = 0;
  let outputCharacters = 0;

  logChat('request.start', { url, messageCount: messages.length });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages.map(({ role, content }) => ({ role, content })) }),
      signal,
    });

    requestId = response.headers.get('x-request-id');
    logChat('response.received', {
      requestId,
      url: response.url,
      status: response.status,
      durationMs: Date.now() - startedAt,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `Chat request failed with status ${response.status}.`);
    }
    if (!response.body) throw new Error('This platform did not provide a streaming response body.');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let completed = false;

    const consume = (line: string) => {
      if (!line.trim()) return;
      const event = JSON.parse(line) as StreamEvent;
      if (event.type === 'token') {
        chunkCount += 1;
        outputCharacters += event.content.length;
        if (chunkCount === 1) {
          logChat('stream.first_token', { requestId, timeToFirstTokenMs: Date.now() - startedAt });
        }
        onToken(event.content);
      }
      if (event.type === 'error') throw new Error(event.error);
      if (event.type === 'done') completed = true;
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        lines.forEach(consume);
        if (done) break;
      }
      consume(buffer);
      if (!completed) throw new Error('The model response stream ended unexpectedly.');
      logChat('stream.completed', {
        requestId,
        chunkCount,
        outputCharacters,
        durationMs: Date.now() - startedAt,
      });
    } finally {
      if (!completed) await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
  } catch (error) {
    logChatError(signal?.aborted ? 'request.aborted' : 'request.failed', error, {
      requestId,
      chunkCount,
      outputCharacters,
      durationMs: Date.now() - startedAt,
    });
    throw error;
  }
}
