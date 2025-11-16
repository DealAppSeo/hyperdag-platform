/**
 * AI Onboarding Service
 * 
 * This service uses Perplexity AI to create personalized onboarding experiences
 * for users based on their interests, skills, and persona.
 * 
 * Incorporating psychological marketing principles for enhanced engagement:
 * 1. Benefit-focused messaging (not features)
 * 2. Scarcity & urgency to drive action
 * 3. Emotional connection through storytelling
 * 4. Outcome-focused transformation
 * 5. Social proof through testimonials
 * 6. Risk removal to eliminate objections
 * 7. Viral sharing mechanisms
 */

import { User } from '@shared/schema';
import { perplexityChat } from './perplexity-service';
import {
  benefitMessages,
  scarcityMessages,
  emotionalMessages,
  outcomeMessages,
  socialProofMessages,
  riskRemovalMessages,
  generatePersonalizedBenefitMessage,
  generateScarcityMessage,
  generateOutcomeMessage,
  generateViralSharingMessage
} from './marketing-psychology-service';

/**
 * Generate a personalized onboarding guide for a user
 */
export async function generatePersonalizedOnboardingGuide(user: any) {
  try {
    // Apply marketing psychology principles first
    const benefitMessage = generatePersonalizedBenefitMessage(user);
    const outcomeMessage = generateOutcomeMessage(user);
    const scarcityMessage = generateScarcityMessage('completeProfile', user);
    
    // Build a detailed prompt based on user data with marketing psychology
    const prompt = `
      As an AI assistant for HyperDAG, create a personalized onboarding guide for a user with the following profile:
      
      Username: ${user.username || 'Anonymous'}
      Persona: ${user.persona || 'Not specified'}
      Skills: ${user.skills?.join(', ') || 'Not specified'}
      Interests: ${user.interests?.join(', ') || 'Not specified'}
      
      The guide should include:
      1. A welcoming and personalized message focused on benefits, not features
      2. Key features that would be most relevant to them based on their persona and interests
      3. Recommended actions to get started with a sense of urgency
      4. Insights on how their skills can be valuable in the HyperDAG ecosystem
      
      Apply these psychological marketing principles:
      - Focus on transformative outcomes and benefits, not technical features
      - Create a sense of urgency for taking immediate action
      - Present the journey as a transformation from current state to desired state
      - Include social proof elements that validate the user's decision
      - Remove perceived risks by addressing common objections
      
      Return the response as a JSON object with these keys:
      - welcomeMessage: string that leads with benefits and outcomes, not features
      - persona: string (their confirmed persona type)
      - keyFeatures: array of objects with { title, benefitFocusedDescription (not technical features), transformationOutcome, relevanceScore (1-100), path }
      - recommendedActions: array of objects with { title, description, urgencyFactor (text explaining urgency), path }
      - personalizationInsights: string
      - socialProof: string (a testimonial showing success from someone with similar background)
      - riskRemoval: string (addressing common concerns relevant to this persona)
      
      The relevanceScore should indicate how relevant each feature is to this specific user based on their profile.
    `;

    try {
      const response = await perplexityChat([
        { role: 'system', content: 'You are a helpful AI assistant for HyperDAG, a Web3 collaborative platform. Apply psychological marketing principles: focus on benefits not features, create urgency, show transformation, use social proof, and remove risk.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.7,
        max_tokens: 1000,
      });
      
      const parsedResponse = JSON.parse(response.choices[0].message.content);
      
      // Enhance the response with our marketing psychology elements
      if (!parsedResponse.socialProof) {
        // Add a default social proof if AI didn't include one
        parsedResponse.socialProof = socialProofMessages.userTestimonial({
          text: "After completing my HyperDAG profile, I was matched with three perfect opportunities in my first week. The privacy controls let me share credentials without exposing personal details.",
          name: "Alex K.",
          title: user.persona === 'developer' ? "Blockchain Developer" : 
                 user.persona === 'designer' ? "UX Designer" : 
                 user.persona === 'influencer' ? "Community Lead" : "Web3 Professional",
          outcome: "Found ideal collaborative projects while maintaining privacy"
        }).quote;
      }
      
      if (!parsedResponse.riskRemoval) {
        // Add default risk removal if AI didn't include one
        parsedResponse.riskRemoval = riskRemovalMessages.privacyGuarantee.message;
      }
      
      return parsedResponse;
    } catch (error) {
      console.error('[ai-service] AI API Error:', error);
      
      // If AI service fails, return a psychology-enhanced basic guide
      return fallbackGuide(user);
    }
  } catch (error) {
    console.error('[ai-service] Error generating personalized guide:', error);
    throw error;
  }
}

/**
 * Generate persona-specific feature recommendations
 */
export async function generatePersonaFeatures(persona: string) {
  try {
    // Build a prompt based on the persona
    const prompt = `
      As an AI assistant for HyperDAG, create a list of 6 key features that would be most valuable
      for a user with the "${persona}" persona.
      
      For context:
      - A "developer" persona focuses on building, coding, and technical implementation
      - A "designer" persona focuses on UX/UI, visual assets, and user experience
      - An "influencer" persona focuses on community building, promotion, and engagement
      
      For each feature, include:
      - A short but descriptive title
      - A brief description of how it benefits this persona
      - A relative path for navigation (e.g., "/grants", "/reputation")
      - An icon name (one of: code, palette, megaphone, users, shield, coins, zap, award)
      
      Return the response as a JSON object with a "features" key containing an array of features.
    `;

    try {
      const response = await perplexityChat([
        { role: 'system', content: 'You are a helpful AI assistant for HyperDAG, a Web3 collaborative platform.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.7,
      });
      
      const content = response.choices[0].message.content;
      try {
        const parsed = JSON.parse(content);
        return { features: parsed.features || [] };
      } catch (parseError) {
        console.error('[ai-service] Failed to parse AI response:', parseError);
        return { features: getDefaultFeaturesForPersona(persona) };
      }
    } catch (error) {
      console.error('[ai-service] AI API Error:', error);
      return { features: getDefaultFeaturesForPersona(persona) };
    }
  } catch (error) {
    console.error('[ai-service] Error generating persona features:', error);
    throw error;
  }
}

/**
 * Generate personalized skill assessment questions
 */
export async function generatePersonalizedSkillQuestions(persona: string) {
  try {
    // Build a prompt based on the persona
    const prompt = `
      As an AI assistant for HyperDAG, create a list of 5 skill assessment questions
      that would help evaluate a user with the "${persona}" persona.
      
      For context:
      - A "developer" persona focuses on building, coding, and technical implementation
      - A "designer" persona focuses on UX/UI, visual assets, and user experience
      - An "influencer" persona focuses on community building, promotion, and engagement
      
      For each question:
      - Create a unique ID
      - Write a clear question text
      - Provide 3-4 multiple choice options with { value, label, skillLevel }
      - Include a skillCategory that this question is measuring
      
      The skillLevel should be "beginner", "intermediate", or "advanced".
      The skillCategory should be relevant to the persona (e.g., "blockchain" for developers).
      
      Return the response as a JSON object with a "questions" key containing an array of questions.
    `;

    try {
      const response = await perplexityChat([
        { role: 'system', content: 'You are a helpful AI assistant for HyperDAG, a Web3 collaborative platform.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.7,
      });
      
      const content = response.choices[0].message.content;
      try {
        const parsed = JSON.parse(content);
        return { questions: parsed.questions || [] };
      } catch (parseError) {
        console.error('[ai-service] Failed to parse AI response:', parseError);
        return { questions: getDefaultQuestionsForPersona(persona) };
      }
    } catch (error) {
      console.error('[ai-service] AI API Error:', error);
      return { questions: getDefaultQuestionsForPersona(persona) };
    }
  } catch (error) {
    console.error('[ai-service] Error generating skill questions:', error);
    throw error;
  }
}

// Note: Updated fallbackGuide function is defined at the bottom of this file to avoid duplication

/**
 * Default features for each persona type with benefit-focused messaging
 */
function getDefaultFeaturesForPersona(persona: string) {
  const features = [];
  
  switch (persona) {
    case 'developer':
      features.push(
        { 
          title: "Blockchain Integration", 
          benefitFocusedDescription: "Connect to any chain without learning new APIs - save weeks of integration time", 
          transformationOutcome: "From chain-specific code to write-once-deploy-anywhere flexibility",
          relevanceScore: 95, 
          path: "/developer/blockchain", 
          icon: "code" 
        },
        { 
          title: "Privacy-Protected Authentication", 
          benefitFocusedDescription: "Prove your expertise without revealing your identity or personal information", 
          transformationOutcome: "From exposing personal data to controlling exactly what you share",
          relevanceScore: 90, 
          path: "/developer/zkp", 
          icon: "shield" 
        },
        { 
          title: "Ready-to-Use Smart Contracts", 
          benefitFocusedDescription: "Launch faster with pre-audited templates - reduce security risks by 85%", 
          transformationOutcome: "From months of security reviews to immediate deployment confidence",
          relevanceScore: 85, 
          path: "/developer/contracts", 
          icon: "code" 
        },
        { 
          title: "Perfect-Match Grants", 
          benefitFocusedDescription: "Get matched only with grants you qualify for - stop wasting time on poor-fit applications", 
          transformationOutcome: "From 2% acceptance rate to 35% success probability",
          relevanceScore: 95, 
          path: "/grants/search", 
          icon: "coins" 
        },
        { 
          title: "Skill Verification System", 
          benefitFocusedDescription: "Let your verified skills open doors, not just your GitHub profile or resume", 
          transformationOutcome: "From being overlooked to being discovered for your actual abilities",
          relevanceScore: 90, 
          path: "/reputation", 
          icon: "award" 
        },
        { 
          title: "AI Team Matching", 
          benefitFocusedDescription: "Find the perfect collaborators whose skills complement yours - avoid skill redundancy", 
          transformationOutcome: "From struggling alone to working with your ideal team",
          relevanceScore: 85, 
          path: "/teams/discover", 
          icon: "users" 
        }
      );
      break;
    case 'designer':
      features.push(
        { title: "Design System Hub", description: "Access shared design resources and component libraries", path: "/designer/resources", icon: "palette" },
        { title: "UX Showcase", description: "Display your design work and get community feedback", path: "/designer/showcase", icon: "palette" },
        { title: "Visual Collaboration", description: "Collaborate on designs with developers in real-time", path: "/designer/collaborate", icon: "users" },
        { title: "Design Bounties", description: "Find paid design opportunities across the ecosystem", path: "/bounties/design", icon: "coins" },
        { title: "Design Reputation", description: "Build your design reputation through verified work", path: "/reputation", icon: "award" },
        { title: "Community Templates", description: "Access and contribute to community design templates", path: "/designer/templates", icon: "zap" }
      );
      break;
    case 'influencer':
      features.push(
        { title: "Community Building", description: "Tools to grow and manage your community", path: "/influencer/community", icon: "users" },
        { title: "Project Promotion", description: "Promote promising projects to your audience", path: "/influencer/promote", icon: "megaphone" },
        { title: "Engagement Analytics", description: "Track the impact of your community engagement", path: "/influencer/analytics", icon: "zap" },
        { title: "Referral System", description: "Earn rewards for bringing new contributors", path: "/referrals", icon: "coins" },
        { title: "Influence Reputation", description: "Build your reputation as a community connector", path: "/reputation", icon: "award" },
        { title: "Grant Discovery", description: "Find and amplify grants that match your community", path: "/grants/search", icon: "megaphone" }
      );
      break;
    default:
      // Generic features for any persona
      features.push(
        { title: "HyperCrowd Platform", description: "Connect with collaborators across the ecosystem", path: "/discover", icon: "users" },
        { title: "Grant Flow System", description: "Navigate from ideas to funded projects", path: "/grants", icon: "coins" },
        { title: "Reputation Builder", description: "Build your reputation through contributions", path: "/reputation", icon: "award" },
        { title: "Team Formation", description: "Find the perfect team for your projects", path: "/teams", icon: "users" },
        { title: "Secure Collaboration", description: "Collaborate securely with privacy features", path: "/security", icon: "shield" },
        { title: "Quick Start Guide", description: "Get up to speed with our platform features", path: "/guide", icon: "zap" }
      );
  }
  
  return features;
}

/**
 * Default skill assessment questions for each persona type when AI services fail
 */
function getDefaultQuestionsForPersona(persona: string) {
  const questions = [];
  
  switch (persona) {
    case 'developer':
      questions.push(
        {
          id: "dev-q1",
          text: "What is your experience level with blockchain development?",
          options: [
            { value: "dev-q1-a", label: "I'm new to blockchain development", skillLevel: "beginner" },
            { value: "dev-q1-b", label: "I've built a few simple smart contracts", skillLevel: "intermediate" },
            { value: "dev-q1-c", label: "I've developed and deployed multiple dApps", skillLevel: "advanced" },
            { value: "dev-q1-d", label: "I'm an expert with multiple production protocols", skillLevel: "advanced" }
          ],
          skillCategory: "blockchain"
        },
        {
          id: "dev-q2",
          text: "Which programming languages are you most comfortable with?",
          options: [
            { value: "dev-q2-a", label: "JavaScript/TypeScript", skillLevel: "intermediate" },
            { value: "dev-q2-b", label: "Solidity/Vyper", skillLevel: "advanced" },
            { value: "dev-q2-c", label: "Rust/Go", skillLevel: "advanced" },
            { value: "dev-q2-d", label: "Python/Java", skillLevel: "intermediate" }
          ],
          skillCategory: "programming"
        },
        {
          id: "dev-q3",
          text: "What aspect of Web3 development interests you most?",
          options: [
            { value: "dev-q3-a", label: "DeFi protocols and financial primitives", skillLevel: "intermediate" },
            { value: "dev-q3-b", label: "ZK-proofs and privacy solutions", skillLevel: "advanced" },
            { value: "dev-q3-c", label: "Frontend and UX for blockchain apps", skillLevel: "intermediate" },
            { value: "dev-q3-d", label: "Infrastructure and scalability solutions", skillLevel: "advanced" }
          ],
          skillCategory: "web3_focus"
        },
        {
          id: "dev-q4",
          text: "How would you describe your experience with decentralized identity?",
          options: [
            { value: "dev-q4-a", label: "I understand the basic concepts", skillLevel: "beginner" },
            { value: "dev-q4-b", label: "I've integrated identity solutions in projects", skillLevel: "intermediate" },
            { value: "dev-q4-c", label: "I've built my own identity protocols or tools", skillLevel: "advanced" }
          ],
          skillCategory: "identity"
        },
        {
          id: "dev-q5",
          text: "What is your current team collaboration style?",
          options: [
            { value: "dev-q5-a", label: "I prefer working independently", skillLevel: "beginner" },
            { value: "dev-q5-b", label: "I enjoy collaborating with small teams", skillLevel: "intermediate" },
            { value: "dev-q5-c", label: "I thrive in cross-functional teams", skillLevel: "advanced" },
            { value: "dev-q5-d", label: "I lead development teams", skillLevel: "advanced" }
          ],
          skillCategory: "collaboration"
        }
      );
      break;
    case 'designer':
      questions.push(
        {
          id: "des-q1",
          text: "How would you describe your experience with Web3 interfaces?",
          options: [
            { value: "des-q1-a", label: "I'm new to Web3 interfaces", skillLevel: "beginner" },
            { value: "des-q1-b", label: "I've designed a few Web3 interfaces", skillLevel: "intermediate" },
            { value: "des-q1-c", label: "I've created comprehensive Web3 design systems", skillLevel: "advanced" }
          ],
          skillCategory: "web3_design"
        },
        {
          id: "des-q2",
          text: "Which design tools do you primarily use?",
          options: [
            { value: "des-q2-a", label: "Figma/Sketch", skillLevel: "intermediate" },
            { value: "des-q2-b", label: "Adobe Creative Suite", skillLevel: "intermediate" },
            { value: "des-q2-c", label: "3D tools (Blender, Cinema4D)", skillLevel: "advanced" },
            { value: "des-q2-d", label: "Code-based design tools", skillLevel: "advanced" }
          ],
          skillCategory: "design_tools"
        },
        {
          id: "des-q3",
          text: "What aspect of design are you most passionate about?",
          options: [
            { value: "des-q3-a", label: "User experience and interaction design", skillLevel: "intermediate" },
            { value: "des-q3-b", label: "Visual design and branding", skillLevel: "intermediate" },
            { value: "des-q3-c", label: "Motion design and animations", skillLevel: "advanced" },
            { value: "des-q3-d", label: "Design systems and component libraries", skillLevel: "advanced" }
          ],
          skillCategory: "design_focus"
        },
        {
          id: "des-q4",
          text: "How do you approach designing for complex Web3 concepts?",
          options: [
            { value: "des-q4-a", label: "I focus on simplification and education", skillLevel: "intermediate" },
            { value: "des-q4-b", label: "I create progressive disclosure patterns", skillLevel: "advanced" },
            { value: "des-q4-c", label: "I use visualization and metaphors", skillLevel: "intermediate" },
            { value: "des-q4-d", label: "I'm still learning how to approach this", skillLevel: "beginner" }
          ],
          skillCategory: "complexity_design"
        },
        {
          id: "des-q5",
          text: "How do you collaborate with developers?",
          options: [
            { value: "des-q5-a", label: "I hand off designs with basic specifications", skillLevel: "beginner" },
            { value: "des-q5-b", label: "I work closely with developers through implementation", skillLevel: "intermediate" },
            { value: "des-q5-c", label: "I create detailed documentation and prototype interactions", skillLevel: "advanced" },
            { value: "des-q5-d", label: "I implement some front-end code myself", skillLevel: "advanced" }
          ],
          skillCategory: "dev_collaboration"
        }
      );
      break;
    case 'influencer':
      questions.push(
        {
          id: "inf-q1",
          text: "What is your experience with Web3 community building?",
          options: [
            { value: "inf-q1-a", label: "I'm new to Web3 communities", skillLevel: "beginner" },
            { value: "inf-q1-b", label: "I'm active in Web3 communities but haven't led any", skillLevel: "intermediate" },
            { value: "inf-q1-c", label: "I've built or managed Web3 communities", skillLevel: "advanced" },
            { value: "inf-q1-d", label: "I've grown multiple successful Web3 communities", skillLevel: "advanced" }
          ],
          skillCategory: "community_building"
        },
        {
          id: "inf-q2",
          text: "Which platforms do you primarily use for community engagement?",
          options: [
            { value: "inf-q2-a", label: "Twitter/X", skillLevel: "intermediate" },
            { value: "inf-q2-b", label: "Discord/Telegram", skillLevel: "intermediate" },
            { value: "inf-q2-c", label: "On-chain governance forums", skillLevel: "advanced" },
            { value: "inf-q2-d", label: "In-person events and meetups", skillLevel: "advanced" }
          ],
          skillCategory: "engagement_platforms"
        },
        {
          id: "inf-q3",
          text: "What is your content creation experience?",
          options: [
            { value: "inf-q3-a", label: "I create written content (blog posts, threads)", skillLevel: "intermediate" },
            { value: "inf-q3-b", label: "I create visual content (graphics, videos)", skillLevel: "intermediate" },
            { value: "inf-q3-c", label: "I host podcasts or Twitter spaces", skillLevel: "advanced" },
            { value: "inf-q3-d", label: "I'm still exploring content creation", skillLevel: "beginner" }
          ],
          skillCategory: "content_creation"
        },
        {
          id: "inf-q4",
          text: "How would you describe your approach to onboarding newcomers to Web3?",
          options: [
            { value: "inf-q4-a", label: "I focus on education and simplification", skillLevel: "intermediate" },
            { value: "inf-q4-b", label: "I connect newcomers with resources and mentors", skillLevel: "intermediate" },
            { value: "inf-q4-c", label: "I create dedicated onboarding programs", skillLevel: "advanced" },
            { value: "inf-q4-d", label: "I'm still learning how to onboard effectively", skillLevel: "beginner" }
          ],
          skillCategory: "onboarding"
        },
        {
          id: "inf-q5",
          text: "What Web3 topics are you most knowledgeable about?",
          options: [
            { value: "inf-q5-a", label: "DeFi and tokenomics", skillLevel: "intermediate" },
            { value: "inf-q5-b", label: "NFTs and digital assets", skillLevel: "intermediate" },
            { value: "inf-q5-c", label: "DAOs and governance", skillLevel: "advanced" },
            { value: "inf-q5-d", label: "Social impact and public goods", skillLevel: "intermediate" }
          ],
          skillCategory: "subject_expertise"
        }
      );
      break;
    default:
      // Generic questions for any persona
      questions.push(
        {
          id: "gen-q1",
          text: "What is your experience level with Web3 technologies?",
          options: [
            { value: "gen-q1-a", label: "I'm new to Web3", skillLevel: "beginner" },
            { value: "gen-q1-b", label: "I've used Web3 applications but haven't built any", skillLevel: "intermediate" },
            { value: "gen-q1-c", label: "I've contributed to Web3 projects", skillLevel: "advanced" },
            { value: "gen-q1-d", label: "I've launched my own Web3 projects", skillLevel: "advanced" }
          ],
          skillCategory: "web3_experience"
        },
        {
          id: "gen-q2",
          text: "Which aspects of the Web3 ecosystem interest you most?",
          options: [
            { value: "gen-q2-a", label: "Technical development and infrastructure", skillLevel: "intermediate" },
            { value: "gen-q2-b", label: "Design and user experience", skillLevel: "intermediate" },
            { value: "gen-q2-c", label: "Community and governance", skillLevel: "intermediate" },
            { value: "gen-q2-d", label: "Business and tokenomics", skillLevel: "intermediate" }
          ],
          skillCategory: "interests"
        },
        {
          id: "gen-q3",
          text: "How would you prefer to contribute to projects?",
          options: [
            { value: "gen-q3-a", label: "Building and coding solutions", skillLevel: "intermediate" },
            { value: "gen-q3-b", label: "Designing interfaces and experiences", skillLevel: "intermediate" },
            { value: "gen-q3-c", label: "Growing community and adoption", skillLevel: "intermediate" },
            { value: "gen-q3-d", label: "Leading and coordinating teams", skillLevel: "advanced" }
          ],
          skillCategory: "contribution_style"
        },
        {
          id: "gen-q4",
          text: "What motivates your interest in HyperDAG?",
          options: [
            { value: "gen-q4-a", label: "Building innovative technology", skillLevel: "intermediate" },
            { value: "gen-q4-b", label: "Creating positive social impact", skillLevel: "intermediate" },
            { value: "gen-q4-c", label: "Finding professional opportunities", skillLevel: "intermediate" },
            { value: "gen-q4-d", label: "Learning and skill development", skillLevel: "beginner" }
          ],
          skillCategory: "motivation"
        },
        {
          id: "gen-q5",
          text: "How do you prefer to collaborate with others?",
          options: [
            { value: "gen-q5-a", label: "Asynchronous, remote collaboration", skillLevel: "intermediate" },
            { value: "gen-q5-b", label: "Structured team environments", skillLevel: "intermediate" },
            { value: "gen-q5-c", label: "Autonomous contribution with coordination", skillLevel: "advanced" },
            { value: "gen-q5-d", label: "Mentorship and learning relationships", skillLevel: "beginner" }
          ],
          skillCategory: "collaboration_style"
        }
      );
  }
  
  return questions;
}

/**
 * Fallback guide when AI services are unavailable
 */
function fallbackGuide(user: any) {
  const persona = user.persona || 'developer';
  const username = user.username || 'there';
  
  let welcomeMessage = '', personalizationInsights = '';
  
  switch (persona) {
    case 'developer':
      welcomeMessage = `Welcome to HyperDAG, ${username}! We've tailored your experience to focus on the technical aspects of our platform, including blockchain integration, ZKP authentication, and smart contract tooling.`;
      personalizationInsights = `As a developer, you'll find our ZKP authentication system and smart contract library particularly valuable. Your technical skills will be in high demand for grant-funded projects.`;
      break;
    case 'designer':
      welcomeMessage = `Welcome to HyperDAG, ${username}! We've customized your experience to highlight our design tools, visual collaboration features, and UX showcase opportunities.`;
      personalizationInsights = `As a designer, you'll find our visual collaboration tools and design bounties particularly valuable. Your design skills will help make Web3 more accessible and user-friendly.`;
      break;
    case 'influencer':
      welcomeMessage = `Welcome to HyperDAG, ${username}! We've personalized your journey to emphasize community building tools, project promotion features, and our referral system.`;
      personalizationInsights = `As an influencer, you'll find our community analytics and referral systems particularly valuable. Your network and communication skills will help grow the ecosystem.`;
      break;
    default:
      welcomeMessage = `Welcome to HyperDAG, ${username}! We've created a general guide to help you explore our platform and find the features that match your interests.`;
      personalizationInsights = `Based on your profile, we recommend exploring various aspects of the platform to find what resonates with you most. You can always update your persona later for more tailored recommendations.`;
  }
  
  return {
    welcomeMessage,
    persona,
    keyFeatures: getDefaultFeaturesForPersona(persona).map(f => ({
      ...f,
      relevanceScore: Math.floor(Math.random() * 30) + 70 // Random score between 70-100
    })),
    recommendedActions: [
      { 
        title: "Complete Your Profile", 
        description: "Add your skills, interests, and connect your wallet", 
        path: "/settings/profile" 
      },
      { 
        title: "Explore Grant Opportunities", 
        description: "Discover grants that match your skills and interests", 
        path: "/grants/search" 
      },
      { 
        title: "Connect With Others", 
        description: "Find collaborators with complementary skills", 
        path: "/teams/discover" 
      },
      { 
        title: "Start Building Your Reputation", 
        description: "Complete your first verification or contribution", 
        path: "/reputation/tasks" 
      }
    ],
    personalizationInsights
  };
}