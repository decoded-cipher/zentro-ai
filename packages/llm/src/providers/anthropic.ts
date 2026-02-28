
import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, CompletionOptions, CompletionResult, StreamEvent } from '../provider';


export function createAnthropicProvider(config: { apiKey: string }): LLMProvider {
  const client = new Anthropic({ apiKey: config.apiKey });

  return {
    name: 'anthropic',

    async complete(options: CompletionOptions): Promise<CompletionResult> {
      const msg = await client.messages.create({
        model: options.model,
        max_tokens: options.maxTokens,
        ...(options.system ? { system: options.system } : {}),
        messages: options.messages,
      });

      const block = msg.content[0];
      const text = block && 'text' in block ? block.text : '';

      return {
        text,
        inputTokens: msg.usage?.input_tokens ?? null,
        outputTokens: msg.usage?.output_tokens ?? null,
      };
    },

    async *stream(options: CompletionOptions): AsyncGenerator<StreamEvent> {
      const stream = await client.messages.stream({
        model: options.model,
        max_tokens: options.maxTokens,
        ...(options.system ? { system: options.system } : {}),
        messages: options.messages,
      });

      let inputTokens: number | null = null;
      let outputTokens: number | null = null;

      for await (const chunk of stream) {
        if (chunk.type === 'message_start' && chunk.message?.usage?.input_tokens != null) {
          inputTokens = chunk.message.usage.input_tokens;
        }

        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const text = chunk.delta.text;
          if (text) {
            yield { type: 'text', text };
          }
        }

        if (chunk.type === 'message_delta' && chunk.usage?.output_tokens != null) {
          outputTokens = chunk.usage.output_tokens;
        }
      }

      yield { type: 'usage', inputTokens, outputTokens };
      yield { type: 'done' };
    },
  };
}
