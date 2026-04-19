/**
 * SIGNAL GUARD ENGINE
 * Acts as a logic layer to filter market noise and prevent emotional reactions.
 * Specialized for the Nifty 50 and high-conviction setups.
 */

export interface Candlestick {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SignalInput {
  currentPrice: number;
  rsi: number;
  volume24h: number;
  levels: {
    support: number[];
    resistance: number[];
  };
  recentCandles: Candlestick[]; // At least last 3
}

export interface SignalResult {
  score: number; // 0-100
  status: 'WAIT' | 'WATCH' | 'ACCUMULATE' | 'CAUTION' | 'STRIKE';
  reasoning: string;
}

/**
 * Validates candlestick patterns to boost conviction scores.
 */
const validatePatterns = (candles: Candlestick[]): { hammer: boolean; engulfing: boolean } => {
  if (candles.length < 2) return { hammer: false, engulfing: false };

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  // Hammer Logic: Long lower shadow, small body at the top
  const bodySize = Math.abs(last.close - last.open);
  const totalSize = last.high - last.low;
  const lowerShadow = Math.min(last.open, last.close) - last.low;
  const upperShadow = last.high - Math.max(last.open, last.close);
  
  const isHammer = lowerShadow > bodySize * 2 && upperShadow < bodySize;

  // Bullish Engulfing Logic: Current green body completely covers previous red body
  const isBullishEngulfing = 
    prev.close < prev.open && 
    last.close > last.open && 
    last.open <= prev.close && 
    last.close >= prev.open;

  return { hammer: isHammer, engulfing: isBullishEngulfing };
};

/**
 * Calculates the Actionability Score based on Price, RSI, and Levels.
 */
export const calculateActionabilityScore = (input: SignalInput): SignalResult => {
  const { currentPrice, rsi, levels, recentCandles } = input;
  let score = 0;
  let reasons: string[] = [];

  // 1. Proximity to Support Level (0.5% threshold)
  const nearestSupport = Math.max(...levels.support.filter(s => s <= currentPrice), -Infinity);
  const distToSupport = ((currentPrice - nearestSupport) / nearestSupport) * 100;
  const isNearSupport = distToSupport <= 0.5 && distToSupport >= -0.2; // Including slight overshoot

  if (isNearSupport) {
    score += 40;
    reasons.push(`Price is within ${distToSupport.toFixed(2)}% of major support at ${nearestSupport}.`);
  }

  // 2. RSI Analysis
  if (rsi < 30) {
    score += 30;
    reasons.push("RSI indicates extreme oversold conditions (<30).");
  } else if (rsi < 35) {
    score += 20;
    reasons.push("RSI indicates oversold conditions (<35).");
  } else if (rsi > 70) {
    score -= 20;
    reasons.push("RSI indicates overbought conditions (>70). Avoid new entries.");
  }

  // 3. Pattern Recognition
  const { hammer, engulfing } = validatePatterns(recentCandles);
  if (hammer) {
    score += 15;
    reasons.push("Bullish Hammer pattern detected on recent candles.");
  }
  if (engulfing) {
    score += 20;
    reasons.push("Bullish Engulfing pattern detected; momentum shifting.");
  }

  // Cap score
  score = Math.min(Math.max(score, 0), 100);

  // Status mapping
  let status: SignalResult['status'] = 'WAIT';
  if (score >= 85) status = 'STRIKE';
  else if (score >= 70) status = 'ACCUMULATE';
  else if (score >= 50) status = 'WATCH';
  else if (rsi > 70) status = 'CAUTION';

  // High Conviction Overrides
  if (isNearSupport && rsi < 35 && (hammer || engulfing)) {
    score = Math.max(score, 90);
    status = 'STRIKE';
    reasons.unshift("[HIGH_CONVICTION]: Triple-threat alignment detected (Support + RSI + Pattern).");
  }

  return {
    score,
    status,
    reasoning: reasons.length > 0 ? reasons.join(' ') : "Market noise dominant. No clear signal detected."
  };
};
