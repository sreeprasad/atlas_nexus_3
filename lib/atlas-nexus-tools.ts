import { z } from "zod";
import { tool } from "ai";
import { getCapabilitiesCollection, getLedgerCollection } from "./mongodb";

/**
 * Generate embeddings using OpenAI's API directly via fetch
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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
 * Atlas Nexus Tools for agent discovery and registration
 */
export const atlasNexusTools = {
  discover_agents: tool({
    description:
      "Search for agents with specific capabilities using semantic search. Returns agents that match the requested capability.",
    parameters: z.object({
      query: z.string().describe("Natural language description of the capability needed"),
      limit: z.number().optional().default(5).describe("Maximum number of agents to return"),
    }),
    execute: async ({ query, limit }) => {
      try {
        const queryEmbedding = await generateEmbedding(query);
        const collection = await getCapabilitiesCollection();

        const results = await collection
          .aggregate([
            {
              $vectorSearch: {
                index: "capability_vector_index",
                path: "capability_embedding",
                queryVector: queryEmbedding,
                numCandidates: (limit || 5) * 10,
                limit: limit || 5,
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
          return {
            success: true,
            message: "No agents found matching the requested capability",
            agents: [],
          };
        }

        return {
          success: true,
          message: `Found ${results.length} agent(s) matching "${query}"`,
          agents: results,
        };
      } catch (error) {
        console.error("Error discovering agents:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to discover agents",
        };
      }
    },
  }),

  register_agent: tool({
    description:
      "Register a new agent in the Atlas Nexus marketplace with its capabilities and pricing",
    parameters: z.object({
      name: z.string().describe("Name of the agent"),
      description: z.string().describe("Description of what the agent does"),
      endpoint_url: z.string().describe("API endpoint URL for the agent"),
      pricing_amount: z.string().describe("Price for using this agent (e.g., '1.0')"),
      pricing_currency: z.string().default("USDC").describe("Currency for pricing"),
      wallet_address: z.string().describe("Wallet address to receive payments"),
    }),
    execute: async ({
      name,
      description,
      endpoint_url,
      pricing_amount,
      pricing_currency,
      wallet_address,
    }) => {
      try {
        const embedding = await generateEmbedding(description);
        const collection = await getCapabilitiesCollection();

        const existing = await collection.findOne({ name });
        if (existing) {
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
          return {
            success: true,
            message: `Agent "${name}" updated successfully`,
          };
        }

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

        return {
          success: true,
          message: `Agent "${name}" registered successfully`,
          agentId: result.insertedId.toString(),
        };
      } catch (error) {
        console.error("Error registering agent:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to register agent",
        };
      }
    },
  }),

  log_transaction: tool({
    description: "Log a payment transaction between agents to the Atlas Nexus ledger",
    parameters: z.object({
      sender: z.string().describe("Sender wallet address"),
      receiver: z.string().describe("Receiver wallet address"),
      tx_hash: z.string().describe("Transaction hash"),
      task_metadata: z.string().optional().describe("JSON string of task metadata"),
    }),
    execute: async ({ sender, receiver, tx_hash, task_metadata }) => {
      try {
        const collection = await getLedgerCollection();

        const result = await collection.insertOne({
          timestamp: new Date(),
          sender,
          receiver,
          txHash: tx_hash,
          status: "confirmed",
          task_metadata: task_metadata ? JSON.parse(task_metadata) : {},
        });

        return {
          success: true,
          message: "Transaction logged successfully",
          ledgerId: result.insertedId.toString(),
        };
      } catch (error) {
        console.error("Error logging transaction:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to log transaction",
        };
      }
    },
  }),

  call_agent_api: tool({
    description: "Call an agent's API endpoint. If the API returns 402 Payment Required, this tool will return the payment requirements so you can make a payment and retry.",
    parameters: z.object({
      endpoint_url: z.string().describe("The API endpoint URL to call"),
      method: z.string().describe("HTTP method: GET or POST"),
      payment_hash: z.string().describe("Transaction hash for payment proof (use 'none' if no payment yet)"),
      query_params: z.string().describe("Query parameters as JSON string, e.g., '{\"coin\": \"DOGE\"}'"),
    }),
    execute: async ({ endpoint_url, method, payment_hash, query_params }) => {
      try {
        // Build URL with query params
        const url = new URL(endpoint_url);
        if (query_params && query_params !== "{}") {
          const params = JSON.parse(query_params);
          Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
          });
        }

        // Build headers
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        
        if (payment_hash && payment_hash !== "none") {
          headers["x-payment-hash"] = payment_hash;
        }

        // Make the request
        const response = await fetch(url.toString(), {
          method: method.toUpperCase(),
          headers,
        });

        const data = await response.json();

        // Handle 402 Payment Required
        if (response.status === 402) {
          const paymentRequired = response.headers.get("X-Payment-Required");
          return {
            success: false,
            status: 402,
            message: "Payment Required",
            payment_requirements: paymentRequired ? JSON.parse(paymentRequired) : data.payment_requirements,
            instructions: "Make a payment to the recipient address, then call this tool again with the transaction hash in payment_hash parameter.",
          };
        }

        // Handle other errors
        if (!response.ok) {
          return {
            success: false,
            status: response.status,
            error: data.error || "API request failed",
          };
        }

        // Success
        return {
          success: true,
          status: response.status,
          data: data,
        };
      } catch (error) {
        console.error("Error calling agent API:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to call agent API",
        };
      }
    },
  }),

  list_agents: tool({
    description: "List all agents registered in the Atlas Nexus marketplace",
    parameters: z.object({
      include_details: z.boolean().optional().default(true).describe("Whether to include full agent details"),
    }),
    execute: async ({ include_details }) => {
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

        return {
          success: true,
          count: agents.length,
          agents,
        };
      } catch (error) {
        console.error("Error listing agents:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to list agents",
        };
      }
    },
  }),
};
