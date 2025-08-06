require('dotenv').config();

const config = {
  // Режим работы бота
  botMode: process.env.BOT_MODE || 'demo',
  
  // Демо настройки
  demo: {
    balance: parseFloat(process.env.DEMO_BALANCE) || 10000,
    riskPercent: parseFloat(process.env.RISK_PERCENT) || 2,
    maxPositions: parseInt(process.env.MAX_POSITIONS) || 3
  },
  
  // API Bybit
  bybit: {
    apiKey: process.env.BYBIT_API_KEY,
    secretKey: process.env.BYBIT_SECRET_KEY,
    testnet: process.env.BYBIT_TESTNET === 'true',
    baseUrl: process.env.BYBIT_TESTNET === 'true' 
      ? 'https://api-testnet.bybit.com' 
      : 'https://api.bybit.com',
    wsUrl: process.env.BYBIT_TESTNET === 'true'
      ? 'wss://stream-testnet.bybit.com'
      : 'wss://stream.bybit.com'
  },
  
  // Настройки стратегии
  strategy: {
    breakoutConfirmationCandles: parseInt(process.env.BREAKOUT_CONFIRMATION_CANDLES) || 3,
    supportResistancePeriod: parseInt(process.env.SUPPORT_RESISTANCE_PERIOD) || 20,
    minVolumeThreshold: parseFloat(process.env.MIN_VOLUME_THRESHOLD) || 1000000
  },
  
  // Символы для торговли
  symbols: (process.env.TRADING_SYMBOLS || 'BTCUSDT,ETHUSDT,SOLUSDT,ADAUSDT,DOTUSDT').split(','),
  
  // Настройки сервера
  server: {
    port: parseInt(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || 'development'
  }
};

module.exports = config; 