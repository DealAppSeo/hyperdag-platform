// Simple 3-Agent Voting System
interface Agent {
  name: string;
  query: (prompt: string) => Promise<string>;
  vote: (answers: string[]) => number; // Returns index of best answer
}

// Mock AI query functions (replace with actual API calls)
const queryOpenAI = async (prompt: string): Promise<string> => {
  // Replace with actual OpenAI API call
  return `OpenAI: ${prompt.slice(0, 20)}... solution using neural networks`;
};

const queryAnthropic = async (prompt: string): Promise<string> => {
  // Replace with actual Anthropic API call  
  return `Claude: ${prompt.slice(0, 20)}... approach using reasoning`;
};

const queryHuggingFace = async (prompt: string): Promise<string> => {
  // Replace with actual HuggingFace API call
  return `HuggingFace: ${prompt.slice(0, 20)}... method using transformers`;
};

// Simple voting logic - each agent votes for best answer
const simpleVote = (answers: string[], agentName: string): number => {
  // Simple heuristic: longest answer wins (replace with actual scoring)
  return answers.indexOf(answers.reduce((a, b) => a.length > b.length ? a : b));
};

// Create 3 agents
const agents: Agent[] = [
  { name: "Agent1", query: queryOpenAI, vote: (answers) => simpleVote(answers, "Agent1") },
  { name: "Agent2", query: queryAnthropic, vote: (answers) => simpleVote(answers, "Agent2") },
  { name: "Agent3", query: queryHuggingFace, vote: (answers) => simpleVote(answers, "Agent3") }
];

// Main voting function
export async function runVoting(prompt: string): Promise<{ winner: string, votes: number[] }> {
  // Get answers from all agents
  const answers = await Promise.all(agents.map(agent => agent.query(prompt)));
  
  // Each agent votes
  const votes = agents.map(agent => agent.vote(answers));
  
  // Count votes (simple majority)
  const voteCount = [0, 0, 0];
  votes.forEach(vote => voteCount[vote]++);
  
  // Find winner
  const winnerIndex = voteCount.indexOf(Math.max(...voteCount));
  
  return {
    winner: answers[winnerIndex],
    votes: voteCount
  };
}

// Usage example
// runVoting("How do I solve X?").then(result => console.log(result));