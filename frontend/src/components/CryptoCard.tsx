import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Star, StarOff, Eye } from 'lucide-react';
import { CryptoData, WatchlistItem, TrendingCrypto } from '../types/crypto.types';
import { watchlistApi } from '../services/api.service';

interface CryptoCardProps {
  crypto: CryptoData | WatchlistItem | TrendingCrypto;
  isInWatchlist?: boolean;
  onWatchlistToggle?: (cryptoId: string, isAdding: boolean) => void;
  onViewDetails?: (cryptoId: string) => void;
}

const CryptoCard: React.FC<CryptoCardProps> = ({ 
  crypto, 
  isInWatchlist = false, 
  onWatchlistToggle,
  onViewDetails 
}) => {
  const [isUpdatingWatchlist, setIsUpdatingWatchlist] = useState(false);

  const formatPrice = (price: number) => {
    if (price < 0.01) {
      return `$${price.toFixed(6)}`;
    } else if (price < 1) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    } else {
      return `$${marketCap.toLocaleString()}`;
    }
  };

  const formatPercentage = (percentage: number) => {
    const isPositive = percentage >= 0;
    return (
      <span className={`flex items-center ${isPositive ? 'text-success-600' : 'text-danger-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
        {Math.abs(percentage).toFixed(2)}%
      </span>
    );
  };

  const getCryptoId = () => {
    if ('crypto_id' in crypto) {
      return crypto.crypto_id;
    }
    return crypto.id;
  };

  const handleWatchlistToggle = async () => {
    if (!onWatchlistToggle) return;
    
    setIsUpdatingWatchlist(true);
    try {
      const cryptoId = getCryptoId();
      if (isInWatchlist) {
        await watchlistApi.removeFromWatchlist(cryptoId);
      } else {
        await watchlistApi.addToWatchlist({
          crypto_id: cryptoId,
          symbol: crypto.symbol,
          name: crypto.name
        });
      }
      onWatchlistToggle(cryptoId, !isInWatchlist);
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    } finally {
      setIsUpdatingWatchlist(false);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(getCryptoId());
    }
  };

  return (
    <div className="card group cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <img
            src={crypto.image}
            alt={crypto.name}
            className="w-12 h-12 border border-neutral-200 group-hover:border-neutral-300 transition-colors duration-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-crypto.png';
            }}
          />
          <div>
            <h3 className="font-bold text-lg font-display text-neutral-900 group-hover:text-primary-700 transition-colors duration-200">
              {crypto.name}
            </h3>
            <p className="text-neutral-500 uppercase text-sm font-semibold tracking-wider">
              {crypto.symbol}
            </p>
            {'market_cap_rank' in crypto && crypto.market_cap_rank && (
              <p className="text-xs text-neutral-400 font-medium mt-1">Rank #{crypto.market_cap_rank}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {onViewDetails && (
            <button
              onClick={handleViewDetails}
              className="p-2 text-neutral-400 hover:text-primary-700 hover:bg-neutral-100 transition-all duration-200"
              title="View details"
            >
              <Eye className="w-5 h-5" />
            </button>
          )}
          {onWatchlistToggle && (
            <button
              onClick={handleWatchlistToggle}
              disabled={isUpdatingWatchlist}
              className={`p-2 transition-all duration-200 ${
                isInWatchlist 
                  ? 'text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100' 
                  : 'text-neutral-400 hover:text-yellow-600 hover:bg-yellow-50'
              } ${isUpdatingWatchlist ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              {isUpdatingWatchlist ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
              ) : isInWatchlist ? (
                <Star className="w-5 h-5 fill-current" />
              ) : (
                <StarOff className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-neutral-100">
          <span className="text-neutral-600 font-medium">Price</span>
          <span className="font-bold text-lg font-display text-neutral-900">
            {crypto.current_price ? formatPrice(crypto.current_price) : 'N/A'}
          </span>
        </div>

        {crypto.price_change_percentage_24h !== undefined && (
          <div className="flex justify-between items-center py-2 border-b border-neutral-100">
            <span className="text-neutral-600 font-medium">24h Change</span>
            <div className="font-bold">
              {formatPercentage(crypto.price_change_percentage_24h)}
            </div>
          </div>
        )}

        {crypto.market_cap && (
          <div className="flex justify-between items-center py-2">
            <span className="text-neutral-600 font-medium">Market Cap</span>
            <span className="font-bold font-display text-neutral-900">{formatMarketCap(crypto.market_cap)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoCard; 