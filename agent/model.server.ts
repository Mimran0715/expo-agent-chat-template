import { ChatAnthropic } from '@langchain/anthropic';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOllama } from '@langchain/ollama';
import { ChatOpenAI } from '@langchain/openai';

export type ModelProvider = 'ollama' | 'ollama-cloud' | 'openai' | 'anthropic' | 'google';

function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`${name} is required for the selected MODEL_PROVIDER.`);
  return value;
}

function optionalNumber(name: string, value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${name} must be a number.`);
  return parsed;
}

export function createChatModel(): BaseChatModel {
  const provider = (process.env.MODEL_PROVIDER ?? 'ollama') as ModelProvider;
  const model = required('MODEL_NAME', process.env.MODEL_NAME);
  const temperature = optionalNumber('MODEL_TEMPERATURE', process.env.MODEL_TEMPERATURE);
  const maxTokens = optionalNumber('MODEL_MAX_TOKENS', process.env.MODEL_MAX_TOKENS);

  switch (provider) {
    case 'ollama':
      return new ChatOllama({
        model,
        baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434',
        temperature,
        numPredict: maxTokens,
      });
    case 'ollama-cloud':
      return new ChatOllama({
        model,
        baseUrl: process.env.OLLAMA_BASE_URL ?? 'https://ollama.com',
        headers: {
          Authorization: `Bearer ${required('OLLAMA_API_KEY', process.env.OLLAMA_API_KEY)}`,
        },
        temperature,
        numPredict: maxTokens,
      });
    case 'openai':
      return new ChatOpenAI({
        model,
        apiKey: required('OPENAI_API_KEY', process.env.OPENAI_API_KEY),
        temperature,
        maxTokens,
        configuration: process.env.OPENAI_BASE_URL
          ? { baseURL: process.env.OPENAI_BASE_URL }
          : undefined,
      });
    case 'anthropic':
      return new ChatAnthropic({
        model,
        apiKey: required('ANTHROPIC_API_KEY', process.env.ANTHROPIC_API_KEY),
        temperature,
        maxTokens,
        anthropicApiUrl: process.env.ANTHROPIC_BASE_URL,
      });
    case 'google':
      return new ChatGoogleGenerativeAI({
        model,
        apiKey: required('GOOGLE_API_KEY', process.env.GOOGLE_API_KEY),
        temperature,
        maxOutputTokens: maxTokens,
        baseUrl: process.env.GOOGLE_BASE_URL,
      });
    default:
      throw new Error(
        `Unsupported MODEL_PROVIDER "${provider}". Use ollama, ollama-cloud, openai, anthropic, or google.`,
      );
  }
}
