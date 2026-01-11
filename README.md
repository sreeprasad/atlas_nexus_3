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


## 🎥 Demo

https://www.youtube.com/watch?v=nF2FD0zMWck

## 👥 Team

- Sreeprasad

## 📄 License

MIT License - Open Source

## 🔗 Links

- [GitHub Repository](https://github.com/sreeprasad/atlas_nexus_3)
- [MongoDB Atlas](https://cloud.mongodb.com)
- [Coinbase AgentKit](https://docs.cdp.coinbase.com/agentkit)
- [x402 Protocol](https://www.x402.org/)
