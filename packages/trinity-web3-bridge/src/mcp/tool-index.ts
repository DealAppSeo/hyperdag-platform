import { OpenAI } from 'openai';

/**
 * @title Tool Index
 * @dev Manages semantic tool discovery using OpenAI embeddings.
 */

export interface ToolCandidate {
    serverId: string;
    toolId: string;
    relevance: number;
}

export class ToolIndex {
    private embeddings: Map<string, number[]> = new Map();
    private openai: OpenAI;

    constructor() {
        // In a real environment, this API key would be loaded from process.env
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'sk-stub' });
    }

    /**
     * Index tools from an MCP server.
     */
    async indexTools(serverId: string, tools: any[]): Promise<void> {
        for (const tool of tools) {
            const text = `${tool.name}: ${tool.description}`;
            const embedding = await this.embed(text);
            this.embeddings.set(`${serverId}:${tool.name}`, embedding);
        }
        console.log(`Indexed ${tools.length} tools for server ${serverId}`);
    }

    /**
     * Semantic search for relevant tools.
     */
    async search(query: string, limit: number = 50): Promise<ToolCandidate[]> {
        const queryEmbedding = await this.embed(query);
        const scores: Array<{ key: string; score: number }> = [];

        for (const [key, embedding] of this.embeddings) {
            const score = this.cosineSimilarity(queryEmbedding, embedding);
            scores.push({ key, score });
        }

        return scores
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(({ key, score }) => {
                const [serverId, toolId] = key.split(':');
                return { serverId, toolId, relevance: score };
            });
    }

    private async embed(text: string): Promise<number[]> {
        try {
            const response = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: text
            });
            return response.data[0].embedding;
        } catch (error) {
            console.error('Embedding error:', error);
            // Return a zero vector stub on failure
            return new Array(1536).fill(0);
        }
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        let dotProduct = 0, normA = 0, normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
