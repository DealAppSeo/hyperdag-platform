/**
 * Groq AI Service - Ultra-fast inference for simple queries
 * Cost: $0 (free tier)
 * Speed: Ultra-fast
 * Use case: Simple queries, high volume
 */

import axios from 'axios';

interface GroqConfig {
    apiKey?: string;
    baseURL: string;
    models: string[];
}

class GroqService {
    private config: GroqConfig;
    private isInitialized: boolean = false;

    constructor() {
        this.config = {
            apiKey: process.env.GROQ_API_KEY,
            baseURL: 'https://api.groq.com/openai/v1',
            models: [
                'llama3-8b-8192',
                'llama3-70b-8192', 
                'mixtral-8x7b-32768',
                'gemma-7b-it'
            ]
        };
    }

    async initialize() {
        try {
            if (!this.config.apiKey) {
                console.log('[Groq] Service configured - waiting for API key setup');
                return false;
            }

            // Test connection with a simple request
            const response = await axios.get(`${this.config.baseURL}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            this.isInitialized = true;
            console.log('[Groq] Service initialized successfully');
            console.log(`[Groq] Available models: ${this.config.models.length}`);
            return true;

        } catch (error) {
            console.log('[Groq] Service configured - waiting for API key setup');
            return false;
        }
    }

    async generateResponse(prompt: string, options: any = {}) {
        if (!this.isInitialized || !this.config.apiKey) {
            throw new Error('Groq service not initialized or API key missing');
        }

        const startTime = Date.now();
        
        try {
            const model = options.model || 'llama3-8b-8192'; // Default to fastest model
            
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
                stream: false
            }, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 second timeout for ultra-fast service
            });

            const latency = Date.now() - startTime;
            const content = response.data.choices[0]?.message?.content || '';

            return {
                content,
                latency,
                cost: 0, // Free tier
                provider: 'groq',
                model,
                success: true,
                tokens: response.data.usage?.total_tokens || 0
            };

        } catch (error) {
            const latency = Date.now() - startTime;
            console.error('[Groq] Generation error:', error.message);
            
            return {
                content: '',
                latency,
                cost: 0,
                provider: 'groq',
                model: options.model || 'llama3-8b-8192',
                success: false,
                error: error.message
            };
        }
    }

    getServiceInfo() {
        return {
            name: 'Groq',
            cost: '$0 (free tier)',
            speed: 'Ultra-fast',
            useCase: 'Simple queries, high volume',
            models: this.config.models,
            initialized: this.isInitialized,
            capabilities: ['chat', 'completion', 'ultra-fast-inference']
        };
    }

    isAvailable() {
        return this.isInitialized && !!this.config.apiKey;
    }
}

export default new GroqService();