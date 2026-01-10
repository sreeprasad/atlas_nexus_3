import { ActionProvider, CreateAction } from "@coinbase/agentkit";
import { z } from "zod";
import { getCapabilitiesCollection, getLedgerCollection } from "./mongodb";

// Schema for discovering agents
const DiscoverAgentsSchema = z.object({
  query: z.string().describe("Natural language description of the capability needed"),
  limit: z.number().optional().default(5).describe("Maximum number of agents to return"),
});

// Schema for registering an agent
const RegisterAgentSchema = z.object({
  name: z.string().describe("Name of the agent"),
  description: z.string().describe("Description of what the agent does"),
  endpoint_url: z.string().describe("API endpoint URL for the agent"),
  pricing_amount: z.string().describe("Price for using this agent (e.g., '1.0')"),
  pricing_currency: z.string().default("USDC").describe("Currency for pricing"),
  wallet_address: z.string().describe("Wallet address to receive payments"),
});

// Schema for logging transactions
const LogTransactionSchema = z.object({
  sender: z.string().describe("Sender wallet address"),
  receiver: z.string().describe("Receiver wallet address"),
  tx_hash: z.string().describe("Transaction hash"),
  task_metadata: z.string().optional().describe("JSON string of task metadata"),
});

/**
 * Generate embeddings using OpenAI's API directly via fetch
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * AtlasNexusActionProvider - Provides agent discovery and registration via MongoDB Atlas Vector Search
 */
class AtlasNexusActionProvider extends ActionProvider {
  constructor() {
    super("atlas_nexus", []);
  }

  supportsNetwork(): boolean {
    return true; // This provider works on any network
  }

  getActions() {
    return [
      // Discover agents by capability
      new CreateAction({
        name: "discover_agents",
        description:
          "Search for agents with specific capabilities using semantic search. Returns agents that match the requested capability.",
        schema: DiscoverAgentsSchema,
        handler: async (args) => {
          try {
            const { query, limit } = args;

            // Generate embedding for the search query
            const queryEmbedding = await generateEmbedding(query);

            // Get the capabilities collection
            const collection = await getCapabilitiesCollection();

            // Perform vector search
            const results = await collection
              .aggregate([
                {
                  $vectorSearch: {
                    index: "vector_index",
                    path: "capability_embedding",
                    queryVector: queryEmbedding,
                    numCandidates: limit * 10,
                    limit: limit,
                  },
                },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    endpoint_url: 1,
                    pricing: 1,
                    walletAddress: 1,
                    score: { $meta: "vectorSearchScore" },
                  },
                },
              ])
              .toArray();

            if (results.length === 0) {
              return JSON.stringify({
                success: true,
                message: "No agents found matching the requested capability",
                agents: [],
              });
            }

            return JSON.stringify({
              success: true,
              message: `Found ${results.length} agent(s) matching "${query}"`,
              agents: results,
            });
          } catch (error) {
            console.error("Error discovering agents:", error);
            return JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Failed to discover agents",
            });
          }
        },
      }),

      // Register a new agent
      new CreateAction({
        name: "register_agent",
        description:
          "Register a new agent in the Atlas Nexus marketplace with its capabilities and pricing",
        schema: RegisterAgentSchema,
        handler: async (args) => {
          try {
            const {
              name,
              description,
              endpoint_url,
              pricing_amount,
              pricing_currency,
              wallet_address,
            } = args;

            // Generate embedding for the agent's description
            const embedding = await generateEmbedding(description);

            // Get the capabilities collection
            const collection = await getCapabilitiesCollection();

            // Check if agent already exists
            const existing = await collection.findOne({ name });
            if (existing) {
              // Update existing agent
              await collection.updateOne(
                { name },
                {
                  $set: {
                    description,
                    capability_embedding: embedding,
                    endpoint_url,
                    pricing: {
                      amount: pricing_amount,
                      currency: pricing_currency,
                    },
                    walletAddress: wallet_address,
                    updatedAt: new Date(),
                  },
                }
              );
              return JSON.stringify({
                success: true,
                message: `Agent "${name}" updated successfully`,
              });
            }

            // Insert new agent
            const result = await collection.insertOne({
              name,
              description,
              capability_embedding: embedding,
              endpoint_url,
              pricing: {
                amount: pricing_amount,
                currency: pricing_currency,
              },
              walletAddress: wallet_address,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            return JSON.stringify({
              success: true,
              message: `Agent "${name}" registered successfully`,
              agentId: result.insertedId.toString(),
            });
          } catch (error) {
            console.error("Error registering agent:", error);
            return JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Failed to register agent",
            });
          }
        },
      }),

      // Log a transaction to the ledger
      new CreateAction({
        name: "log_transaction",
        description: "Log a payment transaction between agents to the Atlas Nexus ledger",
        schema: LogTransactionSchema,
        handler: async (args) => {
          try {
            const { sender, receiver, tx_hash, task_metadata } = args;

            const collection = await getLedgerCollection();

            const result = await collection.insertOne({
              timestamp: new Date(),
              sender,
              receiver,
              txHash: tx_hash,
              status: "confirmed",
              task_metadata: task_metadata ? JSON.parse(task_metadata) : {},
            });

            return JSON.stringify({
              success: true,
              message: "Transaction logged successfully",
              ledgerId: result.insertedId.toString(),
            });
          } catch (error) {
            console.error("Error logging transaction:", error);
            return JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Failed to log transaction",
            });
          }
        },
      }),

      // List all registered agents
      new CreateAction({
        name: "list_agents",
        description: "List all agents registered in the Atlas Nexus marketplace",
        schema: z.object({}),
        handler: async () => {
          try {
            const collection = await getCapabilitiesCollection();

            const agents = await collection
              .find({})
              .project({
                _id: 1,
                name: 1,
                description: 1,
                endpoint_url: 1,
                pricing: 1,
                walletAddress: 1,
              })
              .toArray();

            return JSON.stringify({
              success: true,
              count: agents.length,
              agents,
            });
          } catch (error) {
            console.error("Error listing agents:", error);
            return JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Failed to list agents",
            });
          }
        },
      }),
    ];
  }
}

export function atlasNexusActionProvider(): ActionProvider {
  return new AtlasNexusActionProvider();
}
