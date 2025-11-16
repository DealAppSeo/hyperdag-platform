/**
 * Together AI Service - Fast inference for medium complexity
 * Cost: $0.0002/1K tokens
 * Speed: Fast
 * Use case: Medium complexity queries
 */

import axios from 'axios';

interface TogetherAIConfig {
    apiKey?: string;
    baseURL: string;
    models: string[];
}

class TogetherAIService {
    private config: TogetherAIConfig;
    private isInitialized: boolean = false;

    constructor() {
        this.config = {
            apiKey: process.env.TOGETHER_API_KEY,
            baseURL: 'https://api.together.xyz/v1',
            models: [
                'meta-llama/Llama-2-7b-chat-hf',
                'meta-llama/Llama-2-13b-chat-hf',
                'meta-llama/Llama-2-70b-chat-hf',
                'mistralai/Mixtral-8x7B-Instruct-v0.1',
                'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO'
            ]
        };
    }

    async initialize() {
        try {
            if (!this.config.apiKey) {
                console.log('[Together AI] Service configured - waiting for API key setup');
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
            console.log('[Together AI] Service initialized successfully');
            console.log(`[Together AI] Available models: ${this.config.models.length}`);
            return true;

        } catch (error) {
            console.log('[Together AI] Service configured - waiting for API key setup');
            return false;
        }
    }

    async generateResponse(prompt: string, options: any = {}) {
        if (!this.isInitialized || !this.config.apiKey) {
            throw new Error('Together AI service not initialized or API key missing');
        }

        const startTime = Date.now();
        
        try {
            const model = options.model || 'meta-llama/Llama-2-7b-chat-hf';
            
            const response = await axios.post(`${this.config.baseURL}/chat/completions`, {
                model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: options.maxTokens || 1000,
                temperature: options.temperature || 0.7,
                stop: options.stop || null
            }, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000 // 15 second timeout
            });

            const latency = Date.now() - startTime;
            const content = response.data.choices[0]?.message?.content || '';
            const tokens = response.data.usage?.total_tokens || 0;
            const cost = (tokens / 1000) * 0.0002; // $0.0002 per 1K tokens

            return {
                content,
                latency,
                cost,
                provider: 'together-ai',
                model,
                success: true,
                tokens
            };

        } catch (error) {
            const latency = Date.now() - startTime;
            console.error('[Together AI] Generation error:', error.message);
            
            return {
                content: '',
                latency,
                cost: 0,
                provider: 'together-ai',
                model: options.model || 'meta-llama/Llama-2-7b-chat-hf',
                success: false,
                error: error.message
            };
        }
    }

    getServiceInfo() {
        return {
            name: 'Together AI',
            cost: '$0.0002/1K tokens',
            speed: 'Fast',
            useCase: 'Medium complexity queries',
            models: this.config.models,
            initialized: this.isInitialized,
            capabilities: ['chat', 'completion', 'cost-effective']
        };
    }

    isAvailable() {
        return this.isInitialized && !!this.config.apiKey;
    }
}

export default new TogetherAIService();