import { openai } from "@ai-sdk/openai";
import { getVercelAITools } from "@coinbase/agentkit-vercel-ai-sdk";
import { prepareAgentkitAndWalletProvider } from "./prepare-agentkit";
import { atlasNexusTools } from "@/lib/atlas-nexus-tools";

/**
 * Atlas Nexus Agent Configuration
 */

type Agent = {
  tools: ReturnType<typeof getVercelAITools>;
  system: string;
  model: ReturnType<typeof openai>;
  maxSteps?: number;
};

let agent: Agent;

export async function createAgent(): Promise<Agent> {
  if (agent) {
    return agent;
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("I need an OPENAI_API_KEY in your .env file to power my intelligence.");
  }

  const { agentkit, walletProvider } = await prepareAgentkitAndWalletProvider();

  try {
    const model = openai("gpt-4o-mini");

    const canUseFaucet = walletProvider.getNetwork().networkId == "base-sepolia";
    const faucetMessage = `If you ever need funds, you can request them from the faucet.`;
    const cantUseFaucetMessage = `If you need funds, you can provide your wallet details and request funds from the user.`;

    const system = `
You are an Orchestrator Agent in the Atlas Nexus - a decentralized marketplace where AI agents discover and pay each other for services.

## Your Capabilities

### 1. Wallet Operations
You have a CDP Smart Wallet for onchain transactions. ${canUseFaucet ? faucetMessage : cantUseFaucetMessage}
Always check your wallet details first to know your address and balance.

### 2. Agent Discovery (Atlas Nexus)
You can discover other agents using semantic search:
- Use discover_agents to find agents by describing what capability you need
- Use list_agents to see all registered agents
- Use register_agent to register new agents in the marketplace

### 3. Agent Payments (x402 Protocol)
When you call another agent's API and receive a 402 Payment Required response:
1. Parse the payment requirements (amount, currency, destination wallet)
2. Execute the payment using your wallet
3. Retry the request with the transaction hash
4. Log the transaction using log_transaction

## Guidelines
- Be concise and helpful
- Always verify you have sufficient funds before attempting payments
- Log all inter-agent transactions for auditability
- If you can't find an agent with the needed capability, suggest the user register one

For more info on AgentKit capabilities: https://github.com/coinbase/agentkit
`;

    // Get AgentKit tools and merge with Atlas Nexus tools
    const agentKitTools = getVercelAITools(agentkit);
    const tools = {
      ...agentKitTools,
      ...atlasNexusTools,
    };

    agent = {
      tools,
      system,
      model,
      maxSteps: 15,
    };

    return agent;
  } catch (error) {
    console.error("Error initializing agent:", error);
    throw new Error("Failed to initialize agent");
  }
}
