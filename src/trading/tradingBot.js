const BybitAPI = require('../services/bybitApi');
const BreakoutStrategy = require('../strategies/breakoutStrategy');
const PositionManager = require('./positionManager');
const config = require('../config/config');

class TradingBot {
  constructor() {
    this.api = new BybitAPI();
    this.strategy = new BreakoutStrategy();
    this.positionManager = new PositionManager();
    this.isRunning = false;
    this.analysisInterval = null;
    this.marketData = new Map();
    this.lastAnalysis = new Map();
  }

  // Запуск бота
  async start() {
    if (this.isRunning) {
      return { success: false, error: 'Бот уже запущен' };
    }

    try {
      console.log('🚀 Запуск торгового бота...');
      
      // Инициализация данных
      await this.initializeMarketData();
      
      // Запуск анализа
      this.isRunning = true;
      this.startAnalysis();
      
      console.log('✅ Торговый бот запущен успешно');
      return { success: true, message: 'Бот запущен' };
      
    } catch (error) {
      console.error('❌ Ошибка запуска бота:', error);
      return { success: false, error: error.message };
    }
  }

  // Остановка бота
  stop() {
    if (!this.isRunning) {
      return { success: false, error: 'Бот не запущен' };
    }

    try {
      console.log('🛑 Остановка торгового бота...');
      
      this.isRunning = false;
      
      if (this.analysisInterval) {
        clearInterval(this.analysisInterval);
        this.analysisInterval = null;
      }
      
      console.log('✅ Торговый бот остановлен');
      return { success: true, message: 'Бот остановлен' };
      
    } catch (error) {
      console.error('❌ Ошибка остановки бота:', error);
      return { success: false, error: error.message };
    }
  }

  // Инициализация рыночных данных
  async initializeMarketData() {
    console.log('📊 Инициализация рыночных данных...');
    
    for (const symbol of config.symbols) {
      try {
        // Получение исторических данных
        const candles = await this.api.getKlineData(symbol, '15', 200);
        this.marketData.set(symbol, {
          candles: candles,
          lastUpdate: Date.now()
        });
        
        console.log(`✅ Данные загружены для ${symbol}`);
        
      } catch (error) {
        console.error(`❌ Ошибка загрузки данных для ${symbol}:`, error.message);
      }
    }
  }

