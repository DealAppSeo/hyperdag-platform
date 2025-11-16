/**
 * Advanced Prompt Analyzer - Enhanced NLP Pipeline
 * Implements spaCy-like functionality with advanced intent classification and complexity scoring
 */

interface PromptAnalysis {
  entities: Array<{ text: string; label: string; confidence: number }>;
  intent: {
    classification: string;
    confidence: number;
    subIntents: string[];
  };
  complexity: {
    score: number;
    factors: {
      syntactic: number;
      semantic: number;
      pragmatic: number;
      computational: number;
    };
  };
  dependencies: Array<{ source: string; target: string; relation: string }>;
  requiredCapabilities: string[];
  multiModal: {
    hasImageReference: boolean;
    hasAudioReference: boolean;
    hasVideoReference: boolean;
    hasCodeBlocks: boolean;
    hasMathContent: boolean;
  };
}

export class AdvancedPromptAnalyzer {
  private intentClassifiers: Map<string, any> = new Map();
  private complexityScorer: ComplexityScorer;
  private entityExtractor: EntityExtractor;
  private dependencyParser: DependencyParser;

  constructor() {
    this.complexityScorer = new ComplexityScorer();
    this.entityExtractor = new EntityExtractor();
    this.dependencyParser = new DependencyParser();
    this.initializeClassifiers();
  }

  private initializeClassifiers() {
    // Initialize intent classification models
    this.intentClassifiers.set('general', {
      categories: ['question', 'instruction', 'creative', 'analytical', 'conversational'],
      weights: new Map([
        ['question', ['what', 'how', 'why', 'when', 'where', 'who', '?']],
        ['instruction', ['create', 'generate', 'build', 'make', 'write', 'develop']],
        ['creative', ['story', 'poem', 'creative', 'imaginative', 'artistic']],
        ['analytical', ['analyze', 'compare', 'evaluate', 'assess', 'examine']],
        ['conversational', ['hello', 'hi', 'thanks', 'please', 'chat']]
      ])
    });

    this.intentClassifiers.set('technical', {
      categories: ['coding', 'debugging', 'architecture', 'optimization', 'research'],
      weights: new Map([
        ['coding', ['code', 'function', 'class', 'algorithm', 'implementation']],
        ['debugging', ['error', 'bug', 'fix', 'troubleshoot', 'issue']],
        ['architecture', ['design', 'structure', 'pattern', 'framework', 'system']],
        ['optimization', ['optimize', 'improve', 'enhance', 'performance', 'efficiency']],
        ['research', ['research', 'study', 'investigate', 'explore', 'discover']]
      ])
    });
  }

  async analyze(prompt: string, context?: string): Promise<PromptAnalysis> {
    const startTime = Date.now();
    
    // Parallel analysis for performance
    const [
      entities,
      intent,
      complexity,
      dependencies,
      capabilities,
      multiModal
    ] = await Promise.all([
      this.extractEntities(prompt),
      this.classifyIntent(prompt, context),
      this.scoreComplexity(prompt, context),
      this.parseDependencies(prompt),
      this.identifyCapabilities(prompt),
      this.analyzeMultiModal(prompt)
    ]);

    console.log(`[PromptAnalyzer] Analysis completed in ${Date.now() - startTime}ms`);

    return {
      entities,
      intent,
      complexity,
      dependencies,
      requiredCapabilities: capabilities,
      multiModal
    };
  }

  private async extractEntities(prompt: string): Promise<Array<{ text: string; label: string; confidence: number }>> {
    return this.entityExtractor.extract(prompt);
  }

  private async classifyIntent(prompt: string, context?: string): Promise<PromptAnalysis['intent']> {
    const promptLower = prompt.toLowerCase();
    const words = promptLower.split(/\s+/);
    
    // Multi-level classification
    const generalScores = this.calculateIntentScores(words, 'general');
    const technicalScores = this.calculateIntentScores(words, 'technical');
    
    // Determine primary intent
    const allScores = { ...generalScores, ...technicalScores };
    const primaryIntent = Object.entries(allScores)
      .sort(([, a], [, b]) => b - a)[0];
    
    // Identify sub-intents
    const subIntents = Object.entries(allScores)
      .filter(([intent, score]) => intent !== primaryIntent[0] && score > 0.3)
      .map(([intent]) => intent);

    return {
      classification: primaryIntent[0],
      confidence: Math.min(primaryIntent[1], 0.95),
      subIntents
    };
  }

