import {
  BaseAIProvider,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
  type StreamChunk,
} from './base-provider';

export class GeminiProvider extends BaseAIProvider {
  constructor(apiKey: string) {
    super(apiKey, 'https://generativelanguage.googleapis.com/v1beta');
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const contents = request.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `${this.baseURL}/models/${request.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: request.maxTokens || 8192,
            temperature: request.temperature ?? 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const content = candidate?.content?.parts?.[0]?.text || '';

    const promptTokens = data.usageMetadata?.promptTokenCount || 0;
    const completionTokens = data.usageMetadata?.candidatesTokenCount || 0;

    return {
      id: crypto.randomUUID(),
      model: request.model,
      choices: [
        {
          message: {
            role: 'assistant',
            content,
          },
          finishReason: candidate?.finishReason || 'stop',
        },
      ],
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
  }

  async *streamChat(request: ChatCompletionRequest): AsyncGenerator<StreamChunk> {
    const contents = request.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `${this.baseURL}/models/${request.model}:streamGenerateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: request.maxTokens || 8192,
            temperature: request.temperature ?? 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    const messageId = crypto.randomUUID();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() && line !== '[{') {
          try {
            const jsonLine = line.startsWith(',') ? line.slice(1) : line;
            const parsed = JSON.parse(jsonLine);

            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            const finishReason = parsed.candidates?.[0]?.finishReason;

            if (content || finishReason) {
              yield {
                id: messageId,
                model: request.model,
                choices: [
                  {
                    delta: {
                      content: content || undefined,
                    },
                    finishReason: finishReason,
                  },
                ],
              };
            }
          } catch (e) {
            console.error('Error parsing Gemini stream chunk:', e);
          }
        }
      }
    }
  }

  getProviderName(): string {
    return 'gemini';
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseURL}/models?key=${this.apiKey}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