  // Запуск анализа
  startAnalysis() {
    // Анализ каждые 5 минут
    this.analysisInterval = setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        await this.performAnalysis();
      } catch (error) {
        console.error('❌ Ошибка анализа:', error);
      }
    }, 5 * 60 * 1000); // 5 минут

    // Немедленный первый анализ
    this.performAnalysis();
  }

  // Выполнение анализа
  async performAnalysis() {
    console.log('🔍 Выполнение анализа рынка...');
    
    const analysisResults = [];
    
    for (const symbol of config.symbols) {
      try {
        // Обновление данных
        await this.updateMarketData(symbol);
        
        // Получение данных
        const marketData = this.marketData.get(symbol);
        if (!marketData || marketData.candles.length < 100) {
          continue;
        }
        
        // Анализ стратегии
        const analysis = this.strategy.analyze(marketData.candles);
        
        if (analysis.error) {
          console.error(`❌ Ошибка анализа ${symbol}:`, analysis.error);
          continue;
        }
        
        // Сохранение результатов
        this.lastAnalysis.set(symbol, analysis);
        analysisResults.push({ symbol, analysis });
        
        // Проверка сигналов
        if (analysis.signal) {
          await this.processSignal(symbol, analysis.signal, analysis.currentPrice);
        }
        
      } catch (error) {
        console.error(`❌ Ошибка анализа ${symbol}:`, error);
      }
    }
    
    // Обновление позиций
    await this.updatePositions();
    
    console.log(`✅ Анализ завершен. Обработано символов: ${analysisResults.length}`);
    return analysisResults;
  }

  // Обновление рыночных данных
  async updateMarketData(symbol) {
    try {
      const newCandles = await this.api.getKlineData(symbol, '15', 50);
      const currentData = this.marketData.get(symbol);
      
      if (currentData) {
        // Объединение с существующими данными
        const allCandles = [...currentData.candles, ...newCandles];
        
        // Удаление дубликатов
        const uniqueCandles = this.removeDuplicateCandles(allCandles);
        
        // Ограничение количества свечей
        const limitedCandles = uniqueCandles.slice(-200);
        
        this.marketData.set(symbol, {
          candles: limitedCandles,
          lastUpdate: Date.now()
        });
      }
      
    } catch (error) {
      console.error(`❌ Ошибка обновления данных ${symbol}:`, error);
    }
  }

  // Удаление дубликатов свечей
  removeDuplicateCandles(candles) {
    const seen = new Set();
    return candles.filter(candle => {
      const key = candle.timestamp;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Обработка торгового сигнала
  async processSignal(symbol, signal, currentPrice) {
    console.log(`📈 Сигнал ${signal.type} для ${symbol} по цене ${currentPrice}`);
    
    try {
      // Проверка существующих позиций
      const existingPosition = this.positionManager.positions.get(symbol);
      if (existingPosition) {
        console.log(`⚠️ Позиция по ${symbol} уже существует`);
        return;
      }
      
      // Открытие позиции
      const result = this.positionManager.openPosition(symbol, signal, currentPrice);
      
      if (result.success) {
        console.log(`✅ ${result.message}`);
        console.log(`💰 Размер позиции: ${result.position.size.toFixed(2)}`);
        console.log(`🛑 Стоп-лосс: ${result.position.stopLoss.toFixed(4)}`);
        console.log(`🎯 Тейк-профит: ${result.position.takeProfit.toFixed(4)}`);
      } else {
        console.log(`❌ Ошибка открытия позиции: ${result.error}`);
      }
      
    } catch (error) {
      console.error(`❌ Ошибка обработки сигнала для ${symbol}:`, error);
    }
  }

  // Обновление позиций
  async updatePositions() {
    try {
      // Получение текущих цен
      const marketData = {};
      
      for (const symbol of config.symbols) {
        try {
          const ticker = await this.api.getTickerPrice(symbol);
          marketData[symbol] = ticker;
        } catch (error) {
          console.error(`❌ Ошибка получения цены ${symbol}:`, error);
        }
      }
      
      // Обновление позиций
      const closedPositions = this.positionManager.updatePositions(marketData);
      
      if (closedPositions.length > 0) {
        console.log(`🔒 Закрыто позиций: ${closedPositions.length}`);
        closedPositions.forEach(pos => {
          console.log(`📊 ${pos.symbol}: ${pos.closeReason}, PnL: ${pos.pnl.toFixed(2)}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Ошибка обновления позиций:', error);
    }
  }

  // Получение статуса бота
  getStatus() {
    const statistics = this.positionManager.getStatistics();
    const activePositions = this.positionManager.getActivePositions();
    
    return {
      isRunning: this.isRunning,
      statistics: statistics,
      activePositions: activePositions,
      symbols: config.symbols,
      lastAnalysis: Object.fromEntries(this.lastAnalysis),
      marketDataStatus: Array.from(this.marketData.entries()).map(([symbol, data]) => ({
        symbol,
        candlesCount: data.candles.length,
        lastUpdate: data.lastUpdate
      }))
    };
  }

  // Получение анализа для конкретного символа
  getAnalysis(symbol) {
    return this.lastAnalysis.get(symbol) || null;
  }

  // Ручное открытие позиции
  async manualOpenPosition(symbol, type, size) {
    if (!this.isRunning) {
      return { success: false, error: 'Бот не запущен' };
    }
    
    try {
      const ticker = await this.api.getTickerPrice(symbol);
      const signal = {
        type: type === 'LONG' ? 'BUY' : 'SELL',
        level: ticker.price,
        currentPrice: ticker.price,
        strength: 1,
        volume: ticker.volume24h,
        timestamp: Date.now()
      };
      
      return this.positionManager.openPosition(symbol, signal, ticker.price);
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Ручное закрытие позиции
  manualClosePosition(symbol) {
    return this.positionManager.closePosition(symbol, 'MANUAL');
  }

  // Сброс демо-баланса
  resetDemoBalance() {
    return this.positionManager.resetDemoBalance();
  }

  // Получение истории сделок
  getTradeHistory(limit = 50) {
    return this.positionManager.getTradeHistory(limit);
  }
}

module.exports = TradingBot; 