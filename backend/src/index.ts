import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import cron from 'node-cron';
import path from 'path';

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '../.env') });

import { cryptoRoutes } from './routes/crypto.routes';
import { watchlistRoutes } from './routes/watchlist.routes';
import newsRoutes from './routes/news.routes';
import { initializeDatabase } from './database/init';
import { updateTrendingCryptos } from './services/crypto.service';

const app = express();
const PORT = process.env.PORT || 3001;

//Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/crypto', cryptoRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/news', newsRoutes);

//Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error HAndling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
      console.log(`Crypto Tracker API ready`);
    });

    // Update trending cryptos every hour
    cron.schedule('0 * * * *', async () => {
      console.log(' Updating trending cryptocurrencies...');
      await updateTrendingCryptos();
    });

    // Initial trending update
    await updateTrendingCryptos();
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 