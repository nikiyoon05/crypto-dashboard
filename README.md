# Crypto Tracker

A full-stack cryptocurrency tracking application built with React, TypeScript, Node.js, and Express. Track cryptocurrency prices, manage your watchlist, view trending coins, and analyze price charts.

## Features

- 🔍 **Search Cryptocurrencies**: Search and discover any cryptocurrency
- 📈 **Price Tracking**: Real-time price data and 24h changes
- ⭐ **Watchlist Management**: Add/remove cryptocurrencies to your personal watchlist
- 🔥 **Trending Cryptos**: View currently trending cryptocurrencies
- 📊 **Interactive Charts**: Price history charts with multiple timeframes
- 📱 **Responsive Design**: Clean, modern UI that works on all devices
- 🚀 **Top 50 Cryptos**: Browse the top cryptocurrencies by market cap

## Tech Stack

### Backend
- **Node.js** with **TypeScript**
- **Express.js** for REST API
- **SQLite** with **better-sqlite3** for data storage
- **Axios** for external API calls
- **CoinMarketCap API** for cryptocurrency data
- **Node-cron** for scheduled data updates

### Frontend
- **React** with **TypeScript**
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Lucide React** for icons
- **Axios** for API communication

## Project Structure

```
crypto-tracker/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── database/       # Database setup and models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript interfaces
│   │   └── index.ts        # Server entry point
│   ├── data/               # SQLite database storage
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API service layer
│   │   ├── types/          # TypeScript interfaces
│   │   └── App.tsx         # Main application component
│   └── package.json
└── package.json           # Root package.json for scripts
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crypto-tracker
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   
   Create `.env` file in the `backend` directory:
   ```bash
   cp backend/.env.example backend/.env
   ```
   
   Edit `backend/.env` and add your CoinMarketCap API key (required for full functionality):
   ```
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:3001
   - Frontend development server on http://localhost:3000

### Production Build

1. **Build both applications**
   ```bash
   npm run build
   ```

2. **Start production servers**
   ```bash
   npm start
   ```

## API Endpoints

### Cryptocurrency Data
- `GET /api/crypto/search?q={query}` - Search cryptocurrencies
- `GET /api/crypto/top?limit={limit}` - Get top cryptocurrencies
- `GET /api/crypto/trending` - Get trending cryptocurrencies
- `GET /api/crypto/:id` - Get cryptocurrency details
- `GET /api/crypto/:id/history?days={days}` - Get price history
- `POST /api/crypto/batch` - Get multiple cryptocurrencies data

### Watchlist Management
- `GET /api/watchlist` - Get user's watchlist
- `POST /api/watchlist` - Add cryptocurrency to watchlist
- `DELETE /api/watchlist/:crypto_id` - Remove from watchlist
- `GET /api/watchlist/check/:crypto_id` - Check if in watchlist

## Features in Detail

### Search Functionality
- Real-time search with debouncing
- Autocomplete dropdown with cryptocurrency suggestions
- Search by name or symbol

### Watchlist Management
- Add/remove cryptocurrencies to personal watchlist
- Persistent storage in SQLite database
- Real-time price updates for watchlist items

### Price Charts
- Interactive line charts using Recharts
- Multiple timeframes (1 day, 7 days, 30 days, etc.)
- Responsive design with tooltips

### Trending Cryptocurrencies
- Automatically updated hourly via cron job
- Displays currently trending coins from CoinGecko
- Real-time price and change data

## Deployment

### Backend Deployment
The backend can be deployed to any Node.js hosting service:
- Heroku
- DigitalOcean
- AWS EC2
- Railway
- Render

### Frontend Deployment
The frontend can be deployed to static hosting services:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### Environment Variables for Production
```
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
COINMARKETCAP_API_KEY=your_production_api_key
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [CoinMarketCap](https://coinmarketcap.com/) for providing cryptocurrency data
- [Recharts](https://recharts.org/) for charting components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide](https://lucide.dev/) for icons 