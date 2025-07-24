import { Router } from 'express';
import { getDatabase } from '../database/init';
import { getCryptoData } from '../services/crypto.service';
import { WatchlistItem, ApiResponse } from '../types/crypto.types';

const router = Router();

// Get user's watchlist
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const { promisify } = require('util');
    const all = promisify(db.all.bind(db));
    
    const watchlistItems = await all(`
      SELECT * FROM watchlist 
      ORDER BY added_at DESC
    `) as WatchlistItem[];
    
    // Get current data for watchlist items
    if (watchlistItems.length > 0) {
      const cryptoIds = watchlistItems.map(item => item.crypto_id);
      const cryptoData = await getCryptoData(cryptoIds);
      
      // Merge watchlist info with current crypto data
      const enrichedWatchlist = watchlistItems.map(item => {
        const cryptoInfo = cryptoData.find(crypto => crypto.id === item.crypto_id);
        return {
          ...item,
          ...cryptoInfo
        };
      });
      
      res.json({ 
        success: true, 
        data: enrichedWatchlist 
      } as ApiResponse<typeof enrichedWatchlist>);
    } else {
      res.json({ 
        success: true, 
        data: [] 
      } as ApiResponse<WatchlistItem[]>);
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch watchlist' 
    } as ApiResponse<null>);
  }
});

// Add cryptocurrency to watchlist
router.post('/', async (req, res) => {
  try {
    const { crypto_id, symbol, name } = req.body;
    
    if (!crypto_id || !symbol || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'crypto_id, symbol, and name are required' 
      } as ApiResponse<null>);
    }

    const db = getDatabase();
    
    // Check if already in watchlist
    const { promisify } = require('util');
    const get = promisify(db.get.bind(db));
    const existing = await get('SELECT id FROM watchlist WHERE crypto_id = ?', [crypto_id]);
    
    if (existing) {
      return res.status(409).json({ 
        success: false, 
        error: 'Cryptocurrency already in watchlist' 
      } as ApiResponse<null>);
    }

    // Add to watchlist
    const run = promisify(db.run.bind(db));
    
    await run(`
      INSERT INTO watchlist (crypto_id, symbol, name) 
      VALUES (?, ?, ?)
    `, [crypto_id, symbol, name]);
    
    return res.status(201).json({ 
      success: true, 
      data: { 
        id: Date.now(), // Simple ID for response
        crypto_id, 
        symbol, 
        name,
        added_at: new Date().toISOString()
      },
      message: 'Added to watchlist successfully' 
    } as ApiResponse<WatchlistItem>);
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to add to watchlist' 
    } as ApiResponse<null>);
  }
});

// Remove cryptocurrency from watchlist
router.delete('/:crypto_id', async (req, res) => {
  try {
    const { crypto_id } = req.params;
    
    const db = getDatabase();
    const { promisify } = require('util');
    const run = promisify(db.run.bind(db));
    
    await run('DELETE FROM watchlist WHERE crypto_id = ?', [crypto_id]);

    res.json({ 
      success: true, 
      message: 'Removed from watchlist successfully' 
    } as ApiResponse<null>);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to remove from watchlist' 
    } as ApiResponse<null>);
  }
});

// Check if cryptocurrency is in watchlist
router.get('/check/:crypto_id', async (req, res) => {
  try {
    const { crypto_id } = req.params;
    
    const db = getDatabase();
    const { promisify } = require('util');
    const get = promisify(db.get.bind(db));
    const result = await get('SELECT id FROM watchlist WHERE crypto_id = ?', [crypto_id]);
    
    res.json({ 
      success: true, 
      data: { in_watchlist: !!result } 
    } as ApiResponse<{ in_watchlist: boolean }>);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check watchlist status' 
    } as ApiResponse<null>);
  }
});

export { router as watchlistRoutes }; 