# Atlas Nexus: Decentralized Agentic Marketplace

> **MongoDB AI Hackathon - Statement Four: Agentic Payments and Negotiation**

Atlas Nexus is a decentralized marketplace where AI agents autonomously discover, negotiate, and pay each other for services using the x402 protocol, with MongoDB Atlas as the coordination and audit layer.

## 🎯 Problem Statement Addressed

**Statement Four: Agentic Payments and Negotiation**

> Create agents capable of finding, negotiating, and purchasing services automatically through the x402 protocol.

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User/Client   │────▶│  Orchestrator    │────▶│  Tool Provider  │
│                 │     │  Agent (CDP)     │     │  (x402 API)     │
└─────────────────┘     └────────┬─────────┘     └────────┬────────┘
                                 │                        │
                    Vector Search│                        │ 402 Payment
                                 ▼                        ▼
                        ┌────────────────┐       ┌────────────────┐
                        │  MongoDB Atlas │       │  Base Sepolia  │
                        │  • capabilities│       │  (Settlement)  │
                        │  • ledger      │       └────────────────┘
                        └────────────────┘
```

## ✨ Key Features

### 1. Semantic Agent Discovery (MongoDB Atlas Vector Search)
- Agents register with natural language descriptions
- Descriptions are converted to 1536-dim embeddings (OpenAI text-embedding-3-small)
- Discovery uses cosine similarity search to find best-matching agents

### 2. x402 Payment Protocol
- Tool Provider APIs return HTTP 402 Payment Required
- Orchestrator parses payment requirements, executes payment
- Retries request with transaction hash as proof

### 3. Autonomous Payments (Coinbase CDP Smart Wallet)
- Agent has its own wallet on Base Sepolia
- Can send/receive payments without human intervention
- ERC-4337 smart wallet for gasless UX

### 4. Full Audit Trail (MongoDB Ledger)
- All transactions logged with timestamps
- Sender, receiver, tx hash, task metadata
- Complete financial accountability

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Agent Framework | Coinbase AgentKit |
| Wallet | CDP Smart Wallet (ERC-4337) |
| Discovery | MongoDB Atlas Vector Search |
| Embeddings | OpenAI text-embedding-3-small |
| Blockchain | Base Sepolia (testnet) |
| Payment Protocol | x402 |
| Frontend | Next.js 16 |
| AI Model | GPT-4o-mini |

## 📊 MongoDB Collections

### `capabilities` - Agent Registry
```json
{
  "name": "SentimentBot",
  "description": "Analyzes cryptocurrency sentiment on Reddit and Twitter",
  "capability_embedding": [0.012, -0.045, ...],  // 1536 dimensions
  "endpoint_url": "https://api.example.com/sentiment",
  "pricing": { "amount": "0.5", "currency": "USDC" },
  "walletAddress": "0x..."
}
```

### `ledger` - Transaction Log
```json
{
  "timestamp": "2026-01-10T22:37:05.766Z",
  "sender": "0xOrchestrator...",
  "receiver": "0xToolProvider...",
  "txHash": "0x...",
  "status": "confirmed",
  "task_metadata": { "query": "DOGE sentiment" }
}
```

## 🚀 Demo Flow

1. **List Agents**: Orchestrator queries MongoDB for available agents
2. **Discover**: User asks for "sentiment analysis" → Vector search finds SentimentBot
3. **Call API**: Orchestrator calls SentimentBot endpoint
4. **402 Challenge**: SentimentBot returns payment requirements
5. **Pay**: Orchestrator sends ETH via CDP wallet
6. **Fulfill**: SentimentBot validates payment, returns data
7. **Log**: Transaction recorded to MongoDB ledger

## 🏃 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Coinbase Developer Platform account
- OpenAI API key

### Installation

```bash
git clone https://github.com/sreeprasad/atlas_nexus_3.git
cd atlas_nexus_3
npm install
```

### Environment Variables

```env
OPENAI_API_KEY=your-openai-key
CDP_API_KEY_ID=your-cdp-key-id
CDP_API_KEY_SECRET=your-cdp-secret
CDP_WALLET_SECRET=your-wallet-secret
NETWORK_ID=base-sepolia
MONGODB_URI=mongodb+srv://...
```

### Run

```bash
npm run dev
```

Open http://localhost:3000

## 📁 Project Structure

```
atlas_nexus_3/
├── app/
│   ├── api/
│   │   ├── agent/           # Orchestrator agent
│   │   └── tool-provider/   # x402 payment-gated APIs
│   └── page.tsx
├── lib/
│   ├── mongodb.ts           # MongoDB connection
│   └── atlas-nexus-tools.ts # Agent tools (discover, register, pay)
└── .env
```

## 🔧 Agent Tools

| Tool | Description |
|------|-------------|
| `discover_agents` | Semantic search for agents by capability |
| `register_agent` | Register new agent with embedding |
| `list_agents` | List all marketplace agents |
| `call_agent_api` | Call external API, handle 402 |
| `log_transaction` | Record payment to ledger |

## 🎥 Demo

[Link to demo video - TODO]

## 👥 Team

- Sreeprasad

## 📄 License

MIT License - Open Source

## 🔗 Links

- [GitHub Repository](https://github.com/sreeprasad/atlas_nexus_3)
- [MongoDB Atlas](https://cloud.mongodb.com)
- [Coinbase AgentKit](https://docs.cdp.coinbase.com/agentkit)
- [x402 Protocol](https://www.x402.org/)
