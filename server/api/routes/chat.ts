import { Router } from 'express';
import { Request, Response } from 'express';
import { apiResponse } from '../index';
import { providerRouter } from '../../services/provider-router';

// Simple in-memory conversation storage
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}
const conversations = new Map<string, ConversationMessage[]>();

const chatRouter = Router();

/**
 * POST /api/chat
 * Chat endpoint for the ANFIS AI Chat interface
 */
chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { message, conversationLength = 0, sessionId = 'default' } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json(apiResponse(
        false, 
        null, 
        'Message is required',
        { code: 'INVALID_MESSAGE', message: 'Message field is required and must be a string' }
      ));
    }

    // Get conversation history
    let conversation = conversations.get(sessionId) || [];
    
    // Add user message to conversation
    conversation.push({ role: 'user', content: message });
    
    // Build context with conversation history
    let contextPrompt = 'You are an AI assistant on the HyperDAG platform. Be helpful and direct.';
    if (conversation.length >= 4) {
      contextPrompt += ' Web3 Training Academy is available.';
    }
    
    // Build full prompt with conversation history
    let fullPrompt = contextPrompt + '\n\nConversation:';
    for (const msg of conversation.slice(-6)) { // Keep last 6 messages for context
      fullPrompt += `\n${msg.role}: ${msg.content}`;
    }
    fullPrompt += '\nassistant:';

    // Call real AI using the provider router
    try {
      const aiResult = await providerRouter.executeTask({
        type: 'chat',
        payload: { 
          prompt: fullPrompt,
          max_tokens: 150
        },
        prioritizeCost: true
      });

      if (aiResult.success && aiResult.result) {
        let response = aiResult.result;
        
        // Clean up response
        response = response.replace(/^(assistant:|AI:|Claude:)/i, '').trim();
        
        // Add to conversation history
        conversation.push({ role: 'assistant', content: response });
        conversations.set(sessionId, conversation.slice(-10)); // Keep last 10 messages
        
        // Add progressive unlock hints
        if (conversation.length < 8) {
          response += ` (${Math.max(0, 8 - conversation.length)} more messages to unlock Web3 Training Academy!)`;
        }

        return res.json(apiResponse(
          true, 
          { 
            response,
            provider: aiResult.provider,
            cost: aiResult.cost
          },
          'AI response generated successfully'
        ));
      }
    } catch (error) {
      console.error('AI provider failed:', error);
      // Fall through to fallback response
    }

    // Fallback response if AI fails
    let response = "I'm having trouble connecting to the AI service right now. Please try again in a moment.";
    
    return res.json(apiResponse(
      true, 
      { 
        response,
        provider: 'fallback',
        cost: 0
      },
      'Fallback response provided'
    ));

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json(apiResponse(
      false,
      null,
      'Internal server error',
      { code: 'CHAT_ERROR', message: 'Failed to process chat message' }
    ));
  }
});

export default chatRouter;