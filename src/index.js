const TradingBotServer = require('./server/app');
const config = require('./config/config');

// Создание и запуск сервера
const server = new TradingBotServer();

// Обработка необработанных исключений
process.on('uncaughtException', (error) => {
  console.error('❌ Необработанное исключение:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Необработанное отклонение промиса:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал SIGINT, завершение работы...');
  server.bot.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал SIGTERM, завершение работы...');
  server.bot.stop();
  process.exit(0);
});

// Запуск сервера
try {
  server.start();
} catch (error) {
  console.error('❌ Ошибка запуска сервера:', error);
  process.exit(1);
} 