import { kvLoad, kvSave } from './intelligenceService';

const AV_CACHE_EXPIRY = 60 * 60 * 1000; // 60 minutes

export interface ChartDataPoint {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export function adaptStockData(timeSeries: any): ChartDataPoint[] {
  const formatted = Object.keys(timeSeries).map((date) => ({
    time: date, // "YYYY-MM-DD" format is perfect for LW Charts
    open: parseFloat(timeSeries[date]["1. open"]),
    high: parseFloat(timeSeries[date]["2. high"]),
    low: parseFloat(timeSeries[date]["3. low"]),
    close: parseFloat(timeSeries[date]["4. close"]),
  }));

  // CRITICAL: Sort chronologically (Oldest -> Newest)
  return formatted.sort((a, b) => {
    // Force the date into a comparable number, handling potential string weirdness
    const timeA = typeof a.time === 'string' ? new Date(a.time).getTime() : a.time;
    const timeB = typeof b.time === 'string' ? new Date(b.time).getTime() : b.time;
    return (timeA as number) - (timeB as number);
  });
}

export async function fetchAlphaVantageData(symbol: string, avKey: string): Promise<{ data: ChartDataPoint[] | null; error: string | null; timestamp?: number }> {
  const cacheKey = `STOCK_DATA_${symbol}`;
  const cached = await kvLoad(cacheKey, null);
  
  if (cached && (Date.now() - cached.timestamp < AV_CACHE_EXPIRY)) {
    console.log(`Using cached Alpha Vantage data for ${symbol}`);
    return { data: cached.data, error: null, timestamp: cached.timestamp };
  }

  // Priority: Use provided key, but check env var first if it exists
  const envKey = import.meta.env.VITE_ALPHA_VANTAGE_KEY;
  const finalKey = (envKey && envKey !== 'TODO_KEYHERE') ? envKey : avKey;

  // Check quota
  const today = new Date().toISOString().split('T')[0];
  const quotaKey = `av_quota_${today}`;
  const currentQuota = await kvLoad(quotaKey, 0);
  
  if (currentQuota >= 25) {
    return { data: null, error: 'QUOTA_EXCEEDED' };
  }

  try {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${finalKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data['Error Message']) {
      return { data: null, error: data['Error Message'] || 'INVALID_SYMBOL' };
    }
    if (data['Note']) {
      // Capture rate limit note
      return { data: null, error: `RATE_LIMIT: ${data['Note']}` };
    }
    if (data['Information']) {
      return { data: null, error: data['Information'] || 'API_INFO' };
    }

    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) return { data: null, error: 'NO_DATA' };

    // Force-Parse: Explicitly check and map using parseFloat via adaptStockData
    const formattedData = adaptStockData(timeSeries);

    console.log("Chart Data Ready:", formattedData);

    const fetchTime = Date.now();
    // Save to cache
    await kvSave(cacheKey, { data: formattedData, timestamp: fetchTime });
    
    // Update quota
    await kvSave(quotaKey, currentQuota + 1);

    return { data: formattedData, error: null, timestamp: fetchTime };
  } catch (error) {
    console.error("Alpha Vantage fetch failed:", error);
    return { data: null, error: 'FETCH_FAILED' };
  }
}
