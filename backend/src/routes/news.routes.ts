import { Router } from 'express';
import { getCachedCryptoNews } from '../services/news.service';

const router = Router();

// GET /api/news - Get latest crypto news
router.get('/', async (req, res) => {
  try {
    // Check if refresh is requested via query parameter
    const forceRefresh = req.query.refresh === 'true';
    const news = await getCachedCryptoNews(forceRefresh);
    
    return res.json({
      success: true,
      data: news,
      count: news.length
    });
  } catch (error: any) {
    console.error('Error fetching news:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch crypto news',
      message: error.message
    });
  }
});

export default router; 