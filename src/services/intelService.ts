/**
 * NEXUS INTEL CONTEXT STORE (Enhanced v4.1)
 * Links the Context Store, Signal Guard, and Agent Handshake.
 */

// 1. Import the new modules
import { prepareAgentHandshake } from './agentHandshake';
import { SignalResult } from './signalGuard';

// --- INTERFACES (Restored) ---
export interface UserProfile {
  age: number;
  horizon: "1-year" | "5-year" | "10-year" | "retirement";
  riskTolerance: "Low" | "Moderate" | "Moderate-High" | "High";
}

export interface PortfolioData {
  holdings: {
    symbol: string;
    weight: number; // percentage of total
    category: "Large-Cap" | "Mid-Cap" | "Small-Cap" | "Fixed-Income";
    pnl: number;
  }[];
  cashBalance: number;
}

export interface GoalArchitect {
  milestones: {
    name: string;
    targetAmount: number;
    deadline: string;
  }[];
  targetNetWorth: number;
}

export interface IntelligenceContext {
  user: UserProfile;
  portfolio: PortfolioData;
  goals: GoalArchitect;
}

// --- SYSTEM ACCESS & SECURITY ---
const VAULT_PIN = "1234"; // Temporary access for development

export const verifyAccess = (pin: string): boolean => {
  return pin === VAULT_PIN;
};

/**
 * THE BRAIN LINK
 * This function takes the existing Context and the latest Market Data
 * to create the "Agent Handshake".
 */
export const syncNexusAgent = (
  context: IntelligenceContext, 
  marketData: { 
    ticker: string; 
    price: number; 
    rsi: number; 
    signal: SignalResult 
  }
) => {
  // Generate the Handshake String for the AI Bot using the validated modules
  const handshake = prepareAgentHandshake(
    context.user, 
    marketData.ticker, 
    marketData.price, 
    marketData.rsi, 
    marketData.signal
  );

  return {
    handshake,
    memo: generateStrategyMemo(context),
    status: "SYNCED"
  };
};

/**
 * Generates a high-density strategy memo focused on long-term wealth generation.
 */
export const generateStrategyMemo = (context: IntelligenceContext): string => {
  const { user, portfolio } = context;
  
  // 1. Context Extraction
  const largeCapExposure = portfolio.holdings
    .filter(h => h.category === "Large-Cap")
    .reduce((sum, h) => sum + h.weight, 0);
    
  const isYoung = user.age < 30;
  const longHorizon = user.horizon === "10-year" || user.horizon === "retirement";
  
  // 2. Logic Gates for Directives
  let sentences: string[] = [];

  // Sentence 1: Status Summary
  sentences.push(
    `User is ${user.age} with a ${user.horizon} horizon and ${user.riskTolerance} risk profile.`
  );

  // Sentence 2: Exposure Analysis
  if (largeCapExposure > 70) {
    sentences.push(`Current portfolio concentration in Large-Cap assets is high at ${largeCapExposure.toFixed(1)}%.`);
  } else if (portfolio.cashBalance > 50) {
    sentences.push(`Nexus Vault detects significant under-deployment with ${portfolio.cashBalance}% in cash.`);
  } else {
    sentences.push(`Portfolio structure is globally aligned with the ${user.horizon} trajectory.`);
  }

  // Sentence 3: Specific Directive
  if (isYoung && longHorizon && largeCapExposure > 60) {
    sentences.push("Suggest diversifying into Mid-Caps on the next 5% Nifty dip to maximize compounding velocity.");
  } else if (user.riskTolerance === "Low") {
    sentences.push("Directive: Tighten trailing stops and increase rotation into Fixed-Income hedges.");
  } else {
    sentences.push("Directive: Maintain current accumulation nodes and wait for high-conviction signals from the Signal Guard.");
  }

  return sentences.join(" ");
};

/**
 * RAG Utility: Prepares context for embedding or prompt injection.
 */
export const exportAgentContext = (context: IntelligenceContext) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    system: "Nexus Vault v4.1",
    context
  });
};
