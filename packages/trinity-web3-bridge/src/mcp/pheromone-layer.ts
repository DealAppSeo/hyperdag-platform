/**
 * @title Graceful Pheromone Layer
 * @dev Implements Ant Colony Optimization (ACO) on the HyperDAG.
 * Pheromone evaporation rate varies by user tier (Grace-based decay).
 */

export class GracefulPheromoneLayer {
    private pheromones: Map<string, { strength: number; lastDeposit: number; depositorTier: string }> = new Map();

    /**
     * Evaporation rate: Higher tiers are held to a higher standard (faster decay).
     */
    private getEvaporationRate(userTier: string): number {
        const rates: Record<string, number> = {
            'Canopy': 0.15,
            'Forest': 0.12,
            'Grove': 0.10,
            'Sapling': 0.05,
            'Seedling': 0.02 // Maximum grace for new users
        };
        return rates[userTier] || 0.10;
    }

    /**
     * Deposits pheromone on a successful path, weighted by WETE and Ethics.
     */
    deposit(pathId: string, weteScore: number, ethicsWeight: number, userTier: string): void {
        const existing = this.pheromones.get(pathId) || { strength: 0, lastDeposit: 0, depositorTier: userTier };
        const depositAmount = weteScore * ethicsWeight;

        this.pheromones.set(pathId, {
            strength: existing.strength + depositAmount,
            lastDeposit: Date.now(),
            depositorTier: userTier
        });
    }

    /**
     * Epoch-based evaporation cycle.
     */
    evaporate(): void {
        for (const [pathId, trail] of this.pheromones) {
            const rate = this.getEvaporationRate(trail.depositorTier);
            trail.strength *= (1 - rate);

            if (trail.strength < 0.01) {
                this.pheromones.delete(pathId);
            }
        }
    }
}
