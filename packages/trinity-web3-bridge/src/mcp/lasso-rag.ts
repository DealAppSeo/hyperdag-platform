/**
 * @title LASSO RAG Selector
 * @dev Minimizes token usage while maximizing information density for context retrieval.
 */

export interface ContextChunk {
    content: string;
    relevance: number;
    tokenCount: number;
}

export class LASSORAGSelector {
    /**
     * Selects optimal context chunks using LASSO-style regularization (L1 penalty).
     */
    selectContext(candidates: ContextChunk[], maxTokens: number): ContextChunk[] {
        const lambda = 0.05; // Penalty per chunk to encourage sparsity
        const selected: ContextChunk[] = [];
        let usedTokens = 0;

        // Sort by "Efficiency" (Relevance per Token)
        const sorted = [...candidates].sort((a, b) => (b.relevance / b.tokenCount) - (a.relevance / a.tokenCount));

        for (const chunk of sorted) {
            const marginalRelevance = chunk.relevance - (lambda * selected.length);

            if (marginalRelevance > 0 && usedTokens + chunk.tokenCount <= maxTokens) {
                selected.push(chunk);
                usedTokens += chunk.tokenCount;
            }
        }

        return selected;
    }
}
