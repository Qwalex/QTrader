# 🤖 Торговый Бот - Стратегия Пробития Уровней

Современный торговый бот с веб-интерфейсом для автоматической торговли на основе стратегии пробития уровней поддержки и сопротивления. Бот использует API Bybit для получения реальных рыночных данных и работает в демо-режиме.

## 🚀 Особенности

- **Стратегия пробития уровней** - автоматическое определение уровней поддержки и сопротивления
- **Продвинутый анализ тренда** - многоуровневая система определения направления и силы тренда
- **Технический анализ** - RSI, SMA (20/50/200), MACD индикаторы для фильтрации сигналов
- **Умная фильтрация сигналов** - блокировка сигналов против тренда, усиление сигналов по тренду
- **100+ криптовалют** - поддержка всех основных и альтернативных криптовалют
- **Демо-режим** - безопасная торговля на виртуальном балансе
- **Веб-интерфейс** - современный и удобный UI для управления с отображением тренда
- **API Bybit** - реальные рыночные данные
- **Управление рисками** - автоматические стоп-лоссы и тейк-профиты
- **Ручная торговля** - возможность открывать позиции вручную

## 📋 Требования

- Node.js 16+
- npm или yarn
- API ключ Bybit (для демо-режима не обязателен)

## 🛠 Установка

1. **Клонируйте репозиторий:**
```bash
git clone https://github.com/your-username/trading-bot-breakout.git
cd trading-bot-breakout
```

2. **Установите зависимости:**
```bash
npm install
```

3. **Настройте конфигурацию:**
```bash
cp .env.example .env
```

4. **Отредактируйте .env файл:**
```env
# API Bybit (для демо-режима можно оставить пустыми)
BYBIT_API_KEY=your_bybit_api_key_here
BYBIT_SECRET_KEY=your_bybit_secret_key_here
BYBIT_TESTNET=true

# Настройки бота
BOT_MODE=demo
DEMO_BALANCE=10000
RISK_PERCENT=2
MAX_POSITIONS=3

# Символы для торговли (100+ криптовалют)
TRADING_SYMBOLS=BTCUSDT,ETHUSDT,XRPUSDT,BNBUSDT,SOLUSDT,USDCUSDT,TRXUSDT,DOGEUSDT,ADAUSDT,AVAXUSDT,LTCUSDT,LEOUSDT,TONUSDT,SHIBUSDT,UNIUSDT,LINKUSDT,BCHUSDT,HBARUSDT,XLMUSDT,SUIUSDT,ATOMUSDT,NEARUSDT,APTUSDT,OPUSDT,ARBUSDT,MATICUSDT,FTMUSDT,ALGOUSDT,VETUSDT,ICPUSDT,THETAUSDT,ETCUSDT,MANAUSDT,SANDUSDT,AXSUSDT,CRVUSDT,AAVEUSDT,COMPUSDT,MKRUSDT,SNXUSDT,CAKEUSDT,CHZUSDT,HOTUSDT,ENJUSDT,ANKRUSDT,ZILUSDT,ONEUSDT,ICXUSDT,QTUMUSDT,NEOUSDT,ONTUSDT,DOTUSDT,FILUSDT,EGLDUSDT,ALICEUSDT,FLOWUSDT,ROSEUSDT,OCEANUSDT,RSRUSDT,STORJUSDT,SKLUSDT,GRTUSDT,1INCHUSDT,REEFUSDT,ALPHAUSDT,AUDIOUSDT,CTSIUSDT,OMGUSDT,ZRXUSDT,BATUSDT,ZECUSDT,XMRUSDT,DASHUSDT,WAVESUSDT,XTZUSDT,TRBUSDT,SRMUSDT,RAYUSDT,SUSHIUSDT,YFIUSDT,BALUSDT,RENUSDT,KNCUSDT,BNTUSDT,REPUSDT,ZENUSDT,SCUSDT,BCNUSDT,STEEMUSDT,NANOUSDT,BTGUSDT,ETNUSDT,GRINUSDT,BEAMUSDT
```

## 🚀 Запуск

### Разработка
```bash
npm run dev
```

### Продакшн
```bash
npm start
```

После запуска откройте браузер и перейдите по адресу: `http://localhost:3000`

## 📊 Стратегия торговли

### Принцип работы

Бот использует продвинутую стратегию пробития уровней с учетом тренда:

1. **Уровни поддержки и сопротивления** - автоматический поиск ключевых ценовых уровней
2. **Анализ тренда** - многоуровневая система определения направления и силы тренда
3. **Пробития уровней** - моменты, когда цена пробивает важные уровни
4. **Умная фильтрация** - блокировка сигналов против тренда, усиление сигналов по тренду
5. **Технические индикаторы** - RSI, SMA (20/50/200), MACD для дополнительной фильтрации

