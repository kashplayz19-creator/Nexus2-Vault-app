import { SignalResult } from './signalGuard';
import { UserProfile } from './intelService';

/**
 * AGENT HANDSHAKE MODULE
 * This module is responsible for packaging raw market data and user goals 
 * into a JSON format that an LLM can use as a System Prompt.
 */

/**
 * The core interface for the LLM handshake.
 */
export interface NexusAgentHandshake {
  user_profile: {
    age: number;
    investment_horizon: string;
    risk_appetite: string;
  };
  market_signals: {
    ticker: string;
    rsi: number;
    price: number;
    detected_pattern: string;
    actionability_score: number;
  };
  agent_directives: string[];
}

/**
 * Logic: Packages the SignalGuard output and UserContext into a [SYSTEM_DIRECTIVE].
 * 
 * @param user The UserProfile from intelService.ts
 * @param ticker The active stock symbol
 * @param price Current price of the asset
 * @param rsi Current RSI value
 * @param signal The output from signalGuard.ts (calculateActionabilityScore)
 * @param customDirectives Optional set of strings for custom AI behavior
 * @returns A stringified JSON object wrapped in [SYSTEM_DIRECTIVE]
 */
export const prepareAgentHandshake = (
  user: UserProfile,
  ticker: string,
  price: number,
  rsi: number,
  signal: SignalResult,
  customDirectives: string[] = []
): string => {
  
  // 1. Data Validation
  if (!user || !ticker || isNaN(price) || isNaN(rsi) || !signal) {
    throw new Error("[HANDSHAKE_ERROR]: System failed to package context. Missing critical data nodes.");
  }

  // 2. Pattern Extraction Logic
  const patterns = [];
  if (signal.reasoning.includes('Hammer')) patterns.push('Hammer');
  if (signal.reasoning.includes('Engulfing')) patterns.push('Bullish Engulfing');
  const detected_pattern = patterns.length > 0 ? patterns.join(' + ') : 'Market Noise';

  // 3. Construct Handshake
  const handshake: NexusAgentHandshake = {
    user_profile: {
      age: user.age,
      investment_horizon: user.horizon,
      risk_appetite: user.riskTolerance
    },
    market_signals: {
      ticker,
      rsi,
      price,
      detected_pattern,
      actionability_score: signal.score
    },
    agent_directives: [
      ...customDirectives,
      signal.status === 'STRIKE' ? 'ACCUMULATE_NIFTY_BLUECHIPS' : 'DO_NOT_SELL_BELOW_SUPPORT',
      signal.status === 'CAUTION' ? 'TIGHTEN_TRAILING_STOPS' : 'MAINTAIN_NODES',
      'PROTOCOL_OMEGA_ACTIVE'
    ]
  };

  // 4. Return labeled payload
  return `[SYSTEM_DIRECTIVE]\n${JSON.stringify(handshake, null, 2)}`;
};

/**
 * Parser: A utility function that reads the [SYSTEM_DIRECTIVE] and restores the object.
 * Used to sync the UI state with the agent's current 'brain' state.
 */
export const parseAgentHandshake = (rawDirective: string): NexusAgentHandshake | null => {
  try {
    if (!rawDirective.startsWith('[SYSTEM_DIRECTIVE]')) return null;
    const jsonPart = rawDirective.replace('[SYSTEM_DIRECTIVE]\n', '');
    return JSON.parse(jsonPart) as NexusAgentHandshake;
  } catch (error) {
    console.error("[PARSER_ERROR]: Failed to decrypt Agent Handshake data.", error);
    return null;
  }
};

/**
 * UI Sync Utility: Returns a status message for the dashboard.
 */
export const getAgentSyncStatus = (handshake: NexusAgentHandshake | null): string => {
  if (handshake && handshake.market_signals.ticker) {
    return 'Nexus Agent is Synced and Ready.';
  }
  return 'Nexus Agent Standby: Waiting for Handshake.';
};
