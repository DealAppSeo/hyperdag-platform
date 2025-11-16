import {
  BaseAIProvider,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
  type StreamChunk,
} from './base-provider';

export class AnthropicProvider extends BaseAIProvider {
  constructor(apiKey: string) {
    super(apiKey, 'https://api.anthropic.com/v1');
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const systemMessage = request.messages.find((m) => m.role === 'system');
    const userMessages = request.messages.filter((m) => m.role !== 'system');

    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model,
        messages: userMessages,
        system: systemMessage?.content,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      model: data.model,
      choices: [
        {
          message: {
            role: 'assistant',
            content: data.content[0]?.text || '',
          },
          finishReason: data.stop_reason,
        },
      ],
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
    };
  }

  async *streamChat(request: ChatCompletionRequest): AsyncGenerator<StreamChunk> {
    const systemMessage = request.messages.find((m) => m.role === 'system');
    const userMessages = request.messages.filter((m) => m.role !== 'system');

    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model,
        messages: userMessages,
        system: systemMessage?.content,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let messageId = '';
    let model = request.model;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'message_start') {
              messageId = parsed.message.id;
              model = parsed.message.model;
            } else if (parsed.type === 'content_block_delta') {
              yield {
                id: messageId,
                model: model,
                choices: [
                  {
                    delta: {
                      content: parsed.delta.text,
                    },
                  },
                ],
              };
            } else if (parsed.type === 'message_delta') {
              if (parsed.delta.stop_reason) {
                yield {
                  id: messageId,
                  model: model,
                  choices: [
                    {
                      delta: {},
                      finishReason: parsed.delta.stop_reason,
                    },
                  ],
                };
              }
            }
          } catch (e) {
            console.error('Error parsing Anthropic stream chunk:', e);
          }
        }
      }
    }
  }

  getProviderName(): string {
    return 'anthropic';
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        }),
      });
      return response.ok || response.status === 400;
    } catch {
      return false;
    }
  }
}
