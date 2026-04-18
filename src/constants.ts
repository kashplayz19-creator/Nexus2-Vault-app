export const ALL_TICKERS = [
  // Starting with a clean slate as requested.
  // Users can search for any NSE/BSE ticker.
];

export interface Holding {
  id: string;
  ticker: string;
  buyPrice: number;
  quantity: number;
}
