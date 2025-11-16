/**
 * OpenAI Provider Implementation
 * 
 * This provider integrates the OpenAI service into the redundancy layer.
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
const DEFAULT_MODEL = 'gpt-4o';

export class OpenAIProvider implements AIProvider {
  public readonly name = 'OpenAI';
  private client: OpenAI;
  
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
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
      console.error(`OpenAI provider availability check failed: ${error}`);
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
      const systemPrompt = options?.systemPrompt || 'You are a helpful assistant.';
      
      // Format the request with appropriate parameters
      const response = await this.client.chat.completions.create({
        model: options?.model || DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        top_p: options?.topP ?? 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        stop: options?.stopSequences,
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
      console.error(`OpenAI text completion error: ${error}`);
      throw new Error(`Failed to generate text with OpenAI: ${error}`);
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
      // Convert messages to the format expected by OpenAI
      const openaiMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Format the request with appropriate parameters
      const response = await this.client.chat.completions.create({
        model: options?.model || DEFAULT_MODEL,
        messages: openaiMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        top_p: options?.topP ?? 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        stop: options?.stopSequences,
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
      console.error(`OpenAI chat completion error: ${error}`);
      throw new Error(`Failed to generate chat completion with OpenAI: ${error}`);
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
      // Build the function definition for OpenAI
      const functionDefinition = {
        name: function_name,
        description: `Execute the ${function_name} function with the provided parameters.`,
        parameters: {
          type: 'object',
          properties: parameters,
          required: Object.keys(parameters)
        }
      };
      
      // Create a structured request for the function call
      const systemPrompt = options?.systemPrompt || 'You are a helpful assistant.';
      
      // Create the full request
      const response = await this.client.chat.completions.create({
        model: options?.model || DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        functions: [functionDefinition],
        function_call: { name: function_name },
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens,
        top_p: options?.topP ?? 0.9,
        stream: options?.stream ?? false
      });
      
      // Extract function call from response
      const functionCall = response.choices[0]?.message?.function_call;
      
      if (!functionCall || !functionCall.arguments) {
        throw new Error('OpenAI did not return a function call');
      }
      
      let parsedArguments: any;
      
      try {
        parsedArguments = JSON.parse(functionCall.arguments);
      } catch (parseError) {
        console.error(`Failed to parse OpenAI function arguments as JSON: ${parseError}`);
        throw new Error('Failed to parse function arguments as JSON');
      }
      
      return {
        name: functionCall.name || function_name,
        arguments: parsedArguments,
        model: response.model || DEFAULT_MODEL
      };
    } catch (error) {
      console.error(`OpenAI function calling error: ${error}`);
      throw new Error(`Failed to call function with OpenAI: ${error}`);
    }
  }
}