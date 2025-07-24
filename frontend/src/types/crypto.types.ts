export interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  image: string;
  last_updated: string;
}

export interface TrendingCrypto {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  market_cap_rank: number;
  image: string;
  updated_at: string;
}

export interface WatchlistItem {
  id: number;
  crypto_id: string;
  symbol: string;
  name: string;
  added_at: string;
  // Additional fields from crypto data when enriched
  current_price?: number;
  price_change_24h?: number;
  price_change_percentage_24h?: number;
  market_cap?: number;
  image?: string;
}

export interface SearchResult {
  id: string;
  name: string;
  symbol: string;
  slug: string;
  rank: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PricePoint {
  timestamp: number;
  price: number;
  date?: string;
  time?: string;
} 