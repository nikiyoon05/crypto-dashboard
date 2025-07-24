import React, { useState, useEffect } from 'react';
import { TrendingUp, List, Star, Search as SearchIcon, PieChart, Eye, Plus, X, Newspaper } from 'lucide-react';
import SearchBar from './components/SearchBar';
import CryptoCard from './components/CryptoCard';
import PriceChart from './components/PriceChart';
import PortfolioAnalyzer from './components/PortfolioAnalyzer';
import News from './components/News';
import { cryptoApi, watchlistApi } from './services/api.service';
import { CryptoData, TrendingCrypto, WatchlistItem, SearchResult } from './types/crypto.types';

type ActiveTab = 'trending' | 'top' | 'watchlist' | 'search' | 'portfolio' | 'news';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('trending');
  const [trendingCryptos, setTrendingCryptos] = useState<TrendingCrypto[]>([]);
  const [topCryptos, setTopCryptos] = useState<CryptoData[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistStatus, setWatchlistStatus] = useState<Record<string, boolean>>({});
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadTrendingCryptos();
    loadWatchlist();
  }, []);

  const loadTrendingCryptos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const trending = await cryptoApi.getTrendingCryptos();
      setTrendingCryptos(trending);
    } catch (err) {
      setError('Failed to load trending cryptocurrencies');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTopCryptos = async () => {
    if (topCryptos.length > 0) return; // Already loaded
    
    setIsLoading(true);
    setError(null);
    try {
      const top = await cryptoApi.getTopCryptos();
      setTopCryptos(top);
      
      // Update watchlist status for top cryptos
      const statusPromises = top.map(crypto => 
        watchlistApi.checkWatchlistStatus(crypto.id).then(status => ({ [crypto.id]: status }))
      );
      const statuses = await Promise.all(statusPromises);
      const statusMap = statuses.reduce((acc, status) => ({ ...acc, ...status }), {});
      setWatchlistStatus(prev => ({ ...prev, ...statusMap }));
    } catch (err) {
      setError('Failed to load top cryptocurrencies');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWatchlist = async () => {
    try {
      const watchlistData = await watchlistApi.getWatchlist();
      setWatchlist(watchlistData);
      
             // Update watchlist status
       const statusMap = watchlistData.reduce((acc, item) => {
         const id = item.crypto_id;
         return { ...acc, [id]: true };
       }, {});
      setWatchlistStatus(prev => ({ ...prev, ...statusMap }));
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSelectedCrypto(null);
    
    if (tab === 'top' && topCryptos.length === 0) {
      loadTopCryptos();
    }
  };

  const handleCryptoSelect = (crypto: SearchResult) => {
    setSelectedCrypto(crypto.id);
  };

  const handleWatchlistToggle = async (cryptoId: string, isAdding: boolean) => {
    setWatchlistStatus(prev => ({ ...prev, [cryptoId]: isAdding }));
    
    if (isAdding) {
      // Reload watchlist to get the new item
      await loadWatchlist();
    } else {
             // Remove from local watchlist
       setWatchlist(prev => prev.filter(item => item.crypto_id !== cryptoId));
    }
  };

  const handleViewDetails = (cryptoId: string) => {
    setSelectedCrypto(cryptoId);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (selectedCrypto) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedCrypto(null)}
              className="btn-secondary"
            >
              ← Back
            </button>
          </div>
          <div className="card">
            <PriceChart cryptoId={selectedCrypto} height={500} />
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'trending':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingCryptos.map((crypto) => (
              <CryptoCard
                key={crypto.id}
                crypto={crypto}
                isInWatchlist={watchlistStatus[crypto.id] || false}
                onWatchlistToggle={handleWatchlistToggle}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        );

      case 'top':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topCryptos.map((crypto) => (
              <CryptoCard
                key={crypto.id}
                crypto={crypto}
                isInWatchlist={watchlistStatus[crypto.id] || false}
                onWatchlistToggle={handleWatchlistToggle}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        );

      case 'watchlist':
        return watchlist.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlist.map((crypto) => (
              <CryptoCard
                key={crypto.id}
                crypto={crypto}
                isInWatchlist={true}
                onWatchlistToggle={handleWatchlistToggle}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-6">
              <Star className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-xl font-bold font-display text-neutral-900 mb-3">Your watchlist is empty</h3>
            <p className="text-neutral-600 mb-8 max-w-md mx-auto">Start building your crypto portfolio by adding coins you want to track and monitor.</p>
            <button 
              onClick={() => handleTabChange('top')}
              className="btn-primary"
            >
              Browse Markets
            </button>
          </div>
        );

      case 'search':
        return (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-6">
              <SearchIcon className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-xl font-bold font-display text-neutral-900 mb-3">Discover cryptocurrencies</h3>
            <p className="text-neutral-600 mb-8 max-w-md mx-auto">Use the search bar above to find detailed information about any cryptocurrency in our database.</p>
          </div>
        );

      case 'portfolio':
        return <PortfolioAnalyzer />;

      case 'news':
        return <News />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-elegant border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary-900 flex items-center justify-center">
                <span className="text-white font-bold font-display text-sm tracking-tight">NY</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display text-neutral-900 tracking-tight">
                  Crypto Tracker
                </h1>
                <p className="text-sm text-neutral-500 font-medium">This is a demo project of a crypto tracking dashboard, created by Niki Yoon!</p>
              </div>
            </div>
            
            <SearchBar onCryptoSelect={handleCryptoSelect} />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex bg-white shadow-elegant border border-neutral-200 p-1">
              {[
                { id: 'trending', label: 'Trending', icon: TrendingUp },
                { id: 'top', label: 'Markets', icon: List },
                { id: 'watchlist', label: 'Watchlist', icon: Star },
                { id: 'portfolio', label: 'Portfolio', icon: PieChart },
                { id: 'news', label: 'News', icon: Newspaper },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleTabChange(id as ActiveTab)}
                  className={`nav-pill ${
                    activeTab === id ? 'nav-pill-active' : 'nav-pill-inactive'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-sm font-medium text-neutral-600 bg-white px-4 py-2 border border-neutral-200">
                {activeTab === 'trending' && 'Top gainers in 24h'}
                {activeTab === 'top' && 'Top 50 by market cap'}
                {activeTab === 'watchlist' && `${watchlist.length} assets tracked`}
                {activeTab === 'portfolio' && 'Risk analysis & performance metrics'}
                {activeTab === 'news' && 'Latest crypto news & market insights'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card-elevated min-h-[600px]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
