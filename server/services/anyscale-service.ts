/**
 * Anyscale AI Service - Complex reasoning tasks
 * Cost: $0.15-0.50/1M tokens
 * Speed: Fast
 * Use case: Complex reasoning
 */

import axios from 'axios';

interface AnyscaleConfig {
    apiKey?: string;
    baseURL: string;
    models: string[];
}

class AnyscaleService {
    private config: AnyscaleConfig;
    private isInitialized: boolean = false;

    constructor() {
        this.config = {
            apiKey: process.env.ANYSCALE_API_KEY,
            baseURL: 'https://api.endpoints.anyscale.com/v1',
            models: [
                'meta-llama/Llama-2-7b-chat-hf',
                'meta-llama/Llama-2-13b-chat-hf',
                'meta-llama/Llama-2-70b-chat-hf',
                'codellama/CodeLlama-34b-Instruct-hf',
                'mistralai/Mistral-7B-Instruct-v0.1'
            ]
        };
    }

    async initialize() {
        try {
            if (!this.config.apiKey) {
                console.log('[Anyscale] Service configured - waiting for API key setup');
                return false;
            }

            // Test connection
            const response = await axios.get(`${this.config.baseURL}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            this.isInitialized = true;
            console.log('[Anyscale] Service initialized successfully');
            console.log(`[Anyscale] Available models: ${this.config.models.length}`);
            return true;

        } catch (error) {
            console.log('[Anyscale] Service configured - waiting for API key setup');
            return false;
        }
    }

    async generateResponse(prompt: string, options: any = {}) {
        if (!this.isInitialized || !this.config.apiKey) {
            throw new Error('Anyscale service not initialized or API key missing');
        }

        const startTime = Date.now();
        
        try {
            const model = options.model || 'meta-llama/Llama-2-13b-chat-hf';
            
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
                    'Content-Type': 'application/json'
                },
                timeout: 25000
            });

            const latency = Date.now() - startTime;
            const content = response.data.choices[0]?.message?.content || '';
            const tokens = response.data.usage?.total_tokens || 0;
            const cost = (tokens / 1000000) * 0.25; // Average $0.25/1M tokens

            return {
                content,
                latency,
                cost,
                provider: 'anyscale',
                model,
                success: true,
                tokens
            };

        } catch (error) {
            const latency = Date.now() - startTime;
            console.error('[Anyscale] Generation error:', error.message);
            
            return {
                content: '',
                latency,
                cost: 0,
                provider: 'anyscale',
                model: options.model || 'meta-llama/Llama-2-13b-chat-hf',
                success: false,
                error: error.message
            };
        }
    }

    getServiceInfo() {
        return {
            name: 'Anyscale',
            cost: '$0.15-0.50/1M tokens',
            speed: 'Fast',
            useCase: 'Complex reasoning',
            models: this.config.models,
            initialized: this.isInitialized,
            capabilities: ['chat', 'completion', 'complex-reasoning', 'code-generation']
        };
    }

    isAvailable() {
        return this.isInitialized && !!this.config.apiKey;
    }
}

export default new AnyscaleService();