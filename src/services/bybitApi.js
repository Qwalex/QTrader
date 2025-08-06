const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/config');

class BybitAPI {
  constructor() {
    this.baseUrl = config.bybit.baseUrl;
    this.apiKey = config.bybit.apiKey;
    this.secretKey = config.bybit.secretKey;
  }

  // Генерация подписи для приватных запросов
  generateSignature(params, timestamp) {
    const queryString = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const signString = timestamp + this.apiKey + '5000' + queryString;
    return crypto.createHmac('sha256', this.secretKey).update(signString).digest('hex');
  }

  // Получение исторических свечей
  async getKlineData(symbol, interval = '15', limit = 200) {
    try {
      const response = await axios.get(`${this.baseUrl}/v5/market/kline`, {
        params: {
          category: 'spot',
          symbol: symbol,
          interval: interval,
          limit: limit
        }
      });

      if (response.data.retCode === 0) {
        return response.data.result.list.map(candle => ({
          timestamp: parseInt(candle[0]),
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
          volume: parseFloat(candle[5])
        }));
      } else {
        throw new Error(`Bybit API Error: ${response.data.retMsg}`);
      }
    } catch (error) {
      console.error('Ошибка получения данных свечей:', error.message);
      throw error;
    }
  }

  // Получение текущих цен
  async getTickerPrice(symbol) {
    try {
      const response = await axios.get(`${this.baseUrl}/v5/market/tickers`, {
        params: {
          category: 'spot',
          symbol: symbol
        }
      });

      if (response.data.retCode === 0 && response.data.result.list.length > 0) {
        const ticker = response.data.result.list[0];
        return {
          symbol: ticker.symbol,
          price: parseFloat(ticker.lastPrice),
          volume24h: parseFloat(ticker.volume24h),
          change24h: parseFloat(ticker.price24hPcnt)
        };
      } else {
        throw new Error(`Bybit API Error: ${response.data.retMsg}`);
      }
    } catch (error) {
      console.error('Ошибка получения текущей цены:', error.message);
      throw error;
    }
  }

  // Получение информации о символе
  async getSymbolInfo(symbol) {
    try {
      const response = await axios.get(`${this.baseUrl}/v5/market/instruments-info`, {
        params: {
          category: 'spot',
          symbol: symbol
        }
      });

      if (response.data.retCode === 0 && response.data.result.list.length > 0) {
        const info = response.data.result.list[0];
        return {
          symbol: info.symbol,
          baseCoin: info.baseCoin,
          quoteCoin: info.quoteCoin,
          minOrderQty: parseFloat(info.lotSizeFilter.minOrderQty),
          maxOrderQty: parseFloat(info.lotSizeFilter.maxOrderQty),
          tickSize: parseFloat(info.priceFilter.tickSize),
          minOrderAmt: parseFloat(info.priceFilter.minOrderAmt)
        };
      } else {
        throw new Error(`Bybit API Error: ${response.data.retMsg}`);
      }
    } catch (error) {
      console.error('Ошибка получения информации о символе:', error.message);
      throw error;
    }
  }

  // Получение стакана заявок
  async getOrderBook(symbol, limit = 25) {
    try {
      const response = await axios.get(`${this.baseUrl}/v5/market/orderbook`, {
        params: {
          category: 'spot',
          symbol: symbol,
          limit: limit
        }
      });

      if (response.data.retCode === 0) {
        return {
          symbol: response.data.result.s,
          bids: response.data.result.b.map(bid => ({
            price: parseFloat(bid[0]),
            size: parseFloat(bid[1])
          })),
          asks: response.data.result.a.map(ask => ({
            price: parseFloat(ask[0]),
            size: parseFloat(ask[1])
          }))
        };
      } else {
        throw new Error(`Bybit API Error: ${response.data.retMsg}`);
      }
    } catch (error) {
      console.error('Ошибка получения стакана заявок:', error.message);
      throw error;
    }
  }

  // Получение последних сделок
  async getRecentTrades(symbol, limit = 100) {
    try {
      const response = await axios.get(`${this.baseUrl}/v5/market/recent-trade`, {
        params: {
          category: 'spot',
          symbol: symbol,
          limit: limit
        }
      });

      if (response.data.retCode === 0) {
        return response.data.result.list.map(trade => ({
          timestamp: parseInt(trade[0]),
          price: parseFloat(trade[1]),
          quantity: parseFloat(trade[2]),
          side: trade[3]
        }));
      } else {
        throw new Error(`Bybit API Error: ${response.data.retMsg}`);
      }
    } catch (error) {
      console.error('Ошибка получения последних сделок:', error.message);
      throw error;
    }
  }

  // Получение баланса (для демо-режима возвращаем фиктивные данные)
  async getBalance() {
    if (config.botMode === 'demo') {
      return {
        totalEquity: config.demo.balance,
        availableBalance: config.demo.balance * 0.8,
        usedMargin: config.demo.balance * 0.2
      };
    }

    try {
      const timestamp = Date.now().toString();
      const params = {
        accountType: 'UNIFIED',
        coin: 'USDT'
      };

      const signature = this.generateSignature(params, timestamp);

      const response = await axios.get(`${this.baseUrl}/v5/account/wallet-balance`, {
        params: params,
        headers: {
          'X-BAPI-API-KEY': this.apiKey,
          'X-BAPI-SIGN': signature,
          'X-BAPI-SIGN-TYPE': '2',
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-RECV-WINDOW': '5000'
        }
      });

      if (response.data.retCode === 0) {
        return response.data.result.list[0];
      } else {
        throw new Error(`Bybit API Error: ${response.data.retMsg}`);
      }
    } catch (error) {
      console.error('Ошибка получения баланса:', error.message);
      throw error;
    }
  }
}

module.exports = BybitAPI; 