### 🎯 Анализ Тренда

Бот анализирует тренд по следующим критериям:
- **Позиция цены** относительно SMA20, SMA50, SMA200
- **Наклон линий** скользящих средних
- **Сила тренда** от 0 до 3 баллов
- **Направление** - STRONG_UP, UP, WEAK_UP, SIDEWAYS, WEAK_DOWN, DOWN, STRONG_DOWN

### Сигналы на покупку (LONG)
- Цена пробивает уровень сопротивления сверху вниз
- RSI < 70 (не перекупленность)
- **Тренд**: предпочтительно восходящий (UP/STRONG_UP)
- **Блокировка**: при сильном нисходящем тренде (DOWN/STRONG_DOWN)
- MACD > Signal (бычий MACD)

### Сигналы на продажу (SHORT)
- Цена пробивает уровень поддержки снизу вверх
- RSI > 30 (не перепроданность)
- **Тренд**: предпочтительно нисходящий (DOWN/STRONG_DOWN)
- **Блокировка**: при сильном восходящем тренде (UP/STRONG_UP)
- MACD < Signal (медвежий MACD)

### 📈 Подробная документация по анализу тренда: [TREND_ANALYSIS.md](TREND_ANALYSIS.md)

### Управление рисками
- **Стоп-лосс**: 2% от цены входа
- **Тейк-профит**: 4% от цены входа
- **Размер позиции**: рассчитывается на основе риска (2% от баланса)
- **Максимум позиций**: 3 одновременно

## 🪙 Поддерживаемые криптовалюты

### Топ-10 криптовалют
- **BTCUSDT** - Bitcoin (Биткоин)
- **ETHUSDT** - Ethereum (Эфириум)
- **XRPUSDT** - XRP (Рипл)
- **BNBUSDT** - BNB (Binance Coin)
- **SOLUSDT** - Solana (Солана)
- **USDCUSDT** - USD Coin
- **TRXUSDT** - TRON (Трон)
- **DOGEUSDT** - Dogecoin (Догекоин)
- **ADAUSDT** - Cardano (Кардано)
- **AVAXUSDT** - Avalanche (Аваланч)

### Категории криптовалют
- **Основные криптовалюты** - Bitcoin, Ethereum, XRP и др.
- **DeFi токены** - Aave, Compound, Uniswap и др.
- **Игровые токены** - Axie Infinity, Decentraland, The Sandbox
- **Смарт-контракты** - Solana, Cardano, Polkadot и др.
- **Приватные криптовалюты** - Monero, Zcash, Dash
- **Платформенные токены** - Binance Coin, KuCoin Token

**📋 Полный список из 100+ криптовалют**: [CRYPTO_SYMBOLS.md](CRYPTO_SYMBOLS.md)

## 🖥 Веб-интерфейс

### Основные разделы

1. **Статус бота** - управление запуском/остановкой
2. **Статистика** - баланс, PnL, процент побед
3. **Активные позиции** - текущие открытые позиции
4. **История сделок** - завершенные сделки
5. **Анализ рынка** - технический анализ символов
6. **Ручная торговля** - открытие/закрытие позиций вручную

### Функции

- **Автообновление** - данные обновляются каждые 10 секунд
- **Уведомления** - всплывающие уведомления о событиях
- **Адаптивный дизайн** - работает на всех устройствах
- **Темная тема** - современный интерфейс
- **Карточки символов** - красивое отображение всех криптовалют

## 🔧 API Endpoints

### Управление ботом
- `POST /api/bot/start` - запуск бота
- `POST /api/bot/stop` - остановка бота
- `GET /api/bot/status` - статус бота

### Позиции
- `POST /api/positions/open` - открытие позиции
- `POST /api/positions/close` - закрытие позиции
- `GET /api/trades` - история сделок

### Демо-режим
- `POST /api/demo/reset` - сброс демо-баланса

### Рыночные данные
- `GET /api/market/symbols` - список торгуемых символов (100+)
- `GET /api/market/kline/:symbol` - исторические данные свечей
- `GET /api/market/ticker/:symbol` - текущая цена

### Анализ
- `GET /api/analysis/:symbol` - полный анализ символа (уровни, индикаторы, сигналы)

## 🤝 Вклад

Приветствуются любые вклады! Пожалуйста, создавайте Pull Requests или Issues.

## 📄 Лицензия

Этот проект лицензирован под лицензией MIT. 