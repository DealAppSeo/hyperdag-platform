/**
 * @title Weighted Ethical Token Efficiency (WETE)
 * @dev Replaced ETE with a version that incentivizes reputation building while maintaining fairness.
 * Grounded in the formula: WETE = ETE × min(1 + log10(repID + 1), 2.5) × EthicsWeight
 */

export interface WETEParams {
    anfisPriority: number;
    repIdReliability: number;
    ethicsWeight: number;
    tokensUsed: number;
    toolCount: number;
    lambda: number;
    lastUsedMs: number;
    userRepID: number;
}

/**
 * Calculates the ETE with temporal decay.
 */
export function calculateETE(params: Omit<WETEParams, 'userRepID'>): number {
    const { anfisPriority, repIdReliability, ethicsWeight, tokensUsed, toolCount, lambda, lastUsedMs } = params;

    // Temporal decay: reliability degrades if tool hasn't been verified recently
    const hoursSinceUse = (Date.now() - lastUsedMs) / (1000 * 60 * 60);
    const decayFactor = Math.exp(-0.01 * hoursSinceUse); // Half-life ~70 hours

    const adjustedReliability = repIdReliability * decayFactor;

    const numerator = anfisPriority * Math.sqrt(adjustedReliability) * ethicsWeight;
    const denominator = tokensUsed + lambda * toolCount;

    return numerator / Math.max(denominator, 1);
}

/**
 * Calculates WETE with a diminishing returns cap for RepID weighting.
 */
export function calculateWETE(params: WETEParams): number {
    const { userRepID, ethicsWeight } = params;
    const ete = calculateETE(params);

    // RepID multiplier (capped at 2.5x per Claude's recommendation)
    const repMultiplier = Math.min(
        1 + Math.log10(userRepID + 1),
        2.5 // Canopy users (10,000) get ~2.0x, cap prevents runaway prioritization
    );

    return ete * repMultiplier * ethicsWeight;
}

/**
 * Fairness Ratio: Ensures seedling users get at least 40% of canopy-level priority.
 */
export function calculateFairnessRatio(seedlingWETE: number, canopyWETE: number): number {
    if (canopyWETE === 0) return 1.0;
    const ratio = seedlingWETE / canopyWETE;

    if (ratio < 0.4) {
        console.warn('⚠️ Trinity Fairness Alert: Resource allocation skewing away from Seedlings.');
    }

    return ratio;
}
