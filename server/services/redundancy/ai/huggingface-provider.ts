/**
 * Hugging Face AI Provider Implementation
 * 
 * This provider integrates Hugging Face Inference API into the redundancy layer.
 */

import { HfInference } from '@huggingface/inference';
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

// Default models to use
const DEFAULT_TEXT_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';
const DEFAULT_CHAT_MODEL = 'mistralai/Mixtral-8x7B-Instruct-v0.1';
const DEFAULT_FUNCTION_MODEL = 'mistralai/Mixtral-8x7B-Instruct-v0.1';

export class HuggingFaceProvider implements AIProvider {
  public readonly name = 'HuggingFace';
  private client: HfInference;
  
  constructor() {
    // Initialize client with token if available, otherwise use default authentication
    if (process.env.HF_API_KEY) {
      this.client = new HfInference(process.env.HF_API_KEY);
      console.log('HuggingFace client initialized with API key');
    } else {
      // Use the default authentication method (looks for token in ~/.huggingface/token)
      this.client = new HfInference();
      console.log('HuggingFace client initialized with default authentication');
    }
  }
  
  /**
   * Check if the provider is available
   */
  public async isAvailable(): Promise<boolean> {
    try {
      // Make a minimal request to check if the API is working
      const response = await this.client.textGeneration({
        model: DEFAULT_TEXT_MODEL,
        inputs: 'Hello',
        parameters: {
          max_new_tokens: 1
        }
      });
      
      return !!response;
    } catch (error) {
      console.error(`HuggingFace provider availability check failed: ${error}`);
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
      const fullPrompt = `${systemPrompt}\n\n${prompt}`;
      
      // Format the request with appropriate parameters
      const response = await this.client.textGeneration({
        model: options?.model || DEFAULT_TEXT_MODEL,
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: options?.maxTokens || 512,
          temperature: options?.temperature,
          top_p: options?.topP,
          stop_sequences: options?.stopSequences
        }
      });
      
      // Extract the generated text
      const text = response.generated_text || '';
      
      // Estimate token usage (HF doesn't provide token counts)
      const promptChars = fullPrompt.length;
      const completionChars = text.length;
      const promptTokens = Math.ceil(promptChars / 4); // Rough estimation
      const completionTokens = Math.ceil(completionChars / 4); // Rough estimation
      
      const usage: AIUsage = {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens
      };
      
      return {
        text,
        model: options?.model || DEFAULT_TEXT_MODEL,
        usage
      };
    } catch (error) {
      console.error(`HuggingFace text completion error: ${error}`);
      throw new Error(`Failed to generate text with HuggingFace: ${error}`);
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
      // Convert messages to a conversation string format that Hugging Face models understand
      let conversationText = '';
      
      for (const message of messages) {
        if (message.role === 'system') {
          conversationText += `${message.content}\n\n`;
        } else if (message.role === 'user') {
          conversationText += `Human: ${message.content}\n`;
        } else if (message.role === 'assistant') {
          conversationText += `Assistant: ${message.content}\n`;
        }
      }
      
      // Add the final assistant prompt
      conversationText += 'Assistant:';
      
      // Call the Hugging Face chat model
      const response = await this.client.textGeneration({
        model: options?.model || DEFAULT_CHAT_MODEL,
        inputs: conversationText,
        parameters: {
          max_new_tokens: options?.maxTokens || 512,
          temperature: options?.temperature,
          top_p: options?.topP,
          stop_sequences: options?.stopSequences || ['Human:', 'Assistant:']
        }
      });
      
      // Extract the generated text
      const text = response.generated_text?.trim() || '';
      
      // Estimate token usage (HF doesn't provide token counts)
      const promptChars = conversationText.length;
      const completionChars = text.length;
      const promptTokens = Math.ceil(promptChars / 4); // Rough estimation
      const completionTokens = Math.ceil(completionChars / 4); // Rough estimation
      
      const usage: AIUsage = {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens
      };
      
      return {
        text,
        model: options?.model || DEFAULT_CHAT_MODEL,
        usage
      };
    } catch (error) {
      console.error(`HuggingFace chat completion error: ${error}`);
      throw new Error(`Failed to generate chat completion with HuggingFace: ${error}`);
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
      // Hugging Face doesn't have native function calling
      // So we'll structure this as a JSON generation task
      
      // Build a JSON schema from the parameters
      const functionSchema = {
        name: function_name,
        description: `Execute the ${function_name} function with the provided parameters.`,
        parameters: {
          type: 'object',
          properties: parameters,
          required: Object.keys(parameters).filter(key => parameters[key].required)
        }
      };
      
      // Create a prompt that requests JSON output in the specific format
      const systemPrompt = 
        `You are an AI assistant that can call functions. When responding, you must provide ONLY a valid JSON object matching the schema for the '${function_name}' function. The output must be valid parseable JSON without any explanation or additional text.`;
      
      const structuredPrompt = 
        `${systemPrompt}\n\n` +
        `Please execute the function '${function_name}' based on the following request: "${prompt}"\n\n` +
        `Function schema: ${JSON.stringify(functionSchema, null, 2)}\n\n` +
        `Your response must be a valid JSON object matching the function parameters.`;
      
      // Make the request
      const response = await this.client.textGeneration({
        model: options?.model || DEFAULT_FUNCTION_MODEL,
        inputs: structuredPrompt,
        parameters: {
          max_new_tokens: options?.maxTokens || 1024,
          temperature: options?.temperature || 0.1, // Lower temperature for more predictable function output
          top_p: options?.topP,
          // Force stop at new line or when the model tries to explain the JSON
          stop_sequences: options?.stopSequences || ['\n\n']
        }
      });
      
      // Extract and parse the JSON response
      let responseText = response.generated_text || '{}';
      
      // Clean the response to extract only the JSON part
      responseText = responseText.trim();
      
      // If response starts with "```json" and ends with "```", extract just the JSON
      if (responseText.startsWith('```json') && responseText.endsWith('```')) {
        responseText = responseText.slice(7, -3).trim();
      } else if (responseText.startsWith('```') && responseText.endsWith('```')) {
        responseText = responseText.slice(3, -3).trim();
      }
      
      let parsedArguments: any;
      
      try {
        parsedArguments = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`Failed to parse HuggingFace function response as JSON: ${parseError}`);
        console.error(`Raw response: ${responseText}`);
        throw new Error('Failed to parse function response as JSON');
      }
      
      return {
        name: function_name,
        arguments: parsedArguments,
        model: options?.model || DEFAULT_FUNCTION_MODEL
      };
    } catch (error) {
      console.error(`HuggingFace function calling error: ${error}`);
      throw new Error(`Failed to call function with HuggingFace: ${error}`);
    }
  }
}