  private calculateIntentScores(words: string[], classifier: string): Record<string, number> {
    const classifierData = this.intentClassifiers.get(classifier);
    if (!classifierData) return {};

    const scores: Record<string, number> = {};
    
    for (const [category, keywords] of classifierData.weights.entries()) {
      let score = 0;
      for (const word of words) {
        if (keywords.includes(word)) {
          score += 1 / keywords.length; // Normalize by keyword frequency
        }
      }
      scores[category] = Math.min(score, 1.0);
    }

    return scores;
  }

  private async scoreComplexity(prompt: string, context?: string): Promise<PromptAnalysis['complexity']> {
    return this.complexityScorer.score(prompt, context);
  }

  private async parseDependencies(prompt: string): Promise<Array<{ source: string; target: string; relation: string }>> {
    return this.dependencyParser.parse(prompt);
  }

  private async identifyCapabilities(prompt: string): Promise<string[]> {
    const capabilities: string[] = [];
    const promptLower = prompt.toLowerCase();

    // Capability mapping
    const capabilityPatterns = {
      'text_generation': ['write', 'generate', 'create', 'compose'],
      'code_generation': ['code', 'program', 'script', 'function', 'class'],
      'analysis': ['analyze', 'examine', 'evaluate', 'assess', 'compare'],
      'reasoning': ['explain', 'why', 'because', 'logic', 'reason'],
      'creativity': ['creative', 'story', 'poem', 'art', 'imaginative'],
      'research': ['research', 'find', 'search', 'investigate', 'study'],
      'mathematics': ['calculate', 'solve', 'math', 'equation', 'formula'],
      'translation': ['translate', 'language', 'convert', 'interpret'],
      'summarization': ['summarize', 'summary', 'brief', 'overview'],
      'classification': ['classify', 'categorize', 'sort', 'group'],
      'multimodal': ['image', 'picture', 'video', 'audio', 'visual'],
      'real_time': ['current', 'latest', 'now', 'today', 'recent'],
      'long_context': prompt.length > 2000 ? ['long_context'] : []
    };

    for (const [capability, patterns] of Object.entries(capabilityPatterns)) {
      if (patterns.some(pattern => promptLower.includes(pattern))) {
        capabilities.push(capability);
      }
    }

    return capabilities;
  }

