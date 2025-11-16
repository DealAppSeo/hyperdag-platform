/**
 * Trinity Cost-Effective Providers API
 * Groq, Together AI, Hugging Face integration with MotherDuck analytics
 */

import { Router } from 'express';
import trinityProviderManager from '../services/trinity-provider-manager';

const router = Router();

/**
 * Get all provider information and status
 */
router.get('/status', async (req, res) => {
    try {
        const status = trinityProviderManager.getStatus();
        
        res.json({
            success: true,
            ...status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Failed to get provider status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Generate AI response using optimal provider selection
 */
router.post('/generate', async (req, res) => {
    try {
        const { prompt, options = {} } = req.body;
        
        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: 'Prompt is required'
            });
        }

        const response = await trinityProviderManager.generateResponse(prompt, options);
        
        res.json({
            success: true,
            response,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Failed to generate response:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Test specific provider
 */
router.post('/test/:provider', async (req, res) => {
    try {
        const { provider } = req.params;
        const { prompt = "Hello, how are you?", options = {} } = req.body;
        
        const response = await trinityProviderManager.generateResponse(prompt, {
            ...options,
            provider
        });
        
        res.json({
            success: true,
            provider,
            response,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`❌ Failed to test provider ${req.params.provider}:`, error);
        res.status(500).json({
            success: false,
            error: error.message,
            provider: req.params.provider
        });
    }
});

/**
 * Get provider recommendations for a query
 */
router.post('/recommend', async (req, res) => {
    try {
        const { prompt, preferences = {} } = req.body;
        
        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: 'Prompt is required for recommendations'
            });
        }

        // Analyze prompt complexity
        const complexity = analyzeComplexity(prompt);
        
        // Get provider recommendations
        const providers = trinityProviderManager.getProviderInfo();
        const recommendations = providers.map(provider => ({
            name: provider.name,
            cost: provider.cost,
            speed: provider.speed,
            useCase: provider.useCase,
            available: provider.available,
            suitability: calculateSuitability(provider, complexity, preferences)
        })).sort((a, b) => b.suitability - a.suitability);
        
        res.json({
            success: true,
            prompt_complexity: complexity,
            recommendations,
            optimal_provider: recommendations[0],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Failed to get recommendations:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Batch testing across all providers
 */
router.post('/batch-test', async (req, res) => {
    try {
        const { prompt = "Explain AI in simple terms", options = {} } = req.body;
        
        const providers = ['groq', 'together-ai', 'huggingface', 'openrouter', 'anyscale', 'fireworks-ai'];
        const results = [];
        
        for (const provider of providers) {
            try {
                const startTime = Date.now();
                const response = await trinityProviderManager.generateResponse(prompt, {
                    ...options,
                    provider
                });
                const totalLatency = Date.now() - startTime;
                
                results.push({
                    provider,
                    success: response.success,
                    latency: totalLatency,
                    cost: response.cost || 0,
                    content_length: response.content?.length || 0,
                    error: response.error || null
                });
            } catch (error) {
                results.push({
                    provider,
                    success: false,
                    latency: 0,
                    cost: 0,
                    content_length: 0,
                    error: error.message
                });
            }
        }
        
        // Calculate comparison metrics
        const successful = results.filter(r => r.success);
        const fastest = successful.reduce((prev, curr) => 
            prev.latency < curr.latency ? prev : curr, successful[0] || {});
        const cheapest = successful.reduce((prev, curr) => 
            prev.cost < curr.cost ? prev : curr, successful[0] || {});
        
        res.json({
            success: true,
            test_prompt: prompt,
            results,
            summary: {
                total_providers: providers.length,
                successful_providers: successful.length,
                fastest_provider: fastest?.provider || null,
                cheapest_provider: cheapest?.provider || null,
                avg_latency: successful.length > 0 ? 
                    successful.reduce((sum, r) => sum + r.latency, 0) / successful.length : 0,
                total_cost: successful.reduce((sum, r) => sum + r.cost, 0)
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Failed to run batch test:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Helper functions
function analyzeComplexity(prompt: string): 'simple' | 'medium' | 'complex' {
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

function calculateSuitability(provider: any, complexity: string, preferences: any): number {
    let score = 0;
    
    // Base availability score
    if (provider.available) score += 30;
    
    // Cost preference scoring
    if (preferences.preferFree && provider.cost.includes('$0')) {
        score += 25;
    } else if (!preferences.preferFree && provider.cost.includes('$0.0002')) {
        score += 20; // Together AI gets points for reasonable cost
    }
    
    // Speed/complexity matching
    if (complexity === 'simple' && provider.speed === 'Ultra-fast') score += 20;
    if (complexity === 'medium' && provider.speed === 'Fast') score += 20;
    if (complexity === 'complex' && provider.useCase.includes('experimentation')) score += 15;
    
    // Provider-specific bonuses
    if (provider.name === 'Groq' && complexity === 'simple') score += 15;
    if (provider.name === 'Together AI' && complexity === 'medium') score += 15;
    if (provider.name === 'Hugging Face' && preferences.experimentalModels) score += 15;
    
    return score;
}

export default router;