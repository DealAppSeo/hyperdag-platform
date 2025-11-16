/**
 * Trinity Provider Manager - Intelligent AI Provider Routing
 * Manages cost-effective providers: Groq, Together AI, Hugging Face
 * Integrates with MotherDuck analytics for arbitrage detection
 */

import groqService from './groq-service';
import togetherAIService from './together-ai-service';
import { huggingFaceService } from './huggingface-service';
import openrouterService from './openrouter-service';
import anyscaleService from './anyscale-service';
import fireworksAIService from './fireworks-ai-service';

interface ProviderInfo {
    name: string;
    cost: string;
    speed: string;
    useCase: string;
    service: any;
    costPerToken?: number;
}

interface RoutingOptions {
    complexity?: 'simple' | 'medium' | 'complex';
    maxCost?: number;
    maxLatency?: number;
    preferFree?: boolean;
}

class TrinityProviderManager {
    private providers: Map<string, ProviderInfo>;
    private isInitialized: boolean = false;

    constructor() {
        this.providers = new Map();
        this.initializeProviders();
    }

    private initializeProviders() {
        // FREE TIER - Maximum cost optimization
        this.providers.set('groq', {
            name: 'Groq',
            cost: '$0 (free tier)',
            speed: 'Ultra-fast',
            useCase: 'Simple queries, high volume',
            service: groqService,
            costPerToken: 0
        });

        this.providers.set('huggingface', {
            name: 'Hugging Face',
            cost: '$0 (free tier)',
            speed: 'Variable',
            useCase: 'Open models, experimentation',
            service: huggingFaceService,
            costPerToken: 0
        });

        // COST-EFFECTIVE TIER - Low cost, high performance
        this.providers.set('together-ai', {
            name: 'Together AI',
            cost: '$0.0002/1K tokens',
            speed: 'Fast',
            useCase: 'Medium complexity',
            service: togetherAIService,
            costPerToken: 0.0002 / 1000
        });

        this.providers.set('anyscale', {
            name: 'Anyscale',
            cost: '$0.15-0.50/1M tokens',
            speed: 'Fast',
            useCase: 'Complex reasoning',
            service: anyscaleService,
            costPerToken: 0.25 / 1000000
        });

        this.providers.set('fireworks-ai', {
            name: 'Fireworks AI',
            cost: '$0.20-0.60/1M tokens',
            speed: 'Very fast',
            useCase: 'High-performance needs',
            service: fireworksAIService,
            costPerToken: 0.40 / 1000000
        });

        // PREMIUM TIER - Model diversity and fallback
        this.providers.set('openrouter', {
            name: 'OpenRouter',
            cost: 'Pass-through + 10-20% markup',
            speed: 'Fast',
            useCase: 'Model diversity, fallback',
            service: openrouterService,
            costPerToken: 0.30 / 1000000 // Estimated average
        });

        console.log('[Trinity Provider Manager] Initialized with 6 providers across 3 cost tiers');
        this.isInitialized = true;
    }

    async initialize() {
        try {
            const initPromises = Array.from(this.providers.values()).map(async (provider) => {
                try {
                    if (provider.service.initialize) {
                        await provider.service.initialize();
                    }
                    return { name: provider.name, success: true };
                } catch (error) {
                    return { name: provider.name, success: false, error: error.message };
                }
            });

            const results = await Promise.all(initPromises);
            const successful = results.filter(r => r.success).length;
            
            console.log(`[Trinity Provider Manager] ${successful}/${results.length} providers initialized`);
            return true;

        } catch (error) {
            console.error('[Trinity Provider Manager] Initialization failed:', error);
            return false;
        }
    }

    /**
     * Select optimal provider based on routing options and analytics
     */
    selectOptimalProvider(options: RoutingOptions = {}): string {
        const {
            complexity = 'medium',
            maxCost = 0.001, // $0.001 per token max
            preferFree = true
        } = options;

        // FREE TIER PRIORITY - Maximum cost optimization
        if (preferFree) {
            if (complexity === 'simple' && this.isProviderAvailable('groq')) {
                return 'groq'; // Ultra-fast for simple queries
            }
            if (this.isProviderAvailable('huggingface')) {
                return 'huggingface'; // Free tier for experimentation
            }
        }

        // COMPLEXITY-BASED SELECTION
        if (complexity === 'complex') {
            // For complex reasoning, prefer Anyscale or fallback to cost-effective options
            if (this.isProviderAvailable('anyscale') && this.providers.get('anyscale')!.costPerToken <= maxCost) {
                return 'anyscale';
            }
            if (this.isProviderAvailable('openrouter')) {
                return 'openrouter'; // Model diversity for complex tasks
            }
        }

        // HIGH-PERFORMANCE NEEDS
        if (options.maxLatency && options.maxLatency < 1000) {
            if (this.isProviderAvailable('fireworks-ai') && this.providers.get('fireworks-ai')!.costPerToken <= maxCost) {
                return 'fireworks-ai'; // Very fast inference
            }
            if (this.isProviderAvailable('groq')) {
                return 'groq'; // Ultra-fast free alternative
            }
        }

        // COST-EFFECTIVE MEDIUM COMPLEXITY
        if (complexity === 'medium') {
            if (this.isProviderAvailable('together-ai') && this.providers.get('together-ai')!.costPerToken <= maxCost) {
                return 'together-ai';
            }
            if (this.isProviderAvailable('anyscale') && this.providers.get('anyscale')!.costPerToken <= maxCost) {
                return 'anyscale';
            }
        }

        // FALLBACK HIERARCHY
        const fallbackOrder = ['groq', 'huggingface', 'together-ai', 'fireworks-ai', 'anyscale', 'openrouter'];
        for (const provider of fallbackOrder) {
            if (this.isProviderAvailable(provider)) {
                const cost = this.providers.get(provider)?.costPerToken || 0;
                if (cost <= maxCost) {
                    return provider;
                }
            }
        }

        // Ultimate fallback to free tier
        return 'groq';
    }