  private async analyzeMultiModal(prompt: string): Promise<PromptAnalysis['multiModal']> {
    const promptLower = prompt.toLowerCase();
    
    return {
      hasImageReference: /image|picture|photo|visual|graph|chart|diagram/.test(promptLower),
      hasAudioReference: /audio|sound|music|voice|speech/.test(promptLower),
      hasVideoReference: /video|movie|clip|animation/.test(promptLower),
      hasCodeBlocks: /```|code|function|class|algorithm/.test(prompt),
      hasMathContent: /\$.*\$|\\[|\\]|equation|formula|calculate/.test(prompt)
    };
  }
}

class ComplexityScorer {
  score(prompt: string, context?: string): PromptAnalysis['complexity'] {
    const syntactic = this.scoreSyntactic(prompt);
    const semantic = this.scoreSemantic(prompt);
    const pragmatic = this.scorePragmatic(prompt, context);
    const computational = this.scoreComputational(prompt);

    const overallScore = (syntactic + semantic + pragmatic + computational) / 4;

    return {
      score: Math.min(overallScore, 1.0),
      factors: { syntactic, semantic, pragmatic, computational }
    };
  }

  private scoreSyntactic(prompt: string): number {
    const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = prompt.split(/\s+/).length / sentences.length;
    const nestedStructures = (prompt.match(/[\(\[\{]/g) || []).length;
    
    // Normalize complexity factors
    const lengthScore = Math.min(prompt.length / 1000, 1);
    const structureScore = Math.min(avgWordsPerSentence / 20, 1);
    const nestingScore = Math.min(nestedStructures / 10, 1);

    return (lengthScore + structureScore + nestingScore) / 3;
  }

  private scoreSemantic(prompt: string): number {
    const uniqueWords = new Set(prompt.toLowerCase().split(/\s+/)).size;
    const totalWords = prompt.split(/\s+/).length;
    const lexicalDiversity = uniqueWords / totalWords;
    
    const technicalTerms = ['algorithm', 'optimization', 'neural', 'quantum', 'blockchain'];
    const technicalScore = technicalTerms.filter(term => 
      prompt.toLowerCase().includes(term)).length / technicalTerms.length;

    const abstractConcepts = ['analyze', 'synthesize', 'evaluate', 'conceptualize'];
    const abstractScore = abstractConcepts.filter(concept => 
      prompt.toLowerCase().includes(concept)).length / abstractConcepts.length;

    return (lexicalDiversity + technicalScore + abstractScore) / 3;
  }

  private scorePragmatic(prompt: string, context?: string): number {
    const hasContext = context && context.length > 0;
    const multiStep = /first|then|next|finally|step/.test(prompt.toLowerCase());
    const conditional = /if|when|unless|depending/.test(prompt.toLowerCase());
    const comparative = /compare|contrast|versus|better|worse/.test(prompt.toLowerCase());

    let score = 0;
    if (hasContext) score += 0.25;
    if (multiStep) score += 0.25;
    if (conditional) score += 0.25;
    if (comparative) score += 0.25;

    return score;
  }

  private scoreComputational(prompt: string): number {
    const dataProcessing = /process|analyze|compute|calculate/.test(prompt.toLowerCase());
    const largeScale = /large|big|massive|scale|million|billion/.test(prompt.toLowerCase());
    const realTime = /real.time|instant|immediate|fast/.test(prompt.toLowerCase());
    const iterative = /loop|iterate|repeat|recursive/.test(prompt.toLowerCase());

    let score = 0;
    if (dataProcessing) score += 0.25;
    if (largeScale) score += 0.25;
    if (realTime) score += 0.25;
    if (iterative) score += 0.25;

    return score;
  }
}

class EntityExtractor {
  async extract(prompt: string): Promise<Array<{ text: string; label: string; confidence: number }>> {
    const entities: Array<{ text: string; label: string; confidence: number }> = [];
    
    // Named Entity Recognition patterns
    const patterns = {
      'PERSON': /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
      'ORGANIZATION': /\b(Inc|Corp|Ltd|LLC|Company|Organization)\b/gi,
      'LOCATION': /\b(City|Country|State|Province|Region)\s+[A-Z][a-z]+/gi,
      'DATE': /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b(today|tomorrow|yesterday)\b/gi,
      'NUMBER': /\b\d+(\.\d+)?\b/g,
      'EMAIL': /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      'URL': /https?:\/\/[^\s]+/g,
      'TECHNOLOGY': /\b(AI|ML|blockchain|quantum|neural|deep learning|machine learning)\b/gi
    };

    for (const [label, pattern] of Object.entries(patterns)) {
      const matches = prompt.match(pattern);
      if (matches) {
        matches.forEach(match => {
          entities.push({
            text: match,
            label,
            confidence: 0.8 + Math.random() * 0.15 // Simulated confidence
          });
        });
      }
    }

    return entities;
  }
}

class DependencyParser {
  async parse(prompt: string): Promise<Array<{ source: string; target: string; relation: string }>> {
    const dependencies: Array<{ source: string; target: string; relation: string }> = [];
    const sentences = prompt.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/);
      
      // Simple dependency parsing patterns
      for (let i = 0; i < words.length - 1; i++) {
        const currentWord = words[i].toLowerCase();
        const nextWord = words[i + 1].toLowerCase();
        
        // Subject-verb patterns
        if (this.isNoun(currentWord) && this.isVerb(nextWord)) {
          dependencies.push({
            source: words[i],
            target: words[i + 1],
            relation: 'subject-verb'
          });
        }
        
        // Modifier-noun patterns
        if (this.isAdjective(currentWord) && this.isNoun(nextWord)) {
          dependencies.push({
            source: words[i],
            target: words[i + 1],
            relation: 'modifier-noun'
          });
        }
      }
    }
    
    return dependencies;
  }

  private isNoun(word: string): boolean {
    const nouns = ['system', 'model', 'data', 'algorithm', 'network', 'user', 'task'];
    return nouns.includes(word) || /ing$/.test(word);
  }

  private isVerb(word: string): boolean {
    const verbs = ['create', 'generate', 'analyze', 'process', 'optimize', 'improve'];
    return verbs.includes(word) || /s$/.test(word);
  }

  private isAdjective(word: string): boolean {
    const adjectives = ['advanced', 'intelligent', 'optimal', 'efficient', 'complex'];
    return adjectives.includes(word) || /ly$/.test(word);
  }
}

export const advancedPromptAnalyzer = new AdvancedPromptAnalyzer();