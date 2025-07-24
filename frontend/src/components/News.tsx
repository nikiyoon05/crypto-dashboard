import React, { useState, useEffect } from 'react';
import { ExternalLink, Clock, RefreshCw } from 'lucide-react';
import { newsApi } from '../services/api.service';

interface NewsArticle {
  id: string;
  title: string;
  url: string;
  description: string;
  publishedAt: string;
  source: string;
  imageUrl?: string;
}

const News: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNews = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Force refresh when showRefreshing is true
      const newsData = await newsApi.getLatestNews(showRefreshing);
      setArticles(newsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch news');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${Math.max(1, diffInMinutes)} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
  };

  const handleRefresh = () => {
    fetchNews(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Loading latest crypto news...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <p className="text-lg font-semibold">Failed to load news</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={() => fetchNews()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Latest Crypto News</h2>
          <p className="text-gray-600 mt-1">Stay updated with the latest cryptocurrency news and market insights</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* News Articles */}
      <div className="grid gap-6">
        {articles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No news articles available at the moment.</p>
          </div>
        ) : (
          articles.map((article) => (
            <article
              key={article.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Article Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                      {article.source}
                    </span>
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(article.publishedAt)}
                    </div>
                  </div>

                  {/* Article Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                    {article.title}
                  </h3>

                  {/* Article Description */}
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {article.description}
                  </p>

                  {/* Read More Link */}
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    Read full article
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Article Image */}
                {article.imageUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-24 h-24 object-cover rounded-lg"
                      onError={(e) => {
                        // Hide image if it fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {/* Footer */}
      {articles.length > 0 && (
        <div className="text-center py-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            News aggregated from multiple crypto news sources. 
            <br />
            Articles are cached for 10 minutes to reduce server load.
          </p>
        </div>
      )}
    </div>
  );
};

export default News; 