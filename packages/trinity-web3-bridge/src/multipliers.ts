/**
 * @title Trinity Multipliers
 * @dev Logic for calculating reputation bonuses based on agent tiers and ZKP status.
 */
export class TrinityMultipliers {
    /**
     * @dev Calculates the multiplier based on the agent's tier.
     */
    static getTierMultiplier(tier: 'seedling' | 'sapling' | 'grove' | 'forest' | 'canopy'): number {
        switch (tier) {
            case 'canopy': return 2.5;
            case 'forest': return 2.0;
            case 'grove': return 1.5;
            case 'sapling': return 1.2;
            case 'seedling': return 1.0;
            default: return 1.0;
        }
    }

    /**
     * @dev Returns an additional bonus if the agent has a verified ZKP.
     */
    static async getZkpBonus(agentId: string): Promise<number> {
        // Stub for checking ZKP status from the hyperdag-protocol contracts
        console.log(`Checking ZKP bonus for agent ${agentId}...`);
        return 0.1; // 10% bonus for being ZKP verified
    }

    /**
     * @dev Calculates the final score multiplier.
     * Enforces the 30-day minimum period before multipliers activate for Silver/Gold tiers.
     */
    static async calculateFinalMultiplier(
        agentId: string,
        tier: 'seedling' | 'sapling' | 'grove' | 'forest' | 'canopy',
        activationDate: number // Unix timestamp
    ): Promise<number> {
        const now = Date.now() / 1000;
        const thirtyDays = 30 * 24 * 60 * 60;

        let multiplier = 1.0;

        // Only apply tier multiplier if the 30-day activation period has passed
        if (now - activationDate >= thirtyDays) {
            multiplier = this.getTierMultiplier(tier);
        } else {
            console.log(`Activation period in progress for agent ${agentId}. Multiplier remains 1.0x`);
        }

        const zkpBonus = await this.getZkpBonus(agentId);
        return multiplier + zkpBonus;
    }
}
