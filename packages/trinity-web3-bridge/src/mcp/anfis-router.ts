import { FuzzyInferenceSystem, FuzzyRule } from './anfis-core';

/**
 * @title ANFIS MCP Router
 * @dev Implements Adaptive Neuro-Fuzzy Inference System for intelligent tool routing.
 * Optimizes token usage by selecting only the most relevant tools based on ethical principles (Phil 4:8).
 */

export interface RoutingContext {
    query: string;
    userRepID: number;
    energyMode: 'full' | 'balanced' | 'saver';
}

export interface ToolCandidate {
    name: string;
    server: string;
    costPerCall: number;
    avgLatencyMs: number;
    successRate: number; // Reliability from RepID or metrics
    embedding?: number[];
}

export interface ToolScore {
    toolId: string;
    serverId: string;
    anfisScore: number;
    inputs: Record<string, number>;
}

export interface ToolMetrics {
    totalCalls: number;
    successCount: number;
    avgLatency: number;
    lastUpdated: number;
}

export class ANFISMCPRouter {
    private fis: FuzzyInferenceSystem;
    private toolMetrics: Map<string, ToolMetrics> = new Map();
    private lambda: number = 0.1;

    constructor() {
        this.fis = new FuzzyInferenceSystem({
            inputs: ['relevance', 'cost', 'latency', 'reliability'],
            output: 'priority',
            rules: this.initPhilippians48Rules()
        });
    }

    /**
     * Real ANFIS scoring using fuzzy membership functions.
     */
    async selectTools(context: RoutingContext, candidates: ToolCandidate[]): Promise<ToolScore[]> {
        console.log(`ANFIS: Evaluating ${candidates.length} tools for query: "${context.query}"`);

        const scored = candidates.map(tool => {
            // Note: In a full implementation, we'd compute semantic relevance here using embeddings.
            // For now, we assume relevance is passed in or derived.
            const metrics = this.toolMetrics.get(`${tool.server}:${tool.name}`);

            const inputs = {
                relevance: 0.8, // Placeholder for semantic similarity
                cost: this.normalizeCost(tool.costPerCall),
                latency: this.normalizeLatency(metrics?.avgLatency || tool.avgLatencyMs),
                reliability: metrics ? (metrics.successCount / metrics.totalCalls) : tool.successRate
            };

            const anfisScore = this.fis.evaluate(inputs);

            return {
                toolId: tool.name,
                serverId: tool.server,
                anfisScore,
                inputs
            };
        });

        // Apply LASSO regularization for sparsity
        const lambdaAdjusted = context.energyMode === 'saver' ? this.lambda * 2 : this.lambda;

        return scored
            .filter(score => score.anfisScore > lambdaAdjusted)
            .sort((a, b) => b.anfisScore - a.anfisScore)
            .slice(0, 10);
    }

    /**
     * Update tool reliability scores based on execution results (The Feedback Loop).
     */
    async recordOutcome(
        toolId: string,
        serverId: string,
        success: boolean,
        latencyMs: number
    ): Promise<void> {
        const key = `${serverId}:${toolId}`;
        let metrics = this.toolMetrics.get(key) || {
            totalCalls: 0,
            successCount: 0,
            avgLatency: 0,
            lastUpdated: Date.now()
        };

        // Exponential moving average for latency
        const alpha = 0.1;
        metrics.avgLatency = metrics.avgLatency * (1 - alpha) + latencyMs * alpha;
        metrics.totalCalls++;
        if (success) metrics.successCount++;
        metrics.lastUpdated = Date.now();

        this.toolMetrics.set(key, metrics);

        const reliability = metrics.successCount / metrics.totalCalls;
        if (reliability < 0.7 && metrics.totalCalls > 10) {
            console.warn(`⚠️ Tool ${toolId} reliability dropped to ${(reliability * 100).toFixed(1)}%`);
        }
    }

    private initPhilippians48Rules(): FuzzyRule[] {
        return [
            {
                name: 'truth_rule',
                condition: (inputs) =>
                    this.fis.membership('reliability', 'high', inputs.reliability) *
                    this.fis.membership('relevance', 'high', inputs.relevance),
                consequence: 'very_high',
                weight: 1.0
            },
            {
                name: 'honor_rule',
                condition: (inputs) =>
                    this.fis.membership('cost', 'low', inputs.cost) *
                    this.fis.membership('relevance', 'medium', inputs.relevance),
                consequence: 'high',
                weight: 0.9
            },
            {
                name: 'justice_rule',
                condition: (inputs) =>
                    this.fis.membership('reliability', 'low', inputs.reliability),
                consequence: 'very_low',
                weight: 0.95
            },
            {
                name: 'excellence_rule',
                condition: (inputs) =>
                    this.fis.membership('latency', 'low', inputs.latency) *
                    this.fis.membership('reliability', 'high', inputs.reliability),
                consequence: 'high',
                weight: 0.85
            }
        ];
    }

    private normalizeCost(cost: number): number {
        return Math.min(cost / 0.1, 1.0); // Simple normalization
    }

    private normalizeLatency(latency: number): number {
        return Math.min(latency / 2000, 1.0); // Normalize to 2 seconds
    }
}
