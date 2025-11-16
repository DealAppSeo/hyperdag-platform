/**
 * OpenRouter AI Service - Model diversity and fallback routing
 * Cost: Pass-through + 10-20% markup
 * Speed: Fast
 * Use case: Model diversity, fallback
 */

import axios from 'axios';

interface OpenRouterConfig {
    apiKey?: string;
    baseURL: string;
    models: string[];
}

class OpenRouterService {
    private config: OpenRouterConfig;
    private isInitialized: boolean = false;

    constructor() {
        this.config = {
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: 'https://openrouter.ai/api/v1',
            models: [
                'meta-llama/llama-3.1-8b-instruct:free',
                'microsoft/phi-3-mini-128k-instruct:free',
                'google/gemma-2-9b-it:free',
                'meta-llama/llama-3.1-70b-instruct',
                'anthropic/claude-3.5-sonnet',
                'openai/gpt-4o-mini'
            ]
        };
    }

    async initialize() {
        try {
            if (!this.config.apiKey) {
                console.log('[OpenRouter] Service configured - waiting for API key setup');
                return false;
            }

            // Test connection with models endpoint
            const response = await axios.get(`${this.config.baseURL}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            this.isInitialized = true;
            console.log('[OpenRouter] Service initialized successfully');
            console.log(`[OpenRouter] Available models: ${this.config.models.length}`);
            return true;

        } catch (error) {
            console.log('[OpenRouter] Service configured - waiting for API key setup');
            return false;
        }
    }

    async generateResponse(prompt: string, options: any = {}) {
        if (!this.isInitialized || !this.config.apiKey) {
            throw new Error('OpenRouter service not initialized or API key missing');
        }

        const startTime = Date.now();
        
        try {
            const model = options.model || 'meta-llama/llama-3.1-8b-instruct:free';
            
            const response = await axios.post(`${this.config.baseURL}/chat/completions`, {
                model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: options.maxTokens || 1000,
                temperature: options.temperature || 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://hyperdag.org',
                    'X-Title': 'Trinity Symphony AI Orchestration'
                },
                timeout: 30000
            });

            const latency = Date.now() - startTime;
            const content = response.data.choices[0]?.message?.content || '';
            const tokens = response.data.usage?.total_tokens || 0;
            
            // Calculate cost with markup (varies by model)
            const baseCost = this.calculateBaseCost(model, tokens);
            const cost = baseCost * 1.15; // 15% average markup

            return {
                content,
                latency,
                cost,
                provider: 'openrouter',
                model,
                success: true,
                tokens
            };

        } catch (error) {
            const latency = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('[OpenRouter] Generation error:', errorMessage);
            
            return {
                content: '',
                latency,
                cost: 0,
                provider: 'openrouter',
                model: options.model || 'meta-llama/llama-3.1-8b-instruct:free',
                success: false,
                error: errorMessage
            };
        }
    }

    private calculateBaseCost(model: string, tokens: number): number {
        // Estimate base costs for different model tiers
        if (model.includes(':free')) return 0;
        if (model.includes('gpt-4o-mini')) return (tokens / 1000000) * 0.15;
        if (model.includes('llama-3.1-70b')) return (tokens / 1000000) * 0.59;
        if (model.includes('claude-3.5')) return (tokens / 1000000) * 3.0;
        return (tokens / 1000000) * 0.20; // Default estimate
    }

    getServiceInfo() {
        return {
            name: 'OpenRouter',
            cost: 'Pass-through + 10-20% markup',
            speed: 'Fast',
            useCase: 'Model diversity, fallback',
            models: this.config.models,
            initialized: this.isInitialized,
            capabilities: ['chat', 'completion', 'model-diversity', 'fallback-routing']
        };
    }

    isAvailable() {
        return this.isInitialized && !!this.config.apiKey;
    }
}

export default new OpenRouterService();