const config = require('../config/config');

class PositionManager {
  constructor() {
    this.positions = new Map();
    this.balance = config.demo.balance;
    this.riskPercent = config.demo.riskPercent;
    this.maxPositions = config.demo.maxPositions;
    this.tradeHistory = [];
  }

  // Расчет размера позиции на основе риска
  calculatePositionSize(entryPrice, stopLoss, availableBalance) {
    const riskAmount = availableBalance * (this.riskPercent / 100);
    const priceDifference = Math.abs(entryPrice - stopLoss);
    
    if (priceDifference === 0) {
      return 0;
    }

    const positionSize = riskAmount / priceDifference;
    return Math.min(positionSize, availableBalance * 0.95); // Максимум 95% доступного баланса
  }

  // Открытие новой позиции
  openPosition(symbol, signal, currentPrice) {
    // Проверка лимита позиций
    if (this.positions.size >= this.maxPositions) {
      return { success: false, error: 'Достигнут лимит максимального количества позиций' };
    }

    // Проверка существующей позиции по символу
    if (this.positions.has(symbol)) {
      return { success: false, error: 'Позиция по данному символу уже существует' };
    }

    try {
      const positionType = signal.type === 'BUY' ? 'LONG' : 'SHORT';
      const entryPrice = currentPrice;
      
      // Расчет стоп-лосса (2% от цены входа)
      const stopLossPercent = 0.02;
      const stopLoss = positionType === 'LONG' 
        ? entryPrice * (1 - stopLossPercent)
        : entryPrice * (1 + stopLossPercent);

      // Расчет тейк-профита (4% от цены входа)
      const takeProfitPercent = 0.04;
      const takeProfit = positionType === 'LONG'
        ? entryPrice * (1 + takeProfitPercent)
        : entryPrice * (1 - takeProfitPercent);

      // Расчет размера позиции
      const availableBalance = this.getAvailableBalance();
      const positionSize = this.calculatePositionSize(entryPrice, stopLoss, availableBalance);

      if (positionSize <= 0) {
        return { success: false, error: 'Недостаточно средств для открытия позиции' };
      }

      const position = {
        id: this.generatePositionId(),
        symbol: symbol,
        type: positionType,
        entryPrice: entryPrice,
        stopLoss: stopLoss,
        takeProfit: takeProfit,
        size: positionSize,
        entryTime: Date.now(),
        status: 'OPEN',
        signal: signal,
        pnl: 0,
        pnlPercent: 0
      };

      this.positions.set(symbol, position);
      
      // Обновление баланса
      this.balance -= positionSize;

      // Добавление в историю
      this.tradeHistory.push({
        action: 'OPEN',
        position: { ...position },
        timestamp: Date.now()
      });

      return {
        success: true,
        position: position,
        message: `Позиция ${positionType} открыта по ${symbol}`
      };

    } catch (error) {
      console.error('Ошибка открытия позиции:', error);
      return { success: false, error: error.message };
    }
  }

  // Закрытие позиции
  closePosition(symbol, reason = 'MANUAL') {
    const position = this.positions.get(symbol);
    
    if (!position) {
      return { success: false, error: 'Позиция не найдена' };
    }

    try {
      const currentPrice = this.getCurrentPrice(symbol);
      const pnl = this.calculatePnL(position, currentPrice);
      
      // Обновление баланса
      this.balance += position.size + pnl;

      // Обновление позиции
      position.status = 'CLOSED';
      position.exitPrice = currentPrice;
      position.exitTime = Date.now();
      position.pnl = pnl;
      position.pnlPercent = (pnl / position.size) * 100;
      position.closeReason = reason;

      // Добавление в историю
      this.tradeHistory.push({
        action: 'CLOSE',
        position: { ...position },
        timestamp: Date.now()
      });

      // Удаление из активных позиций
      this.positions.delete(symbol);

      return {
        success: true,
        position: position,
        message: `Позиция по ${symbol} закрыта. PnL: ${pnl.toFixed(2)}`
      };

    } catch (error) {
      console.error('Ошибка закрытия позиции:', error);
      return { success: false, error: error.message };
    }
  }

