import axios from 'axios';
import * as cheerio from 'cheerio';
import Parser from 'rss-parser';

export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  description: string;
  publishedAt: string;
  source: string;
  imageUrl?: string;
}

// use RSS parser to get news from coindesk, cointelegraph, and crypto news

const rssParser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail']
  }
});

// Free crypto news sources
const NEWS_SOURCES = [
  {
    name: 'CoinDesk',
    rssUrl: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    type: 'rss'
  },
  {
    name: 'Cointelegraph',
    rssUrl: 'https://cointelegraph.com/rss',
    type: 'rss'
  },
  {
    name: 'CryptoNews',
    rssUrl: 'https://cryptonews.com/news/feed/',
    type: 'rss'
  }
];

async function scrapeFromRSS(source: any): Promise<NewsArticle[]> {
  try {
    console.log(` Fetching news from ${source.name}...`);
    
    const feed = await rssParser.parseURL(source.rssUrl);
    const articles: NewsArticle[] = [];
    
    // Get the first 5 articles from each source
    const items = feed.items?.slice(0, 5) || [];
    
    for (const item of items) {
      if (item.title && item.link) {
        // generate a simple ID from the URL
        const id = Buffer.from(item.link).toString('base64').substring(0, 16);
        
        // Extract image URL from various possible fields
        let imageUrl: string | undefined;
        if (item['media:content']) {
          imageUrl = item['media:content'].$.url;
        } else if (item['media:thumbnail']) {
          imageUrl = item['media:thumbnail'].$.url;
        } else if (item.enclosure?.url) {
          imageUrl = item.enclosure.url;
        }
        
        articles.push({
          id,
          title: item.title,
          url: item.link,
          description: item.contentSnippet || item.content || 'No description available',
          publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
          source: source.name,
          imageUrl
        });
      }
    }
    
    console.log(`✅ Found ${articles.length} articles from ${source.name}`);
    return articles;
  } catch (error) {
    console.error(`Error fetching from ${source.name}:`, error);
    return [];
  }
}

export async function getCryptoNews(): Promise<NewsArticle[]> {
  try {
    console.log('Starting crypto news aggregation...');
    
    // Fetch from all RSS sources in parallel
    const newsPromises = NEWS_SOURCES.map(source => scrapeFromRSS(source));
    const newsArrays = await Promise.all(newsPromises);
    
    // Flatten and combine all articles
    const allArticles = newsArrays.flat();
    
    // Sort by publication date (most recent first)
    allArticles.sort((a, b) => {
      const dateA = new Date(a.publishedAt);
      const dateB = new Date(b.publishedAt);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Return top 10 most recent articles
    const topArticles = allArticles.slice(0, 10);
    
    console.log(`Total articles collected: ${allArticles.length}, returning top ${topArticles.length}`);
    return topArticles;
    
  } catch (error) {
    console.error('Error in getCryptoNews:', error);
    
    // Return mock data as fallback
    return [
      {
        id: 'mock1',
        title: 'Demo News: Bitcoin Reaches New Heights',
        url: 'https://example.com/bitcoin-news',
        description: 'This is mock news data since news scraping failed. In a real implementation, this would show actual crypto news.',
        publishedAt: new Date().toISOString(),
        source: 'Demo Source',
        imageUrl: undefined
      },
      {
        id: 'mock2',
        title: 'Demo News: Ethereum Updates Coming Soon',
        url: 'https://example.com/ethereum-news',
        description: 'Another mock article to demonstrate the news feature. Real news would be scraped from crypto news websites.',
        publishedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        source: 'Demo Source',
        imageUrl: undefined
      }
    ];
  }
}

// Cache news for 10 minutes to avoid excessive requests
let newsCache: { articles: NewsArticle[]; timestamp: number } | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function getCachedCryptoNews(forceRefresh: boolean = false): Promise<NewsArticle[]> {
  const now = Date.now();
  
  // Return cached news if it's still fresh and not forcing refresh
  if (!forceRefresh && newsCache && (now - newsCache.timestamp) < CACHE_DURATION) {
    console.log('📋 Returning cached news');
    return newsCache.articles;
  }
  
  // Fetch fresh news
  console.log(forceRefresh ? ' Force refreshing news...' : ' Cache expired, fetching fresh news...');
  const articles = await getCryptoNews();
  
  // Update cache
  newsCache = {
    articles,
    timestamp: now
  };
  
  return articles;
} 