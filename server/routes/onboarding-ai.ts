import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Schema for onboarding response generation
const OnboardingRequestSchema = z.object({
  conversationHistory: z.array(z.string()),
  currentSelection: z.string(),
  step: z.number(),
  context: z.string()
});

// Generate contextually unique onboarding responses
router.post('/generate-onboarding-response', async (req, res) => {
  try {
    const { conversationHistory, currentSelection, step, context } = OnboardingRequestSchema.parse(req.body);
    
    // Create conversation context
    const conversationPath = conversationHistory.join(' → ');
    const isFirstInteraction = step === 0;
    const isEarlyConversation = step < 3;
    
    // Generate response based on conversation context and selection
    let response;
    
    if (currentSelection === 'uncertainty_methods' && !isEarlyConversation) {
      response = {
        content: "I use Monte Carlo simulations combined with Bayesian confidence intervals - standard approaches that work well. But here's what makes my approach different: my AI agents cross-validate each other's predictions in real-time. When my Grant Analysis Agent says 73% confidence and my Market Timing Agent says 68%, that 5% discrepancy tells me exactly where to dig deeper. It's like having multiple expert opinions that actually learn from their disagreements.",
        options: [
          { label: "Show me how this cross-validation works", value: "cross_validation_demo", icon: "Code" },
          { label: "What happens when agents disagree significantly?", value: "agent_disagreement", icon: "Sparkles" },
          { label: "How accurate are these predictions in practice?", value: "accuracy_track_record", icon: "TrendingUp" },
          { label: "I want to see this system in action", value: "signup_complete", icon: "ArrowRight" }
        ]
      };
    } else if (currentSelection === 'ai_agents_network' && !isEarlyConversation) {
      response = {
        content: "I coordinate with 6-12 specialized AI agents using ANFIS fuzzy logic - each has distinct capabilities. My Grant Analysis Agent is trained on 15,000+ successful applications and knows what reviewers look for. My Team Compatibility Agent uses personality modeling to predict collaboration success. My Market Timing Agent tracks funding cycles and identifies optimal submission windows. Each agent specializes in different aspects but they all share insights - like having domain experts who constantly compare notes.",
        options: [
          { label: "Show me how these agents would analyze my situation", value: "agent_analysis", icon: "ArrowRight" },
          { label: "How do the agents learn from each other?", value: "agent_learning", icon: "Sparkles" },
          { label: "What makes this better than single AI systems?", value: "multi_agent_advantage", icon: "Heart" },
          { label: "I want to see this network in action", value: "signup_complete", icon: "TrendingUp" }
        ]
      };
    } else if (currentSelection === 'cross_validation_demo') {
      response = {
        content: "Here's how cross-validation works in practice: Let's say you're applying for an NIH grant. My Grant Analysis Agent reviews your proposal and flags potential weaknesses in your methodology section - confidence 78%. Simultaneously, my Market Timing Agent notices this NIH program has unusually low submission numbers this cycle - confidence 85%. My Team Compatibility Agent analyzes your collaborators and predicts strong reviewer reception - confidence 91%. The system automatically weights these insights: methodology concerns lower your baseline odds, but timing and team factors significantly boost them. The final prediction becomes more reliable because it's validated across multiple specialized perspectives.",
        options: [
          { label: "That's exactly what I need - show me my analysis", value: "personal_analysis", icon: "ArrowRight" },
          { label: "How do you train agents to specialize like this?", value: "agent_training", icon: "Code" },
          { label: "What other factors do the agents consider?", value: "additional_factors", icon: "Sparkles" },
          { label: "I'm convinced - let me try this system", value: "signup_complete", icon: "TrendingUp" }
        ]
      };
    } else {
      // Generate contextually appropriate fallback
      response = generateContextualFallback(currentSelection, step, conversationHistory);
    }
    
    res.json({ success: true, response });
    
  } catch (error) {
    console.error('Onboarding AI response generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate response',
      fallback: generateContextualFallback(req.body.currentSelection, req.body.step, req.body.conversationHistory)
    });
  }
});

function generateContextualFallback(selection: string, step: number, history: string[]) {
  // Generate unique responses based on conversation context
  const contextKey = `${selection}_${step}_${history.length}`;
  
  const fallbacks: Record<string, any> = {
    'agent_disagreement_2_1': {
      content: "When agents disagree significantly, that's actually valuable intelligence. If my Grant Analysis Agent says 65% success probability but my Market Timing Agent says 45%, I investigate the discrepancy. Usually it reveals hidden factors - maybe the grant program is shifting priorities, or there's unexpected competition. The disagreement becomes a diagnostic tool that helps refine the prediction and identifies areas needing attention.",
      options: [
        { label: "Show me how you resolve these disagreements", value: "disagreement_resolution", icon: "Code" },
        { label: "What's the biggest disagreement you've seen?", value: "biggest_disagreement", icon: "Sparkles" },
        { label: "How does this improve my chances?", value: "improvement_chances", icon: "TrendingUp" },
        { label: "I want to see this analysis for my situation", value: "signup_complete", icon: "ArrowRight" }
      ]
    },
    'multi_agent_advantage_2_2': {
      content: "Single AI systems have blind spots - they're only as good as their training data and approach. My multi-agent system is like having a research team where each member has different expertise and they challenge each other's assumptions. One agent might focus on technical merit while another considers political timing. A third evaluates team dynamics while a fourth analyzes budget realism. No single perspective dominates, and the collective intelligence is far more robust than any individual component.",
      options: [
        { label: "How do you prevent agents from groupthink?", value: "prevent_groupthink", icon: "Code" },
        { label: "Show me the different agent perspectives", value: "agent_perspectives", icon: "Sparkles" },
        { label: "What happens when all agents agree?", value: "agent_consensus", icon: "Heart" },
        { label: "I want this multi-perspective analysis", value: "signup_complete", icon: "ArrowRight" }
      ]
    }
  };
  
  return fallbacks[contextKey] || {
    content: "I'd love to provide more personalized insights based on our conversation so far. Each interaction helps me understand your specific needs better.",
    options: [
      { label: "Tell me more about my situation", value: "personal_context", icon: "Heart" },
      { label: "Show me what you've learned about me", value: "learned_insights", icon: "Sparkles" },
      { label: "I'm ready to see personalized recommendations", value: "signup_complete", icon: "ArrowRight" }
    ]
  };
}

export default router;