  // Обновление позиций (проверка стоп-лоссов и тейк-профитов)
  updatePositions(marketData) {
    const closedPositions = [];

    for (const [symbol, position] of this.positions) {
      if (position.status !== 'OPEN') continue;

      const currentPrice = marketData[symbol]?.price;
      if (!currentPrice) continue;

      // Проверка стоп-лосса
      if (this.checkStopLoss(position, currentPrice)) {
        const result = this.closePosition(symbol, 'STOP_LOSS');
        if (result.success) {
          closedPositions.push(result.position);
        }
        continue;
      }

      // Проверка тейк-профита
      if (this.checkTakeProfit(position, currentPrice)) {
        const result = this.closePosition(symbol, 'TAKE_PROFIT');
        if (result.success) {
          closedPositions.push(result.position);
        }
        continue;
      }

      // Обновление PnL
      position.pnl = this.calculatePnL(position, currentPrice);
      position.pnlPercent = (position.pnl / position.size) * 100;
    }

    return closedPositions;
  }

  // Проверка стоп-лосса
  checkStopLoss(position, currentPrice) {
    if (position.type === 'LONG') {
      return currentPrice <= position.stopLoss;
    } else {
      return currentPrice >= position.stopLoss;
    }
  }

  // Проверка тейк-профита
  checkTakeProfit(position, currentPrice) {
    if (position.type === 'LONG') {
      return currentPrice >= position.takeProfit;
    } else {
      return currentPrice <= position.takeProfit;
    }
  }

  // Расчет PnL
  calculatePnL(position, currentPrice) {
    if (position.type === 'LONG') {
      return (currentPrice - position.entryPrice) * position.size;
    } else {
      return (position.entryPrice - currentPrice) * position.size;
    }
  }

  // Получение доступного баланса
  getAvailableBalance() {
    const usedBalance = Array.from(this.positions.values())
      .filter(p => p.status === 'OPEN')
      .reduce((sum, p) => sum + p.size, 0);
    
    return this.balance - usedBalance;
  }

  // Получение текущей цены (для демо-режима)
  getCurrentPrice(symbol) {
    // В реальной реализации здесь будет запрос к API
    // Для демо-режима возвращаем случайную цену в диапазоне ±5%
    const basePrice = 100; // Базовая цена для демо
    const variation = (Math.random() - 0.5) * 0.1; // ±5%
    return basePrice * (1 + variation);
  }

  // Генерация ID позиции
  generatePositionId() {
    return `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Получение статистики
  getStatistics() {
    const totalTrades = this.tradeHistory.filter(t => t.action === 'CLOSE').length;
    const winningTrades = this.tradeHistory.filter(t => 
      t.action === 'CLOSE' && t.position.pnl > 0
    ).length;
    
    const totalPnL = this.tradeHistory
      .filter(t => t.action === 'CLOSE')
      .reduce((sum, t) => sum + t.position.pnl, 0);

    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    return {
      totalBalance: this.balance,
      availableBalance: this.getAvailableBalance(),
      activePositions: this.positions.size,
      totalTrades: totalTrades,
      winningTrades: winningTrades,
      winRate: winRate,
      totalPnL: totalPnL,
      totalPnLPercent: ((this.balance - config.demo.balance) / config.demo.balance) * 100
    };
  }

  // Получение активных позиций
  getActivePositions() {
    return Array.from(this.positions.values());
  }

  // Получение истории сделок
  getTradeHistory(limit = 50) {
    return this.tradeHistory
      .filter(t => t.action === 'CLOSE')
      .slice(-limit)
      .reverse();
  }

  // Сброс демо-баланса
  resetDemoBalance() {
    this.balance = config.demo.balance;
    this.positions.clear();
    this.tradeHistory = [];
    return { success: true, message: 'Демо-баланс сброшен' };
  }
}

module.exports = PositionManager; 