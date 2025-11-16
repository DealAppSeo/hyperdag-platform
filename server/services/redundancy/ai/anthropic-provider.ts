/**
 * Anthropic Provider Implementation
 * 
 * This provider integrates the Anthropic Claude service into the redundancy layer.
 */

import Anthropic from '@anthropic-ai/sdk';
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

// Default model to use - this is the newest model as of May 2025
const DEFAULT_MODEL = 'claude-3-7-sonnet-20250219';

export class AnthropicProvider implements AIProvider {
  public readonly name = 'Anthropic';
  private client: Anthropic;
  
  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: "https://anthropic.helicone.ai",
      defaultHeaders: {
        "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`
      }
    });
  }
  
  /**
   * Check if the provider is available
   */
  public async isAvailable(): Promise<boolean> {
    try {
      // Make a minimal request to check if the API is working
      await this.client.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hello' }]
      });
      
      return true;
    } catch (error) {
      console.error(`Anthropic provider availability check failed: ${error}`);
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
      const systemPrompt = options?.systemPrompt || 'You are Claude, a helpful AI assistant.';
      
      // Format the request with appropriate parameters
      const response = await this.client.messages.create({
        model: options?.model || DEFAULT_MODEL,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1024,
        top_p: options?.topP,
        stop_sequences: options?.stopSequences
      });
      
      // Extract the response content
      const content = response.content[0];
      const text = content.type === 'text' ? content.text : JSON.stringify(content);
      
      // Format usage data
      const usage: AIUsage = {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
      };
      
      return {
        text,
        model: response.model,
        usage
      };
    } catch (error) {
      console.error(`Anthropic text completion error: ${error}`);
      throw new Error(`Failed to generate text with Anthropic: ${error}`);
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
      const systemPrompt = options?.systemPrompt;
      
      // Anthropic expects a specific format for messages
      const anthropicMessages = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));
      
      // Format the request with appropriate parameters
      const response = await this.client.messages.create({
        model: options?.model || DEFAULT_MODEL,
        system: systemPrompt,
        messages: anthropicMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1024,
        top_p: options?.topP,
        stop_sequences: options?.stopSequences
      });
      
      // Extract the response content
      const content = response.content[0];
      const text = content.type === 'text' ? content.text : JSON.stringify(content);
      
      // Format usage data
      const usage: AIUsage = {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
      };
      
      return {
        text,
        model: response.model,
        usage
      };
    } catch (error) {
      console.error(`Anthropic chat completion error: ${error}`);
      throw new Error(`Failed to generate chat completion with Anthropic: ${error}`);
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
      // Claude doesn't support function calling in the same direct way as OpenAI
      // We'll create a structured prompt that requests JSON
      
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
      
      const systemPrompt = options?.systemPrompt || 
        `You are an AI assistant that helps users by executing functions. When given a request, respond ONLY with a valid JSON object matching the requested function schema.`;
      
      const structuredPrompt = 
        `I need you to execute the function '${function_name}' based on this request: "${prompt}"\n\n` +
        `Function schema: ${JSON.stringify(functionSchema, null, 2)}\n\n` +
        `Your response should be a valid JSON object matching the function parameters exactly. Do not include any explanations, just the JSON.`;
      
      // Make the request with JSON formatting
      const response = await this.client.messages.create({
        model: options?.model || DEFAULT_MODEL,
        system: systemPrompt,
        messages: [{ role: 'user', content: structuredPrompt }],
        temperature: options?.temperature ?? 0.1, // Lower temperature for more predictable function output
        max_tokens: options?.maxTokens ?? 1024
      });
      
      // Extract the response content
      const content = response.content[0];
      const responseText = content.type === 'text' ? content.text : JSON.stringify(content);
      
      // Parse the JSON response
      let parsedArguments: any;
      try {
        // Clean the text in case Claude wraps the JSON in markdown code blocks
        const jsonText = responseText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();
        
        parsedArguments = JSON.parse(jsonText);
      } catch (parseError) {
        console.error(`Failed to parse Anthropic function response as JSON: ${parseError}. Response: ${responseText}`);
        throw new Error('Failed to parse function response as JSON');
      }
      
      return {
        name: function_name,
        arguments: parsedArguments,
        model: response.model
      };
    } catch (error) {
      console.error(`Anthropic function calling error: ${error}`);
      throw new Error(`Failed to call function with Anthropic: ${error}`);
    }
  }
}