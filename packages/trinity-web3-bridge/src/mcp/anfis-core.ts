/**
 * @title ANFIS Core Engine
 * @dev Implements a basic Fuzzy Inference System (FIS) for the ANFIS router.
 */

export interface FuzzyRule {
    name: string;
    condition: (inputs: Record<string, number>) => number;
    consequence: string;
    weight: number;
}

export type MembershipFunction = [number, number, number];

export class FuzzyInferenceSystem {
    private inputs: string[];
    private output: string;
    private rules: FuzzyRule[];

    constructor(config: {
        inputs: string[];
        output: string;
        rules: FuzzyRule[];
    }) {
        this.inputs = config.inputs;
        this.output = config.output;
        this.rules = config.rules;
    }

    /**
     * Evaluates inputs through the fuzzy rules and returns a crisp output priority (0-1).
     */
    evaluate(inputs: Record<string, number>): number {
        let weightedSum = 0;
        let totalWeight = 0;

        const consequencesMaps: Record<string, number> = {
            'very_low': 0.1,
            'low': 0.3,
            'medium': 0.5,
            'high': 0.8,
            'very_high': 1.0
        };

        for (const rule of this.rules) {
            const firingStrength = rule.condition(inputs);
            const consequenceValue = consequencesMaps[rule.consequence] || 0.5;

            weightedSum += firingStrength * rule.weight * consequenceValue;
            totalWeight += firingStrength * rule.weight;
        }

        return totalWeight === 0 ? 0.5 : weightedSum / totalWeight;
    }

    /**
     * Triangular membership function: returns degree of membership (0-1).
     */
    membership(variable: string, label: string, value: number): number {
        const mfs: Record<string, Record<string, MembershipFunction>> = {
            relevance: {
                low: [0, 0, 0.3],
                medium: [0.2, 0.5, 0.8],
                high: [0.7, 1.0, 1.0]
            },
            reliability: {
                low: [0, 0, 0.4],
                medium: [0.3, 0.6, 0.8],
                high: [0.7, 1.0, 1.0]
            },
            cost: {
                low: [0, 0, 0.3],
                medium: [0.2, 0.5, 0.7],
                high: [0.6, 1.0, 1.0]
            },
            latency: {
                low: [0, 0, 0.2],
                medium: [0.15, 0.4, 0.6],
                high: [0.5, 1.0, 1.0]
            }
        };

        if (!mfs[variable] || !mfs[variable][label]) return 0;

        const [a, b, c] = mfs[variable][label];

        if (value <= a || value >= c) return 0;
        if (value === b) return 1;
        if (value < b) return (value - a) / (b - a);
        return (c - value) / (c - b);
    }
}
