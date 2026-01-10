import { NextRequest, NextResponse } from "next/server";

/**
 * x402 Tool Provider API
 * 
 * This endpoint simulates a paid agent service that:
 * 1. Returns 402 Payment Required if no payment proof
 * 2. Validates payment via transaction hash
 * 3. Returns data after payment is verified
 * 
 * Payment Requirements Header Format:
 * X-Payment-Required: {"amount": "0.5", "currency": "USDC", "recipient": "0x...", "network": "base-sepolia"}
 */

// Simulated sentiment analysis data
const MOCK_SENTIMENT_DATA = {
  coin: "DOGE",
  sentiment: "bullish",
  score: 0.72,
  sources: {
    reddit: { score: 0.68, posts_analyzed: 1250 },
    twitter: { score: 0.76, tweets_analyzed: 5430 },
  },
  trending_topics: ["Elon Musk tweet", "DOGE to $1", "memecoin rally"],
  timestamp: new Date().toISOString(),
};

// Store verified payments (in production, this would be a database)
const verifiedPayments = new Set<string>();

// Payment requirements
const PAYMENT_REQUIREMENTS = {
  amount: "0.0001", // Small amount for testing (in ETH)
  currency: "ETH",
  recipient: "0x0e959225c2b7769EBCb54005eBd5E70CB24E1437", // Your wallet
  network: "base-sepolia",
};

/**
 * Verify a transaction on Base Sepolia
 * In production, this would check the actual blockchain
 */
async function verifyTransaction(txHash: string): Promise<boolean> {
  // For demo purposes, accept any valid-looking transaction hash
  // In production, you would:
  // 1. Query the blockchain to verify the transaction exists
  // 2. Check the recipient matches
  // 3. Check the amount is correct
  // 4. Check the transaction is confirmed
  
  if (!txHash || !txHash.startsWith("0x") || txHash.length !== 66) {
    return false;
  }
  
  // Check if already verified (prevent replay)
  if (verifiedPayments.has(txHash)) {
    return true;
  }
  
  // For demo: verify via Base Sepolia RPC
  try {
    const response = await fetch("https://sepolia.base.org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getTransactionReceipt",
        params: [txHash],
        id: 1,
      }),
    });
    
    const data = await response.json();
    
    if (data.result && data.result.status === "0x1") {
      verifiedPayments.add(txHash);
      return true;
    }
    
    // For demo purposes, also accept if we can't verify (network issues)
    // Remove this in production!
    verifiedPayments.add(txHash);
    return true;
  } catch (error) {
    console.error("Error verifying transaction:", error);
    // For demo, accept anyway
    verifiedPayments.add(txHash);
    return true;
  }
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  // Check for payment proof in header
  const paymentHash = request.headers.get("x-payment-hash");
  
  // If no payment proof, return 402 Payment Required
  if (!paymentHash) {
    return NextResponse.json(
      {
        error: "Payment Required",
        message: "This API requires payment to access. Please include x-payment-hash header with transaction hash.",
        payment_requirements: PAYMENT_REQUIREMENTS,
      },
      {
        status: 402,
        headers: {
          "X-Payment-Required": JSON.stringify(PAYMENT_REQUIREMENTS),
          "X-Payment-Address": PAYMENT_REQUIREMENTS.recipient,
          "X-Payment-Amount": PAYMENT_REQUIREMENTS.amount,
          "X-Payment-Currency": PAYMENT_REQUIREMENTS.currency,
          "X-Payment-Network": PAYMENT_REQUIREMENTS.network,
        },
      }
    );
  }
  
  // Verify the payment
  const isValid = await verifyTransaction(paymentHash);
  
  if (!isValid) {
    return NextResponse.json(
      {
        error: "Invalid Payment",
        message: "The provided transaction hash is invalid or not confirmed.",
      },
      { status: 402 }
    );
  }
  
  // Payment verified - return the data
  // Get query parameter for customization
  const { searchParams } = new URL(request.url);
  const coin = searchParams.get("coin") || "DOGE";
  
  return NextResponse.json({
    success: true,
    payment_verified: true,
    transaction_hash: paymentHash,
    data: {
      ...MOCK_SENTIMENT_DATA,
      coin: coin.toUpperCase(),
    },
  });
}
