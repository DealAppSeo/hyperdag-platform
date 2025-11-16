import type { BaseAIProvider } from './base-provider';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { GeminiProvider } from './gemini-provider';
import { PerplexityProvider } from './perplexity-provider';

export class AIProviderFactory {
  private providers: Map<string, BaseAIProvider> = new Map();

  /**
   * Register a provider with its API key
   */
  registerProvider(providerName: string, apiKey: string): void {
    let provider: BaseAIProvider;

    switch (providerName.toLowerCase()) {
      case 'openai':
        provider = new OpenAIProvider(apiKey);
        break;
      case 'anthropic':
        provider = new AnthropicProvider(apiKey);
        break;
      case 'gemini':
        provider = new GeminiProvider(apiKey);
        break;
      case 'perplexity':
        provider = new PerplexityProvider(apiKey);
        break;
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }

    this.providers.set(providerName.toLowerCase(), provider);
  }

  /**
   * Get a registered provider
   */
  getProvider(providerName: string): BaseAIProvider {
    const provider = this.providers.get(providerName.toLowerCase());
    if (!provider) {
      throw new Error(`Provider not registered: ${providerName}`);
    }
    return provider;
  }

  /**
   * Check if a provider is registered
   */
  hasProvider(providerName: string): boolean {
    return this.providers.has(providerName.toLowerCase());
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): Map<string, BaseAIProvider> {
    return this.providers;
  }

  /**
   * Initialize providers from environment variables
   */
  initializeFromEnv(): void {
    const envMappings = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      gemini: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
      perplexity: process.env.PERPLEXITY_API_KEY,
    };

    for (const [provider, apiKey] of Object.entries(envMappings)) {
      if (apiKey) {
        try {
          this.registerProvider(provider, apiKey);
          console.log(`✅ Registered ${provider} provider`);
        } catch (error) {
          console.error(`❌ Failed to register ${provider}:`, error);
        }
      }
    }
  }
}

export const providerFactory = new AIProviderFactory();
