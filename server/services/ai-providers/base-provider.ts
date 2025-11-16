/**
 * Base interface for all AI providers
 * Provides a unified API for chat completions across providers
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finishReason: string;
  }[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  id: string;
  model: string;
  choices: {
    delta: {
      role?: string;
      content?: string;
    };
    finishReason?: string;
  }[];
}

export abstract class BaseAIProvider {
  protected apiKey: string;
  protected baseURL: string;

  constructor(apiKey: string, baseURL?: string) {
    this.apiKey = apiKey;
    this.baseURL = baseURL || '';
  }

  /**
   * Send a chat completion request
   */
  abstract chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;

  /**
   * Stream a chat completion response
   */
  abstract streamChat(request: ChatCompletionRequest): AsyncGenerator<StreamChunk>;

  /**
   * Get provider name
   */
  abstract getProviderName(): string;

  /**
   * Health check
   */
  abstract healthCheck(): Promise<boolean>;
}
