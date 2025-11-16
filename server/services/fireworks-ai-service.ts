/**
 * Fireworks AI Service - High-performance AI inference
 * Cost: $0.20-0.60/1M tokens
 * Speed: Very fast
 * Use case: High-performance needs
 */

import axios from 'axios';

interface FireworksAIConfig {
    apiKey?: string;
    baseURL: string;
    models: string[];
}

class FireworksAIService {
    private config: FireworksAIConfig;
    private isInitialized: boolean = false;

    constructor() {
        this.config = {
            apiKey: process.env.FIREWORKS_API_KEY,
            baseURL: 'https://api.fireworks.ai/inference/v1',
            models: [
                'accounts/fireworks/models/llama-v3p1-8b-instruct',
                'accounts/fireworks/models/llama-v3p1-70b-instruct',
                'accounts/fireworks/models/mixtral-8x7b-instruct',
                'accounts/fireworks/models/gemma2-9b-it',
                'accounts/fireworks/models/qwen2p5-7b-instruct'
            ]
        };
    }

    async initialize() {
        try {
            if (!this.config.apiKey) {
                console.log('[Fireworks AI] Service configured - waiting for API key setup');
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
            console.log('[Fireworks AI] Service initialized successfully');
            console.log(`[Fireworks AI] Available models: ${this.config.models.length}`);
            return true;

        } catch (error) {
            console.log('[Fireworks AI] Service configured - waiting for API key setup');
            return false;
        }
    }

    async generateResponse(prompt: string, options: any = {}) {
        if (!this.isInitialized || !this.config.apiKey) {
            throw new Error('Fireworks AI service not initialized or API key missing');
        }

        const startTime = Date.now();
        
        try {
            const model = options.model || 'accounts/fireworks/models/llama-v3p1-8b-instruct';
            
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
                timeout: 15000 // Very fast service
            });

            const latency = Date.now() - startTime;
            const content = response.data.choices[0]?.message?.content || '';
            const tokens = response.data.usage?.total_tokens || 0;
            const cost = (tokens / 1000000) * 0.40; // Average $0.40/1M tokens

            return {
                content,
                latency,
                cost,
                provider: 'fireworks-ai',
                model,
                success: true,
                tokens
            };

        } catch (error) {
            const latency = Date.now() - startTime;
            console.error('[Fireworks AI] Generation error:', error.message);
            
            return {
                content: '',
                latency,
                cost: 0,
                provider: 'fireworks-ai',
                model: options.model || 'accounts/fireworks/models/llama-v3p1-8b-instruct',
                success: false,
                error: error.message
            };
        }
    }

    getServiceInfo() {
        return {
            name: 'Fireworks AI',
            cost: '$0.20-0.60/1M tokens',
            speed: 'Very fast',
            useCase: 'High-performance needs',
            models: this.config.models,
            initialized: this.isInitialized,
            capabilities: ['chat', 'completion', 'high-performance', 'ultra-fast-inference']
        };
    }

    isAvailable() {
        return this.isInitialized && !!this.config.apiKey;
    }
}

export default new FireworksAIService();