    /**
     * Generate AI response using selected provider
     */
    async generateResponse(prompt: string, options: any = {}): Promise<any> {
        const routingOptions: RoutingOptions = {
            complexity: this.analyzeComplexity(prompt),
            preferFree: options.preferFree !== false,
            maxCost: options.maxCost || 0.001
        };

        const selectedProvider = options.provider || this.selectOptimalProvider(routingOptions);
        const provider = this.providers.get(selectedProvider);

        if (!provider || !this.isProviderAvailable(selectedProvider)) {
            throw new Error(`Provider ${selectedProvider} not available`);
        }

        const startTime = Date.now();

        try {
            let response;
            
            if (selectedProvider === 'huggingface' && provider.service.generateResponse) {
                response = await provider.service.generateResponse(prompt, options);
            } else if (provider.service.generateResponse) {
                response = await provider.service.generateResponse(prompt, options);
            } else {
                throw new Error(`Provider ${selectedProvider} does not support text generation`);
            }

            // Enhance response with Trinity analytics data
            return {
                ...response,
                provider: selectedProvider,
                managerType: 'trinity-provider-manager',
                routingDecision: {
                    complexity: routingOptions.complexity,
                    selectedReason: this.getSelectionReason(selectedProvider, routingOptions),
                    alternativeProviders: this.getAlternatives(selectedProvider)
                }
            };

        } catch (error) {
            const latency = Date.now() - startTime;
            console.error(`[Trinity Provider Manager] ${selectedProvider} failed:`, error.message);
            
            return {
                content: '',
                latency,
                cost: 0,
                provider: selectedProvider,
                managerType: 'trinity-provider-manager',
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Analyze prompt complexity for routing decisions
     */
    private analyzeComplexity(prompt: string): 'simple' | 'medium' | 'complex' {
        const length = prompt.length;
        const complexKeywords = ['analyze', 'compare', 'explain', 'reasoning', 'complex', 'detailed'];
        const simpleKeywords = ['what', 'who', 'when', 'where', 'yes', 'no'];

        const hasComplexKeywords = complexKeywords.some(keyword => 
            prompt.toLowerCase().includes(keyword)
        );
        const hasSimpleKeywords = simpleKeywords.some(keyword => 
            prompt.toLowerCase().includes(keyword)
        );

        if (length > 500 || hasComplexKeywords) {
            return 'complex';
        } else if (length > 100 || (!hasSimpleKeywords && !hasComplexKeywords)) {
            return 'medium';
        } else {
            return 'simple';
        }
    }

    private isProviderAvailable(providerName: string): boolean {
        const provider = this.providers.get(providerName);
        return provider?.service?.isAvailable?.() || false;
    }

    private getSelectionReason(provider: string, options: RoutingOptions): string {
        const providerInfo = this.providers.get(provider);
        if (!providerInfo) return 'Unknown';

        if (options.preferFree && providerInfo.costPerToken === 0) {
            return 'Selected for free tier optimization';
        }
        if (options.complexity === 'simple' && provider === 'groq') {
            return 'Selected for ultra-fast simple query processing';
        }
        if (options.complexity === 'medium' && provider === 'together-ai') {
            return 'Selected for balanced cost-performance on medium complexity';
        }
        return 'Selected as optimal available provider';
    }

    private getAlternatives(selectedProvider: string): string[] {
        return Array.from(this.providers.keys()).filter(p => 
            p !== selectedProvider && this.isProviderAvailable(p)
        );
    }

    /**
     * Get all provider information for analytics
     */
    getProviderInfo(): Array<ProviderInfo & { available: boolean }> {
        return Array.from(this.providers.entries()).map(([key, provider]) => ({
            ...provider,
            available: this.isProviderAvailable(key)
        }));
    }

    /**
     * Get service status
     */
    getStatus() {
        const providers = this.getProviderInfo();
        const available = providers.filter(p => p.available).length;
        
        return {
            initialized: this.isInitialized,
            totalProviders: providers.length,
            availableProviders: available,
            providers: providers.map(p => ({
                name: p.name,
                cost: p.cost,
                speed: p.speed,
                useCase: p.useCase,
                available: p.available
            }))
        };
    }
}

export default new TrinityProviderManager();