import React, { useState, useEffect } from 'react';
import { PieChart, BarChart, Bar, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Plus, X, TrendingUp, TrendingDown, AlertTriangle, Target, Info } from 'lucide-react';
import { cryptoApi } from '../services/api.service';
import { SearchResult } from '../types/crypto.types';

interface PortfolioAsset {
  id: string;
  symbol: string;
  name: string;
  allocation: number;
  currentPrice?: number;
}

interface RiskMetrics {
  volatility: number;
  maxDrawdown: number;
  valueAtRisk: number;
  sharpeRatio: number;
  expectedReturn: number;
}

interface PortfolioAnalytics {
  metrics: RiskMetrics;
  historicalReturns: number[];
  cumulativeReturns: { date: string; portfolio: number; btc: number; eth: number }[];
  assetContributions: { asset: string; riskContribution: number; returnContribution: number }[];
}

interface MetricInfo {
  title: string;
  description: string;
  formula: string;
  interpretation: string;
  example: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

const METRIC_EXPLANATIONS: { [key: string]: MetricInfo } = {
  expectedReturn: {
    title: "Expected Return",
    description: "The average return you can expect from your portfolio over time, expressed as an annual percentage.",
    formula: "Expected Return = (Σ Daily Returns / Number of Days) × 252",
    interpretation: "Higher values indicate better potential returns. This is calculated by averaging daily returns and annualizing (252 trading days per year).",
    example: "If your portfolio gains 0.1% per day on average, your expected annual return would be approximately 25.2%."
  },
  volatility: {
    title: "Volatility (Risk)",
    description: "A measure of how much your portfolio's returns fluctuate over time. Higher volatility means more unpredictable returns.",
    formula: "Volatility = √(Σ(Return - Average Return)² / N) × √252",
    interpretation: "Lower volatility indicates more stable returns. This is the annualized standard deviation of daily returns.",
    example: "20% volatility means your portfolio typically varies by ±20% from its expected return in a given year."
  },
  maxDrawdown: {
    title: "Maximum Drawdown",
    description: "The largest peak-to-trough decline in your portfolio value during the analysis period.",
    formula: "Max Drawdown = (Peak Value - Trough Value) / Peak Value",
    interpretation: "Lower drawdowns are better. This shows the worst-case scenario loss you experienced from any high point.",
    example: "15% max drawdown means at worst, your portfolio lost 15% of its value from its highest point."
  },
  sharpeRatio: {
    title: "Sharpe Ratio",
    description: "A measure of risk-adjusted returns. It shows how much extra return you get for the additional risk you take.",
    formula: "Sharpe Ratio = (Portfolio Return - Risk-Free Rate) / Portfolio Volatility",
    interpretation: "Higher Sharpe ratios are better. Values above 1.0 are considered good, above 2.0 are excellent.",
    example: "A Sharpe ratio of 1.5 means you get 1.5 units of return for every unit of risk you take."
  },
  portfolioAllocation: {
    title: "Portfolio Allocation",
    description: "A visual representation of how your investment is distributed across different cryptocurrencies.",
    formula: "Allocation % = (Asset Investment / Total Portfolio Value) × 100",
    interpretation: "Diversification helps reduce risk. Avoid putting all your money in one asset. A well-balanced portfolio typically has no single asset exceeding 40-50%.",
    example: "If you invest $1000 total with $400 in Bitcoin, your Bitcoin allocation is 40%."
  },
  performanceComparison: {
    title: "Performance vs Benchmarks",
    description: "Compares your portfolio's cumulative returns against Bitcoin (BTC) and Ethereum (ETH) over time.",
    formula: "Cumulative Return = (Current Value / Initial Value - 1) × 100",
    interpretation: "This shows whether your diversified portfolio outperforms just holding Bitcoin or Ethereum alone. Lines above others indicate better performance.",
    example: "If your portfolio line is above the BTC line, your diversification strategy is working better than just holding Bitcoin."
  },
  riskContribution: {
    title: "Risk Contribution by Asset",
    description: "Shows how much each asset in your portfolio contributes to the overall portfolio risk.",
    formula: "Risk Contribution = Asset Weight × Asset Volatility × Correlation with Portfolio",
    interpretation: "Assets with higher bars contribute more to your portfolio's overall risk. Consider rebalancing if one asset dominates your risk profile.",
    example: "If Bitcoin shows the highest bar, it's contributing the most to your portfolio's volatility, even if it's not your largest holding."
  }
};

const InfoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  metricInfo: MetricInfo;
  analytics?: PortfolioAnalytics | null;
  portfolio?: PortfolioAsset[];
}> = ({ isOpen, onClose, metricInfo, analytics, portfolio }) => {
  if (!isOpen) return null;

  const generatePersonalizedCalculation = () => {
    if (!analytics || !portfolio) return null;

    const metricKey = Object.keys(METRIC_EXPLANATIONS).find(
      key => METRIC_EXPLANATIONS[key].title === metricInfo.title
    );

    switch (metricKey) {
      case 'expectedReturn':
        const avgDailyReturn = analytics.historicalReturns.reduce((sum, ret) => sum + ret, 0) / analytics.historicalReturns.length;
        const annualizedReturn = avgDailyReturn * 252;
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <strong>Your Portfolio Calculation:</strong>
            </div>
            <div className="bg-gray-50 p-3 rounded font-mono text-sm">
              <div>Average Daily Return = {(avgDailyReturn * 100).toFixed(4)}%</div>
              <div>Expected Annual Return = {(avgDailyReturn * 100).toFixed(4)}% × 252 days</div>
              <div className="font-bold text-blue-600">= {(annualizedReturn * 100).toFixed(2)}%</div>
            </div>
          </div>
        );

      case 'volatility':
        const avgReturn = analytics.historicalReturns.reduce((sum, ret) => sum + ret, 0) / analytics.historicalReturns.length;
        const variance = analytics.historicalReturns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / analytics.historicalReturns.length;
        const dailyVol = Math.sqrt(variance);
        const annualizedVol = dailyVol * Math.sqrt(252);
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <strong>Your Portfolio Calculation:</strong>
            </div>
            <div className="bg-gray-50 p-3 rounded font-mono text-sm">
              <div>Daily Variance = {(variance * 10000).toFixed(6)} (×10⁻⁴)</div>
              <div>Daily Volatility = √{(variance * 10000).toFixed(6)} = {(dailyVol * 100).toFixed(4)}%</div>
              <div>Annual Volatility = {(dailyVol * 100).toFixed(4)}% × √252</div>
              <div className="font-bold text-yellow-600">= {(annualizedVol * 100).toFixed(2)}%</div>
            </div>
          </div>
        );

      case 'maxDrawdown':
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <strong>Your Portfolio Calculation:</strong>
            </div>
            <div className="bg-gray-50 p-3 rounded font-mono text-sm">
              <div>Peak Portfolio Value = $100.00 (normalized)</div>
              <div>Lowest Trough Value = ${(100 * (1 - analytics.metrics.maxDrawdown)).toFixed(2)}</div>
              <div>Max Drawdown = (100 - {(100 * (1 - analytics.metrics.maxDrawdown)).toFixed(2)}) / 100</div>
              <div className="font-bold text-red-600">= {(analytics.metrics.maxDrawdown * 100).toFixed(2)}%</div>
            </div>
          </div>
        );

      case 'sharpeRatio':
        const riskFreeRate = 0.02; // 2% annual risk-free rate
        const excessReturn = analytics.metrics.expectedReturn - riskFreeRate;
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <strong>Your Portfolio Calculation:</strong>
            </div>
            <div className="bg-gray-50 p-3 rounded font-mono text-sm">
              <div>Portfolio Return = {(analytics.metrics.expectedReturn * 100).toFixed(2)}%</div>
              <div>Risk-Free Rate = {(riskFreeRate * 100).toFixed(2)}%</div>
              <div>Excess Return = {(analytics.metrics.expectedReturn * 100).toFixed(2)}% - {(riskFreeRate * 100).toFixed(2)}% = {(excessReturn * 100).toFixed(2)}%</div>
              <div>Portfolio Volatility = {(analytics.metrics.volatility * 100).toFixed(2)}%</div>
              <div>Sharpe Ratio = {(excessReturn * 100).toFixed(2)}% ÷ {(analytics.metrics.volatility * 100).toFixed(2)}%</div>
              <div className="font-bold text-green-600">= {analytics.metrics.sharpeRatio.toFixed(3)}</div>
            </div>
          </div>
        );

      case 'portfolioAllocation':
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <strong>Your Portfolio Breakdown:</strong>
            </div>
            <div className="bg-gray-50 p-3 rounded text-sm">
              {portfolio.map((asset, index) => (
                <div key={asset.id} className="flex justify-between py-1">
                  <span className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    {asset.symbol}
                  </span>
                  <span className="font-mono">{asset.allocation.toFixed(1)}%</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 font-bold">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>{portfolio.reduce((sum, asset) => sum + asset.allocation, 0).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'riskContribution':
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <strong>Your Portfolio Risk Breakdown:</strong>
            </div>
            <div className="bg-gray-50 p-3 rounded text-sm">
              {analytics.assetContributions.map((contribution, index) => (
                <div key={contribution.asset} className="flex justify-between py-1">
                  <span>{contribution.asset}:</span>
                  <span className="font-mono">{(contribution.riskContribution * 100).toFixed(2)}%</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 text-xs text-gray-600">
                <em>Higher values indicate assets contributing more to overall portfolio risk</em>
              </div>
            </div>
          </div>
        );

      case 'performanceComparison':
        const finalPortfolio = analytics.cumulativeReturns[analytics.cumulativeReturns.length - 1];
        const portfolioReturn = ((finalPortfolio.portfolio - 100) / 100) * 100;
        const btcReturn = ((finalPortfolio.btc - 100) / 100) * 100;
        const ethReturn = ((finalPortfolio.eth - 100) / 100) * 100;
        
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <strong>Your Portfolio vs Benchmarks (30-day period):</strong>
            </div>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <div className="flex justify-between py-1">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2 bg-blue-500" />
                  Your Portfolio:
                </span>
                <span className={`font-mono ${portfolioReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2 bg-orange-500" />
                  Bitcoin (BTC):
                </span>
                <span className={`font-mono ${btcReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {btcReturn >= 0 ? '+' : ''}{btcReturn.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2 bg-green-500" />
                  Ethereum (ETH):
                </span>
                <span className={`font-mono ${ethReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {ethReturn >= 0 ? '+' : ''}{ethReturn.toFixed(2)}%
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="text-xs text-gray-600">
                  <strong>Performance Ranking:</strong>
                </div>
                {[
                  { name: 'Your Portfolio', return: portfolioReturn },
                  { name: 'Bitcoin', return: btcReturn },
                  { name: 'Ethereum', return: ethReturn }
                ]
                .sort((a, b) => b.return - a.return)
                .map((item, index) => (
                  <div key={item.name} className="text-xs flex justify-between">
                    <span>#{index + 1} {item.name}</span>
                    <span className={item.return >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {item.return >= 0 ? '+' : ''}{item.return.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-900">{metricInfo.title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">What is it?</h4>
            <p className="text-gray-600 leading-relaxed">{metricInfo.description}</p>
          </div>

          {/* Formula */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Mathematical Formula</h4>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <code className="text-sm font-mono text-gray-800">{metricInfo.formula}</code>
            </div>
          </div>

          {/* Interpretation */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">How to Interpret</h4>
            <p className="text-gray-600 leading-relaxed">{metricInfo.interpretation}</p>
          </div>

          {/* Example */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Example</h4>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-blue-800">{metricInfo.example}</p>
            </div>
          </div>

          {/* Personalized Calculation */}
          {generatePersonalizedCalculation() && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Your Portfolio's Calculation</h4>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                {generatePersonalizedCalculation()}
              </div>
            </div>
          )}

          {/* Close button */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PortfolioAnalyzer: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([]);
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Search for cryptocurrencies
  useEffect(() => {
    const searchCryptos = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const results = await cryptoApi.searchCryptos(searchQuery);
        setSearchResults(results.slice(0, 8));
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      }
    };

    const debounceTimer = setTimeout(searchCryptos, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const addAsset = (crypto: SearchResult) => {
    if (portfolio.find(asset => asset.id === crypto.id)) {
      return; // Asset already in portfolio
    }

    if (portfolio.length >= 5) {
      setError('Maximum 5 assets allowed in portfolio');
      return;
    }

    const newAsset: PortfolioAsset = {
      id: crypto.id,
      symbol: crypto.symbol,
      name: crypto.name,
      allocation: 0
    };

    setPortfolio(prev => [...prev, newAsset]);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
    setError(null);
  };

  const removeAsset = (assetId: string) => {
    setPortfolio(prev => prev.filter(asset => asset.id !== assetId));
  };

  const updateAllocation = (assetId: string, allocation: number) => {
    if (allocation < 0 || allocation > 100) return;

    setPortfolio(prev => prev.map(asset => 
      asset.id === assetId ? { ...asset, allocation } : asset
    ));
  };

  const getTotalAllocation = () => {
    return portfolio.reduce((sum, asset) => sum + asset.allocation, 0);
  };

  const analyzePortfolio = async () => {
    if (portfolio.length < 2) {
      setError('Please add at least 2 assets to analyze');
      return;
    }

    const totalAllocation = getTotalAllocation();
    if (Math.abs(totalAllocation - 100) > 0.1) {
      setError('Total allocation must equal 100%');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Call the real portfolio analysis API
      const analysisData = await cryptoApi.analyzePortfolio(
        portfolio.map(asset => ({ id: asset.id, allocation: asset.allocation })),
        30
      );

      // Transform the data to match our frontend interface
      const transformedAnalytics: PortfolioAnalytics = {
        metrics: analysisData.metrics,
        historicalReturns: analysisData.historicalReturns,
        cumulativeReturns: analysisData.cumulativeReturns,
        assetContributions: analysisData.assetContributions.map((contribution: any) => ({
          asset: portfolio.find(p => p.id === contribution.asset)?.symbol || contribution.asset,
          riskContribution: contribution.riskContribution,
          returnContribution: contribution.returnContribution
        }))
      };

      setAnalytics(transformedAnalytics);
    } catch (err) {
      setError('Failed to analyze portfolio');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const openMetricInfo = (metricKey: string) => {
    setSelectedMetric(metricKey);
  };

  const closeMetricInfo = () => {
    setSelectedMetric(null);
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* Educational Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Info className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900">Learn as You Analyze</h3>
            <p className="text-sm text-blue-700">
              You may be asking, what are these numbers? 
              Click the <Info className="w-4 h-4 inline mx-1" /> icons on metrics and charts to learn about the mathematical formulas and interpretations behind each analysis!!
            </p>
          </div>
        </div>
      </div>

      {/* Portfolio Input Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Build Your Portfolio</h2>
        <p className="text-sm text-gray-500 mb-4"> You can add up to 5 assets to your portfolio. </p>
        
        {/* Add Asset Button */}
        {portfolio.length < 5 && (
          <div className="mb-4">
            {!showSearch ? (
              <button
                onClick={() => setShowSearch(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Asset</span>
              </button>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 5,000+ cryptocurrencies..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
                
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {searchResults.map((crypto) => (
                      <button
                        key={crypto.id}
                        onClick={() => addAsset(crypto)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-bold text-sm">
                            {crypto.symbol.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{crypto.name}</div>
                          <div className="text-sm text-gray-500">{crypto.symbol}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Portfolio Assets */}
        {portfolio.length > 0 && (
          <div className="space-y-3 mb-4">
            {portfolio.map((asset) => (
              <div key={asset.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-bold">
                    {asset.symbol.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-medium">{asset.name}</div>
                  <div className="text-sm text-gray-500">{asset.symbol}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={asset.allocation || ''}
                    onChange={(e) => updateAllocation(asset.id, parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <span className="text-gray-500">%</span>
                </div>
                <button
                  onClick={() => removeAsset(asset.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
            
            {/* Total Allocation */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="font-medium">Total Allocation:</span>
              <span className={`font-bold ${Math.abs(getTotalAllocation() - 100) < 0.1 ? 'text-green-600' : 'text-red-600'}`}>
                {getTotalAllocation().toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={analyzePortfolio}
          disabled={portfolio.length < 2 || isAnalyzing || Math.abs(getTotalAllocation() - 100) > 0.1}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isAnalyzing ? 'Analyzing Portfolio...' : 'Analyze Portfolio'}
        </button>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Analytics Results */}
      {analytics && (
        <>
          {/* Disclaimer for all analytics */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-yellow-800 text-sm font-bold">!</span>
              </div>
              <div>
                <p className="text-sm text-yellow-800">
                  <strong>Demo Notice:</strong> Since I don't have access to paid APIs and this is a demo project, all historical price data and risk metrics are randomized :(
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  The calculations are mathematically correct, but based on simulated data, not real market prices.
                </p>
              </div>
            </div>
          </div>
          
          {/* Risk Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 relative group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-600">Expected Return</span>
                </div>
                <button
                  onClick={() => openMetricInfo('expectedReturn')}
                  className="text-gray-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPercentage(analytics.metrics.expectedReturn)}
              </div>
              <div className="text-sm text-gray-500">Annualized</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 relative group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-600">Volatility</span>
                </div>
                <button
                  onClick={() => openMetricInfo('volatility')}
                  className="text-gray-400 hover:text-yellow-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPercentage(analytics.metrics.volatility)}
              </div>
              <div className="text-sm text-gray-500">Standard Deviation</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 relative group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-gray-600">Max Drawdown</span>
                </div>
                <button
                  onClick={() => openMetricInfo('maxDrawdown')}
                  className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPercentage(analytics.metrics.maxDrawdown)}
              </div>
              <div className="text-sm text-gray-500">Worst decline</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 relative group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-600">Sharpe Ratio</span>
                </div>
                <button
                  onClick={() => openMetricInfo('sharpeRatio')}
                  className="text-gray-400 hover:text-green-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {analytics.metrics.sharpeRatio.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Risk-adjusted return</div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Portfolio Allocation Pie Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Portfolio Allocation</h3>
                <button
                  onClick={() => openMetricInfo('portfolioAllocation')}
                  className="text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={portfolio}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="allocation"
                  >
                    {portfolio.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value}%`, 'Allocation']}
                    labelFormatter={(label) => portfolio.find(p => p.allocation === label)?.name || ''}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-4">
                {portfolio.map((asset, index) => (
                  <div key={asset.id} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600">{asset.symbol}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cumulative Returns Comparison */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Performance vs Benchmarks</h3>
                <button
                  onClick={() => openMetricInfo('performanceComparison')}
                  className="text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.cumulativeReturns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="portfolio" stroke="#3B82F6" strokeWidth={2} name="Portfolio" />
                  <Line type="monotone" dataKey="btc" stroke="#F59E0B" strokeWidth={2} name="Bitcoin" />
                  <Line type="monotone" dataKey="eth" stroke="#10B981" strokeWidth={2} name="Ethereum" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Contribution Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Risk Contribution by Asset</h3>
              <button
                onClick={() => openMetricInfo('riskContribution')}
                className="text-gray-400 hover:text-blue-500 transition-colors"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.assetContributions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="asset" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatPercentage(value)} />
                <Bar dataKey="riskContribution" fill="#EF4444" name="Risk Contribution" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Info Modal */}
      {selectedMetric && (
        <InfoModal
          isOpen={!!selectedMetric}
          onClose={closeMetricInfo}
          metricInfo={METRIC_EXPLANATIONS[selectedMetric]}
          analytics={analytics}
          portfolio={portfolio}
        />
      )}
    </div>
  );
};

export default PortfolioAnalyzer; 