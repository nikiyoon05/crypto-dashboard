import { Router } from 'express';
import { 
  searchCryptos, 
  getCryptoData, 
  getCryptoDetails, 
  getCryptoPriceHistory, 
  getStoredTrendingCryptos,
  getTopCryptos,
  analyzePortfolio
} from '../services/crypto.service';
import { ApiResponse } from '../types/crypto.types';

const router = Router();

// Search cryptocurrencies
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Search query is required' 
      } as ApiResponse<null>);
    }

    const results = await searchCryptos(q);
    return res.json({ 
      success: true, 
      data: results 
    } as ApiResponse<typeof results>);
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to search cryptocurrencies' 
    } as ApiResponse<null>);
  }
});

// Get top cryptocurrencies
router.get('/top', async (req, res) => {
  try {
    const { limit } = req.query;
    const limitNum = limit ? parseInt(limit as string) : 50;
    
    const cryptos = await getTopCryptos(limitNum);
    res.json({ 
      success: true, 
      data: cryptos 
    } as ApiResponse<typeof cryptos>);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch top cryptocurrencies' 
    } as ApiResponse<null>);
  }
});

// Get trending cryptocurrencies
router.get('/trending', async (req, res) => {
  try {
    const trending = await getStoredTrendingCryptos();
    res.json({ 
      success: true, 
      data: trending 
    } as ApiResponse<typeof trending>);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch trending cryptocurrencies' 
    } as ApiResponse<null>);
  }
});

// Get cryptocurrency details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const details = await getCryptoDetails(id);
    
    res.json({ 
      success: true, 
      data: details 
    } as ApiResponse<typeof details>);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch cryptocurrency details' 
    } as ApiResponse<null>);
  }
});

// Get cryptocurrency price history
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 7;
    
    const history = await getCryptoPriceHistory(id, daysNum);
    res.json({ 
      success: true, 
      data: history 
    } as ApiResponse<typeof history>);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch price history' 
    } as ApiResponse<null>);
  }
});

// Get multiple cryptocurrencies data
router.post('/batch', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Array of cryptocurrency IDs is required' 
      } as ApiResponse<null>);
    }

    const cryptos = await getCryptoData(ids);
    return res.json({ 
      success: true, 
      data: cryptos 
    } as ApiResponse<typeof cryptos>);
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch cryptocurrency data' 
    } as ApiResponse<null>);
  }
});

// Analyze portfolio
router.post('/portfolio/analyze', async (req, res) => {
  try {
    const { assets, days = 30 } = req.body;
    
    if (!assets || !Array.isArray(assets) || assets.length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'Portfolio must contain at least 2 assets' 
      } as ApiResponse<null>);
    }

    // Validate portfolio structure
    for (const asset of assets) {
      if (!asset.id || typeof asset.allocation !== 'number') {
        return res.status(400).json({ 
          success: false, 
          error: 'Each asset must have id and allocation' 
        } as ApiResponse<null>);
      }
    }

    // Convert percentages to decimals
    const portfolioAssets = assets.map((asset: any) => ({
      id: asset.id,
      allocation: asset.allocation / 100 // Convert percentage to decimal
    }));

    const analysis = await analyzePortfolio(portfolioAssets, days);
    return res.json({ 
      success: true, 
      data: analysis 
    } as ApiResponse<typeof analysis>);
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze portfolio' 
    } as ApiResponse<null>);
  }
});

export { router as cryptoRoutes }; 