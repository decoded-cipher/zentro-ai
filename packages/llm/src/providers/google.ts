
import { GoogleGenAI } from '@google/genai';
import type { LLMProvider, CompletionOptions, CompletionResult, StreamEvent } from '../provider';


export function createGoogleProvider(config: { apiKey: string }): LLMProvider {
  const ai = new GoogleGenAI({ apiKey: config.apiKey });

  function toGeminiContents(options: CompletionOptions) {
    return options.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
  }

  return {
    name: 'google',

    async complete(options: CompletionOptions): Promise<CompletionResult> {
      const response = await ai.models.generateContent({
        model: options.model,
        contents: toGeminiContents(options),
        config: {
          maxOutputTokens: options.maxTokens,
          ...(options.system ? { systemInstruction: options.system } : {}),
        },
      });

      return {
        text: response.text ?? '',
        inputTokens: response.usageMetadata?.promptTokenCount ?? null,
        outputTokens: response.usageMetadata?.candidatesTokenCount ?? null,
      };
    },

    async *stream(options: CompletionOptions): AsyncGenerator<StreamEvent> {
      const responseStream = await ai.models.generateContentStream({
        model: options.model,
        contents: toGeminiContents(options),
        config: {
          maxOutputTokens: options.maxTokens,
          ...(options.system ? { systemInstruction: options.system } : {}),
        },
      });

      let inputTokens: number | null = null;
      let outputTokens: number | null = null;

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          yield { type: 'text', text };
        }

        if (chunk.usageMetadata) {
          inputTokens = chunk.usageMetadata.promptTokenCount ?? inputTokens;
          outputTokens = chunk.usageMetadata.candidatesTokenCount ?? outputTokens;
        }
      }

      yield { type: 'usage', inputTokens, outputTokens };
      yield { type: 'done' };
    },
  };
}
