const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const TradingBot = require('../trading/tradingBot');
const config = require('../config/config');

class TradingBotServer {
  constructor() {
    this.app = express();
    this.bot = new TradingBot();
    this.setupMiddleware();
    this.setupRoutes();
  }

  // Настройка middleware
  setupMiddleware() {
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
          fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(__dirname + '/public'));
  }

  // Настройка маршрутов
  setupRoutes() {
    // API маршруты
    this.app.use('/api', this.createApiRoutes());
    
    // Веб-интерфейс
    this.app.get('/', (req, res) => {
      res.sendFile(__dirname + '/public/index.html');
    });
    
    // Fallback для всех остальных маршрутов
    this.app.get('*', (req, res) => {
      res.sendFile(__dirname + '/public/index.html');
    });
  }

  // Создание API маршрутов
  createApiRoutes() {
    const router = express.Router();

    // Управление ботом
    router.post('/bot/start', async (req, res) => {
      try {
        const result = await this.bot.start();
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    router.post('/bot/stop', (req, res) => {
      try {
        const result = this.bot.stop();
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    router.get('/bot/status', (req, res) => {
      try {
        const status = this.bot.getStatus();
        res.json({ success: true, data: status });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Анализ рынка
    router.get('/analysis/:symbol', (req, res) => {
      try {
        const { symbol } = req.params;
        const analysis = this.bot.getAnalysis(symbol);
        res.json({ success: true, data: analysis });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Управление позициями
    router.post('/positions/open', async (req, res) => {
      try {
        const { symbol, type, size } = req.body;
        const result = await this.bot.manualOpenPosition(symbol, type, size);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    router.post('/positions/close', (req, res) => {
      try {
        const { symbol } = req.body;
        const result = this.bot.manualClosePosition(symbol);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // История сделок
    router.get('/trades', (req, res) => {
      try {
        const { limit = 50 } = req.query;
        const history = this.bot.getTradeHistory(parseInt(limit));
        res.json({ success: true, data: history });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Демо-управление
    router.post('/demo/reset', (req, res) => {
      try {
        const result = this.bot.resetDemoBalance();
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Рыночные данные
    router.get('/market/symbols', (req, res) => {
      try {
        res.json({ success: true, data: config.symbols });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Статистика
    router.get('/statistics', (req, res) => {
      try {
        const status = this.bot.getStatus();
        res.json({ success: true, data: status.statistics });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    return router;
  }

  // Запуск сервера
  start() {
    const port = config.server.port;
    
    this.app.listen(port, () => {
      console.log(`🌐 Веб-сервер запущен на порту ${port}`);
      console.log(`📊 Демо-режим: ${config.botMode === 'demo' ? 'Включен' : 'Выключен'}`);
      console.log(`💰 Начальный баланс: $${config.demo.balance}`);
      console.log(`📈 Символы для торговли: ${config.symbols.join(', ')}`);
      console.log(`🔗 Веб-интерфейс: http://localhost:${port}`);
    });
  }
}

module.exports = TradingBotServer; 