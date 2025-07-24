import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cryptoApi } from '../services/api.service';
import { SearchResult } from '../types/crypto.types';

interface SearchBarProps {
  onCryptoSelect: (crypto: SearchResult) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onCryptoSelect, placeholder = "Search 5,000+ cryptocurrencies..." }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchCryptos = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = await cryptoApi.searchCryptos(query);
        setResults(searchResults);
        setIsOpen(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchCryptos, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelect = (crypto: SearchResult) => {
    onCryptoSelect(crypto);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="input-field pl-12 pr-12 font-medium"
          onFocus={() => query.length >= 2 && setIsOpen(true)}
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1 hover:bg-neutral-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 shadow-elegant-xl z-50 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-center text-neutral-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-3 font-medium">Searching cryptocurrencies...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-1">
              {results.map((crypto) => (
                <button
                  key={crypto.id}
                  onClick={() => handleSelect(crypto)}
                  className="w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors duration-200 flex items-center space-x-3 group"
                >
                  <div className="w-8 h-8 bg-primary-900 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                      {crypto.symbol.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-neutral-900 font-display group-hover:text-primary-700 transition-colors duration-200">
                      {crypto.name}
                    </div>
                    <div className="text-sm text-neutral-500 uppercase font-semibold tracking-wider">
                      {crypto.symbol}
                    </div>
                  </div>
                  {crypto.rank && crypto.rank < 999999 && (
                    <div className="text-xs font-medium text-neutral-400 bg-neutral-100 px-2 py-1">
                      #{crypto.rank}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-6 text-center text-neutral-500">
              <div className="w-10 h-10 mx-auto mb-3 bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                <Search className="w-5 h-5 text-neutral-400" />
              </div>
              <p className="font-medium">No cryptocurrencies found</p>
              <p className="text-sm text-neutral-400 mt-1">Try a different search term</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 