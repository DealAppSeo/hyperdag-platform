/**
 * AI Service Types
 * 
 * This file defines the interfaces and types used by the AI service redundancy module.
 * Includes smart routing capabilities for cost and performance optimization.
 */

// Role types for messages in a conversation
export type MessageRole = 'system' | 'user' | 'assistant' | 'function';

// Message in a conversation
export interface Message {
  role: MessageRole;
  content: string | Array<{type: string, text?: string, image_url?: {url: string}}> | null;
  name?: string; // For function messages
  function_call?: {
    name: string;
    arguments: string;
  };
}

// Usage statistics for an AI request
export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Options for text generation
export interface AITextGenerationOptions {
  // Model-specific options
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  systemPrompt?: string;
  stopSequences?: string[];
  stream?: boolean;
  responseFormat?: 'text' | 'json';
  
  // Smart routing options
  priority?: number; // 0-10, where 10 is highest priority
  timeout?: number; // Maximum acceptable latency in ms
  preferFreeTier?: boolean; // Whether to prefer providers with free quota remaining
  preferredProviders?: string[]; // List of preferred providers
  excludedProviders?: string[]; // List of providers to exclude
}

// Result of a text generation
export interface AITextGenerationResult {
  text: string;
  model: string;
  provider?: string;
  usage: AIUsage;
  functionCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
  }>;
}

// Parameter types for function calling
export type AIFunctionParamType = 'string' | 'number' | 'boolean' | 'object' | 'array';

// Parameter definitions for functions
export interface AIFunctionParams {
  [key: string]: {
    type: AIFunctionParamType;
    description?: string;
    enum?: string[];
    required?: boolean;
    default?: any;
    items?: {
      type: AIFunctionParamType;
    };
    properties?: Record<string, AIFunctionParams>;
  };
}

// Options for function calling
export interface AIFunctionCallingOptions extends AITextGenerationOptions {
  forceFunctionCall?: boolean;
  maxResponseTokens?: number;
}

// Result of a function call
export interface AIFunctionCallResult {
  name: string;
  arguments: Record<string, any>;
  model: string;
  provider?: string;
  result?: any;
  usage?: AIUsage;
}

// Provider status type
export type ProviderStatus = 'available' | 'degraded' | 'unavailable';

// Interface that all AI providers must implement
export interface AIProvider {
  readonly name: string;
  readonly features: string[];
  readonly modelName: string;
  readonly status: ProviderStatus;
  
  // Check if the provider is available
  checkStatus(): Promise<ProviderStatus>;
  
  // Generate text from a prompt
  generateTextCompletion(
    prompt: string,
    options?: AITextGenerationOptions
  ): Promise<AITextGenerationResult>;
  
  // Generate chat completion from a conversation
  generateChatCompletion(
    messages: Message[],
    options?: AITextGenerationOptions
  ): Promise<AITextGenerationResult>;
  
  // Call a function with parameters
  callFunction(
    name: string,
    parameters: AIFunctionParams,
    prompt: string,
    options?: AIFunctionCallingOptions
  ): Promise<AIFunctionCallResult>;
}