/**
 * Perplexity AI Provider Implementation
 * 
 * This provider integrates the Perplexity AI service into the redundancy layer.
 */

import OpenAI from 'openai';
import {
  AIProvider,
  AITextGenerationOptions,
  AITextGenerationResult,
  AIFunctionCallingOptions,
  AIFunctionCallResult,
  AIFunctionParams,
  Message,
  AIUsage
} from './types';

// Default model to use
const DEFAULT_MODEL = 'llama-3.1-sonar-small-128k-online';

export class PerplexityProvider implements AIProvider {
  public readonly name = 'Perplexity';
  private client: OpenAI;
  
  constructor() {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY environment variable is not set');
    }
    
    // Perplexity uses OpenAI-compatible SDK
    this.client = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai'
    });
  }
  
  /**
   * Check if the provider is available
   */
  public async isAvailable(): Promise<boolean> {
    try {
      // Make a minimal request to check if the API is working
      const response = await this.client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 1
      });
      
      return !!response;
    } catch (error) {
      console.error(`Perplexity provider availability check failed: ${error}`);
      return false;
    }
  }
  
  /**
   * Generate text completion from a prompt
   */
  public async generateTextCompletion(
    prompt: string,
    options?: AITextGenerationOptions
  ): Promise<AITextGenerationResult> {
    try {
      const systemPrompt = options?.systemPrompt || 'Be precise and concise.';
      
      // Format the request with appropriate parameters
      const response = await this.client.chat.completions.create({
        model: options?.model || DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens,
        top_p: options?.topP ?? 0.9,
        frequency_penalty: 1.0,
        presence_penalty: 0.0,
        response_format: options?.responseFormat === 'json' 
          ? { type: 'json_object' } 
          : undefined,
        stream: options?.stream ?? false
      });
      
      // Process the response
      const text = response.choices[0]?.message?.content || '';
      
      // Format usage data
      const usage: AIUsage = {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      };
      
      return {
        text,
        model: response.model || DEFAULT_MODEL,
        usage
      };
    } catch (error) {
      console.error(`Perplexity text completion error: ${error}`);
      throw new Error(`Failed to generate text with Perplexity: ${error}`);
    }
  }
  
  /**
   * Generate chat completion from a conversation
   */
  public async generateChatCompletion(
    messages: Message[],
    options?: AITextGenerationOptions
  ): Promise<AITextGenerationResult> {
    try {
      // Convert messages to the format expected by Perplexity
      const perplexityMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Format the request with appropriate parameters
      const response = await this.client.chat.completions.create({
        model: options?.model || DEFAULT_MODEL,
        messages: perplexityMessages,
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens,
        top_p: options?.topP ?? 0.9,
        frequency_penalty: 1.0,
        presence_penalty: 0.0,
        response_format: options?.responseFormat === 'json' 
          ? { type: 'json_object' } 
          : undefined,
        stream: options?.stream ?? false
      });
      
      // Process the response
      const text = response.choices[0]?.message?.content || '';
      
      // Format usage data
      const usage: AIUsage = {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      };
      
      return {
        text,
        model: response.model || DEFAULT_MODEL,
        usage
      };
    } catch (error) {
      console.error(`Perplexity chat completion error: ${error}`);
      throw new Error(`Failed to generate chat completion with Perplexity: ${error}`);
    }
  }
  
  /**
   * Call an AI function
   */
  public async callFunction(
    function_name: string,
    parameters: AIFunctionParams,
    prompt: string,
    options?: AIFunctionCallingOptions
  ): Promise<AIFunctionCallResult> {
    try {
      // Perplexity doesn't fully support function calling in the same way as OpenAI
      // So we'll format the function call request as a structured prompt
      
      // Build a JSON schema from the parameters
      const functionSchema = {
        name: function_name,
        description: `Execute the ${function_name} function with the provided parameters.`,
        parameters: {
          type: 'object',
          properties: parameters,
          required: Object.keys(parameters)
        }
      };
      
      // Create a prompt that requests JSON output in the specific format
      const systemPrompt = options?.systemPrompt || 
        `You are an AI assistant that can call functions. When responding, you must provide ONLY a valid JSON object matching the schema for the '${function_name}' function. The output must be valid parseable JSON.`;
      
      const structuredPrompt = 
        `Please execute the function '${function_name}' based on the following request: "${prompt}"\n\n` +
        `Function schema: ${JSON.stringify(functionSchema, null, 2)}\n\n` +
        `Your response must be a valid JSON object matching the function parameters.`;
      
      // Make the request with JSON formatting
      const response = await this.client.chat.completions.create({
        model: options?.model || DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: structuredPrompt }
        ],
        temperature: options?.temperature ?? 0.1, // Lower temperature for more predictable function output
        max_tokens: options?.maxTokens,
        top_p: options?.topP ?? 0.9,
        response_format: { type: 'json_object' },
        stream: options?.stream ?? false
      });
      
      // Extract and parse the JSON response
      const responseText = response.choices[0]?.message?.content || '{}';
      let parsedArguments: any;
      
      try {
        parsedArguments = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`Failed to parse Perplexity function response as JSON: ${parseError}`);
        throw new Error('Failed to parse function response as JSON');
      }
      
      return {
        name: function_name,
        arguments: parsedArguments,
        model: response.model || DEFAULT_MODEL
      };
    } catch (error) {
      console.error(`Perplexity function calling error: ${error}`);
      throw new Error(`Failed to call function with Perplexity: ${error}`);
    }
  }
}