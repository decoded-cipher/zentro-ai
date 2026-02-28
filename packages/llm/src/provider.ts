
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  model: string;
  messages: Message[];
  system?: string;
  maxTokens: number;
}

export interface CompletionResult {
  text: string;
  inputTokens: number | null;
  outputTokens: number | null;
}

// Stream events emitted during streaming
export type StreamEvent =
  | { type: 'text'; text: string }
  | { type: 'usage'; inputTokens: number | null; outputTokens: number | null }
  | { type: 'done' };

export interface LLMProvider {
  readonly name: string;

  /** Single-shot completion (non-streaming) */
  complete(options: CompletionOptions): Promise<CompletionResult>;

  /** Streaming completion — yields events as they arrive */
  stream(options: CompletionOptions): AsyncIterable<StreamEvent>;
}
