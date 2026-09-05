import type { BaseMessageLike } from '@langchain/core/messages';

import { createChatLogger } from '@/agent/chat-logger.server';
import { createChatModel } from '@/agent/model.server';

type IncomingMessage = {
  role: 'assistant' | 'user';
  content: string;
  image?: { dataUrl: string };
};

const IMAGE_UNSUPPORTED_RESPONSE =
  "This model can't read images. Please switch to an image-capable model or send your question as text.";

const DEFAULT_GENERATION_TIMEOUT_MS = 120_000;

function generationTimeoutMs() {
  const configured = process.env.MODEL_REQUEST_TIMEOUT_MS;
  if (!configured) return DEFAULT_GENERATION_TIMEOUT_MS;

  const value = Number(configured);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error('MODEL_REQUEST_TIMEOUT_MS must be a positive integer.');
  }
  return value;
}

function isIncomingMessage(value: unknown): value is IncomingMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Record<string, unknown>;
  return (
    (message.role === 'assistant' || message.role === 'user') &&
    typeof message.content === 'string' &&
    message.content.length <= 50_000 &&
    (message.image === undefined || isIncomingImage(message.image)) &&
    (message.content.trim().length > 0 || isIncomingImage(message.image))
  );
}

function isIncomingImage(value: unknown): value is { dataUrl: string } {
  if (!value || typeof value !== 'object') return false;
  const dataUrl = (value as Record<string, unknown>).dataUrl;
  return typeof dataUrl === 'string' && /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(dataUrl) && dataUrl.length <= 15_000_000;
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const logger = createChatLogger(requestId);
  const startedAt = Date.now();
  logger.debug('request.received', {
    contentLength: request.headers.get('content-length') ?? undefined,
  });

  let body: unknown;
  try {
    logger.debug('request.parsing');
    body = await request.json();
  } catch (error) {
    logger.error('request.invalid_json', error, { durationMs: Date.now() - startedAt });
    return Response.json(
      { error: 'Request body must be valid JSON.' },
      { status: 400, headers: { 'X-Request-Id': requestId } },
    );
  }

  const messages = (body as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || !messages.every(isIncomingMessage)) {
    logger.debug('request.invalid_messages', { durationMs: Date.now() - startedAt });
    return Response.json(
      { error: 'messages must be a non-empty array of valid chat messages.' },
      { status: 400, headers: { 'X-Request-Id': requestId } },
    );
  }

  logger.debug('request.validated', {
    messageCount: messages.length,
    inputCharacters: messages.reduce((total, message) => total + message.content.length, 0),
    roles: messages.map(({ role }) => role).join(','),
  });
  logger.content('input.received', {
    messages: messages.map(({ role, content, image }) => ({ role, content, hasImage: Boolean(image) })),
  });

  const encoder = new TextEncoder();
  const generationController = new AbortController();
  let outputCharacters = 0;
  let chunkCount = 0;
  let cancelled = false;
  let timedOut = false;
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      const abortFromRequest = () => generationController.abort(request.signal.reason);
      if (request.signal.aborted) abortFromRequest();
      else request.signal.addEventListener('abort', abortFromRequest, { once: true });

      let timeout: ReturnType<typeof setTimeout> | undefined;

      try {
        const supportsImages = process.env.MODEL_SUPPORTS_IMAGES === 'true';
        if (messages.at(-1)?.image && !supportsImages) {
          send({ type: 'token', content: IMAGE_UNSUPPORTED_RESPONSE });
          send({ type: 'done' });
          logger.debug('model.skipped_image_unsupported');
          return;
        }
        const timeoutMs = generationTimeoutMs();
        const timeoutError = new Error(`Generation timed out after ${timeoutMs}ms.`);
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeout = setTimeout(() => {
            timedOut = true;
            logger.debug('model.timeout', {
              timeoutMs,
              chunkCount,
              outputCharacters,
              durationMs: Date.now() - startedAt,
            });
            generationController.abort(timeoutError);
            reject(timeoutError);
          }, timeoutMs);
        });

        logger.debug('model.creating', {
          provider: process.env.MODEL_PROVIDER ?? 'ollama',
          model: process.env.MODEL_NAME,
          timeoutMs,
        });
        const model = createChatModel();
        logger.debug('model.created');
        const systemPrompt = process.env.MODEL_SYSTEM_PROMPT?.trim();
        const modelMessages: BaseMessageLike[] = [
          ...(systemPrompt ? ([{ role: 'system', content: systemPrompt }] as BaseMessageLike[]) : []),
          ...messages.map(({ role, content, image }) => image && supportsImages
            ? {
                role,
                content: [
                  ...(content.trim() ? [{ type: 'text', text: content }] : []),
                  { type: 'image_url', image_url: { url: image.dataUrl } },
                ],
              }
            : { role, content: content || '[Image attachment omitted]' }),
        ];
        logger.debug('prompt.prepared', {
          systemPromptConfigured: Boolean(systemPrompt),
          modelMessageCount: modelMessages.length,
        });
        logger.debug('model.connecting');
        const chunks = await Promise.race([
          model.stream(modelMessages, { signal: generationController.signal }),
          timeoutPromise,
        ]);
        logger.debug('model.stream_created');
        const iterator = chunks[Symbol.asyncIterator]();
        let receivedFirstToken = false;
        logger.debug('generation.started');

        while (true) {
          const { done, value: chunk } = await Promise.race([iterator.next(), timeoutPromise]);
          if (done) break;
          if (chunk.text) {
            chunkCount += 1;
            outputCharacters += chunk.text.length;
            if (!receivedFirstToken) {
              receivedFirstToken = true;
              logger.debug('generation.first_token', {
                timeToFirstTokenMs: Date.now() - startedAt,
              });
            }
            logger.content('generation.chunk', {
              chunk: chunk.text,
              chunkNumber: chunkCount,
            });
            send({ type: 'token', content: chunk.text });
          }
        }
        logger.debug('generation.finished', { chunkCount, outputCharacters });
        send({ type: 'done' });
        logger.debug('model.completed', {
          chunkCount,
          outputCharacters,
          durationMs: Date.now() - startedAt,
        });
      } catch (error) {
        logger.error(timedOut ? 'model.timed_out' : 'model.failed', error, {
          chunkCount,
          outputCharacters,
          durationMs: Date.now() - startedAt,
        });
        if (!cancelled && !request.signal.aborted) {
          const message = timedOut
            ? 'The model took too long to respond. Please try again.'
            : error instanceof Error ? error.message : 'The model request failed.';
          send({ type: 'error', error: message });
        }
      } finally {
        if (timeout) clearTimeout(timeout);
        request.signal.removeEventListener('abort', abortFromRequest);
        if (!cancelled) controller.close();
      }
    },
    cancel() {
      cancelled = true;
      generationController.abort(new Error('The response stream was cancelled by the client.'));
      logger.debug('stream.cancelled', {
        chunkCount,
        outputCharacters,
        durationMs: Date.now() - startedAt,
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-cache, no-transform',
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Request-Id': requestId,
    },
  });
}
