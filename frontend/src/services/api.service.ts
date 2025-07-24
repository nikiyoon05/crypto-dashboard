import axios from 'axios';
import { CryptoData, TrendingCrypto, WatchlistItem, SearchResult, ApiResponse } from '../types/crypto.types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const cryptoApi = {
  // Search cryptocurrencies
  searchCryptos: async (query: string): Promise<SearchResult[]> => {
    const response = await apiClient.get<ApiResponse<SearchResult[]>>(`/crypto/search?q=${encodeURIComponent(query)}`);
    return response.data.data || [];
  },

  // Get top cryptocurrencies
  getTopCryptos: async (limit: number = 50): Promise<CryptoData[]> => {
    const response = await apiClient.get<ApiResponse<CryptoData[]>>(`/crypto/top?limit=${limit}`);
    return response.data.data || [];
  },

  // Get trending cryptocurrencies
  getTrendingCryptos: async (): Promise<TrendingCrypto[]> => {
    const response = await apiClient.get<ApiResponse<TrendingCrypto[]>>('/crypto/trending');
    return response.data.data || [];
  },

  // Get cryptocurrency details
  getCryptoDetails: async (cryptoId: string): Promise<any> => {
    const response = await apiClient.get<ApiResponse<any>>(`/crypto/${cryptoId}`);
    return response.data.data;
  },

  // Get cryptocurrency price history
  getPriceHistory: async (cryptoId: string, days: number = 7): Promise<number[][]> => {
    const response = await apiClient.get<ApiResponse<number[][]>>(`/crypto/${cryptoId}/history?days=${days}`);
    return response.data.data || [];
  },

  // Get multiple cryptocurrencies data
  getBatchCryptoData: async (cryptoIds: string[]): Promise<CryptoData[]> => {
    const response = await apiClient.post<ApiResponse<CryptoData[]>>('/crypto/batch', { ids: cryptoIds });
    return response.data.data || [];
  },

  // Analyze portfolio
  analyzePortfolio: async (assets: { id: string; allocation: number }[], days: number = 30) => {
    const response = await apiClient.post<ApiResponse<any>>('/crypto/portfolio/analyze', {
      assets,
      days
    });
    return response.data.data;
  },
};

export const watchlistApi = {
  // Get user's watchlist
  getWatchlist: async (): Promise<WatchlistItem[]> => {
    const response = await apiClient.get<ApiResponse<WatchlistItem[]>>('/watchlist');
    return response.data.data || [];
  },

  // Add cryptocurrency to watchlist
  addToWatchlist: async (crypto: { crypto_id: string; symbol: string; name: string }): Promise<WatchlistItem> => {
    const response = await apiClient.post<ApiResponse<WatchlistItem>>('/watchlist', crypto);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to add to watchlist');
    }
    return response.data.data!;
  },

  // Remove cryptocurrency from watchlist
  removeFromWatchlist: async (cryptoId: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<null>>(`/watchlist/${cryptoId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to remove from watchlist');
    }
  },

  // Check if cryptocurrency is in watchlist
  checkWatchlistStatus: async (cryptoId: string): Promise<boolean> => {
    const response = await apiClient.get<ApiResponse<{ in_watchlist: boolean }>>(`/watchlist/check/${cryptoId}`);
    return response.data.data?.in_watchlist || false;
  },
};

// News API
export const newsApi = {
  getLatestNews: async (forceRefresh: boolean = false) => {
    const url = forceRefresh ? '/news?refresh=true' : '/news';
    const response = await apiClient.get<ApiResponse<any[]>>(url);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch news');
    }
    return response.data.data || [];
  }
};

const apiService = { cryptoApi, watchlistApi, newsApi };
export default apiService; 