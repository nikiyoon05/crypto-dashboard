import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cryptoApi } from '../services/api.service';
import { PricePoint, CryptoData } from '../types/crypto.types';
import { TrendingUp, TrendingDown } from 'lucide-react'; // Added lucide-react for icons

interface PriceChartProps {
  cryptoId: string;
  height?: number;
}

const PriceChart: React.FC<PriceChartProps> = ({ cryptoId, height = 400 }) => {
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [cryptoDetails, setCryptoDetails] = useState<CryptoData | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(7);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timeframes = [
    { label: '1D', value: 1, days: 1 },
    { label: '7D', value: 7, days: 7 },
    { label: '30D', value: 30, days: 30 },
    { label: '90D', value: 90, days: 90 },
    { label: '1Y', value: 365, days: 365 }
  ];

  useEffect(() => {
    const fetchCryptoDetails = async () => {
      try {
        const details = await cryptoApi.getCryptoDetails(cryptoId);
        setCryptoDetails(details);
      } catch (err) {
        console.error('Error fetching crypto details:', err);
      }
    };

    fetchCryptoDetails();
  }, [cryptoId]);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const rawData = await cryptoApi.getPriceHistory(cryptoId, selectedTimeframe);
        const formattedData: PricePoint[] = rawData.map(([timestamp, price]) => ({
          timestamp,
          price,
          date: new Date(timestamp).toLocaleDateString(),
          time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        
        setPriceData(formattedData);
      } catch (err) {
        setError('Failed to load price data');
        console.error('Error fetching price history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPriceHistory();
  }, [cryptoId, selectedTimeframe]);

  const formatPrice = (price: number) => {
    if (price < 0.01) {
      return `$${price.toFixed(6)}`;
    } else if (price < 1) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  const formatXAxisLabel = (timestamp: number) => {
    const date = new Date(timestamp);
    if (selectedTimeframe <= 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (selectedTimeframe <= 7) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else if (selectedTimeframe <= 30) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
          <p className="text-sm text-gray-600">
            {selectedTimeframe <= 1 ? `${data.date} ${data.time}` : data.date}
          </p>
          <p className="text-lg font-semibold text-primary-600">
            {formatPrice(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const getPriceChange = () => {
    if (priceData.length < 2) return { change: 0, percentage: 0 };
    
    const firstPrice = priceData[0]?.price || 0;
    const lastPrice = priceData[priceData.length - 1]?.price || 0;
    const change = lastPrice - firstPrice;
    const percentage = firstPrice > 0 ? (change / firstPrice) * 100 : 0;
    
    return { change, percentage };
  };

  const { change, percentage } = getPriceChange();
  const isPositiveTrend = change >= 0;

  if (error || priceData.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header with coin info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {cryptoDetails && (
              <>
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-bold text-lg">
                    {cryptoDetails.symbol.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{cryptoDetails.name}</h2>
                  <p className="text-gray-500 uppercase">{cryptoDetails.symbol}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="flex space-x-2">
          {timeframes.map((timeframe) => (
            <button
              key={timeframe.value}
              onClick={() => setSelectedTimeframe(timeframe.value)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {timeframe.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center" style={{ height: height - 120 }}>
          <div className="text-center text-gray-500">
            <p>{error || 'No price data available'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with coin info and current price */}
      <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {cryptoDetails && (
              <>
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {cryptoDetails.symbol.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {cryptoDetails.name} ({cryptoDetails.symbol})
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>${priceData[priceData.length - 1]?.price.toLocaleString()}</span>
                    <span className={`flex items-center gap-1 ${
                      change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {change >= 0 ? '+' : ''}{percentage.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setSelectedTimeframe(tf.value)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedTimeframe === tf.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-yellow-800 text-xs font-bold">!</span>
            </div>
            <p className="text-sm text-yellow-800">
              <strong>Demo Notice:</strong> Since I don't have access to paid APIs and this is a demo project, this historical price data is randomized :( (except for the current data)
            </p>
          </div>
        </div>

        {/* Chart */}
      {isLoading ? (
        <div className="flex items-center justify-center" style={{ height: height - 120 }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading chart...</p>
          </div>
        </div>
      ) : (
        <div style={{ height: height - 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={formatXAxisLabel}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                domain={['dataMin - dataMin * 0.01', 'dataMax + dataMax * 0.01']}
                tickFormatter={formatPrice}
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke={isPositiveTrend ? '#22c55e' : '#ef4444'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: isPositiveTrend ? '#22c55e' : '#ef4444' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PriceChart; 