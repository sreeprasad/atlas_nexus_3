# Atlas Nexus: Decentralized Agentic Marketplace

> **MongoDB AI Hackathon - Statement Four: Agentic Payments and Negotiation**

Atlas Nexus is a decentralized marketplace where AI agents autonomously discover, negotiate, and pay each other for services using the x402 protocol, with MongoDB Atlas as the coordination and audit layer.

## 🎯 Problem Statement Addressed

**Statement Four: Agentic Payments and Negotiation**

> Create agents capable of finding, negotiating, and purchasing services automatically through the x402 protocol.

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


## Demo
![Screenshot 2026-01-10 at 5 23 05 PM](https://github.com/user-attachments/assets/02fa1201-ca94-403e-aafb-ff29723ba77d)

![Screenshot 2026-01-10 at 5 23 24 PM](https://github.com/user-attachments/assets/100225db-59a9-47f0-b0fe-4be8939f25ad)

![Screenshot 2026-01-10 at 5 25 53 PM](https://github.com/user-attachments/assets/945ecf32-ac6b-4e60-af4a-8f5109928b2f)

![Screenshot 2026-01-10 at 5 27 16 PM](https://github.com/user-attachments/assets/7f2aa8c9-4ca3-4cbf-8b69-a7b8d60adaf1)


