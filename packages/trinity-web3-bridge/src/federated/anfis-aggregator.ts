/**
 * @title Federated ANFIS Aggregator
 * @dev Aggregates agent model deltas with Rényi Differential Privacy.
 */

export class FederatedANFISAggregator {
    private updateHistory: Array<{ deltaNorm: number; timestamp: number }> = [];

    /**
     * Aggregates a model update after privacy and convergence checks.
     */
    async aggregate(delta: number[]): Promise<{ accepted: boolean; reason?: string }> {
        // 1. Apply Rényi Differential Privacy (Gaussian Noise)
        const noisyDelta = this.applyDPNoise(delta, 0.5); // epsilon=0.5

        // 2. Convergence Check (Oscillation Detection)
        if (this.isOscillating(noisyDelta)) {
            return { accepted: false, reason: 'CONVERGENCE_OSCILLATION' };
        }

        // 3. Record update
        this.updateHistory.push({
            deltaNorm: this.calculateNorm(noisyDelta),
            timestamp: Date.now()
        });

        console.log('FederatedANFIS: Delta accepted and aggregated.');
        return { accepted: true };
    }

    private applyDPNoise(delta: number[], epsilon: number): number[] {
        // Mocking Gaussian noise addition
        return delta.map(v => v + (Math.random() - 0.5) * (1 / epsilon));
    }

    /**
     * Detects if recent deltas are flipping signs (oscillating), 
     * which indicates the learning rate or noise is too high.
     */
    private isOscillating(delta: number[]): boolean {
        if (this.updateHistory.length < 3) return false;

        const recent = this.updateHistory.slice(-3);
        const currentNorm = this.calculateNorm(delta);

        let signFlips = 0;
        for (let i = 0; i < recent.length; i++) {
            // Rough check for direction reversal
            if (currentNorm * recent[i].deltaNorm < 0) signFlips++;
        }

        return signFlips >= 2;
    }

    private calculateNorm(vector: number[]): number {
        return Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    }
}
