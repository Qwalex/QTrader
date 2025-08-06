class TradingBotUI {
    constructor() {
        this.apiBase = '/api';
        this.updateInterval = null;
        this.init();
    }

    async init() {
        await this.loadSymbols();
        this.setupEventListeners();
        this.startAutoUpdate();
        await this.updateStatus();
    }

    // Загрузка символов
    async loadSymbols() {
        try {
            const response = await fetch(`${this.apiBase}/market/symbols`);
            const data = await response.json();
            
            if (data.success) {
                const symbols = data.data;
                this.populateSymbolSelects(symbols);
            }
        } catch (error) {
            console.error('Ошибка загрузки символов:', error);
            this.showNotification('Ошибка загрузки символов', 'danger');
        }
    }

    // Заполнение селектов символами
    populateSymbolSelects(symbols) {
        const selects = ['symbolSelect', 'manualSymbol', 'closeSymbol'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Выберите символ...</option>';
                symbols.forEach(symbol => {
                    const option = document.createElement('option');
                    option.value = symbol;
                    option.textContent = symbol;
                    option.className = 'symbol-select-option';
                    select.appendChild(option);
                });
            }
        });

        // Добавляем отображение доступных символов в интерфейсе
    }

    // Отображение доступных символов
    displayAvailableSymbols(symbols) {
        // Отображение в виде бейджей в старой секции
        const analysisTab = document.getElementById('analysis');
        if (analysisTab) {
            // Находим или создаем контейнер для символов
            let symbolsContainer = analysisTab.querySelector('.available-symbols');
            if (!symbolsContainer) {
                symbolsContainer = document.createElement('div');
                symbolsContainer.className = 'available-symbols mt-3';
                analysisTab.appendChild(symbolsContainer);
            }

            let html = '<h6 class="mb-3">Быстрый выбор символов:</h6>';
            html += '<div class="row">';
            
            symbols.forEach(symbol => {
                html += `
                    <div class="col-md-2 col-sm-4 col-6 mb-2">
                        <div class="symbol-badge" onclick="tradingBotUI.selectSymbol('${symbol}')">
                            ${symbol}
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            symbolsContainer.innerHTML = html;
        }

        // Отображение в виде карточек в новой секции
        this.displaySymbolCards(symbols);
    }

    // Отображение символов в виде карточек
    async displaySymbolCards(symbols) {
        const symbolsGrid = document.getElementById('symbolsGrid');
        if (!symbolsGrid) return;

        let html = '';
        
        for (const symbol of symbols) {
            try {
                // Получаем текущую цену для символа
                const response = await fetch(`${this.apiBase}/market/ticker/${symbol}`);
                const data = await response.json();
                const price = data.success ? data.data.price : 'N/A';
                
                html += `
                    <div class="col-lg-3 col-md-4 col-sm-6 mb-3">
                        <div class="symbol-card" onclick="tradingBotUI.selectSymbol('${symbol}')">
                            <div class="symbol-name">${symbol}</div>
                            <div class="symbol-price">$${price}</div>
                            <div class="symbol-status active"></div>
                            <small class="text-muted">Нажмите для анализа</small>
                        </div>
                    </div>
                `;
            } catch (error) {
                // Если не удалось получить цену, показываем без неё
                html += `
                    <div class="col-lg-3 col-md-4 col-sm-6 mb-3">
                        <div class="symbol-card" onclick="tradingBotUI.selectSymbol('${symbol}')">
                            <div class="symbol-name">${symbol}</div>
                            <div class="symbol-price">Цена загружается...</div>
                            <div class="symbol-status inactive"></div>
                            <small class="text-muted">Нажмите для анализа</small>
                        </div>
                    </div>
                `;
            }
        }
        
        symbolsGrid.innerHTML = html;
    }

    // Выбор символа по клику
    selectSymbol(symbol) {
        const symbolSelect = document.getElementById('symbolSelect');
        if (symbolSelect) {
            symbolSelect.value = symbol;
            this.analyzeSymbol();
        }
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Управление ботом
        document.getElementById('startBot').addEventListener('click', () => this.startBot());
        document.getElementById('stopBot').addEventListener('click', () => this.stopBot());
        document.getElementById('resetDemo').addEventListener('click', () => this.resetDemo());

        // Анализ
        document.getElementById('analyzeSymbol').addEventListener('click', () => this.analyzeSymbol());

        // Ручная торговля
        document.getElementById('openPositionForm').addEventListener('submit', (e) => this.openPosition(e));
        document.getElementById('closePositionForm').addEventListener('submit', (e) => this.closePosition(e));

        // Обновление при смене вкладок
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                if (e.target.id === 'positions-tab') {
                    this.loadPositions();
                } else if (e.target.id === 'trades-tab') {
                    this.loadTrades();
                }
            });
        });
    }

    // Запуск бота
    async startBot() {
        try {
            this.setLoading(true);
            const response = await fetch(`${this.apiBase}/bot/start`, { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Бот успешно запущен', 'success');
                await this.updateStatus();
            } else {
                this.showNotification(`Ошибка запуска: ${result.error}`, 'danger');
            }
        } catch (error) {
            this.showNotification('Ошибка запуска бота', 'danger');
        } finally {
            this.setLoading(false);
        }
    }

    // Остановка бота
    async stopBot() {
        try {
            this.setLoading(true);
            const response = await fetch(`${this.apiBase}/bot/stop`, { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Бот остановлен', 'warning');
                await this.updateStatus();
            } else {
                this.showNotification(`Ошибка остановки: ${result.error}`, 'danger');
            }
        } catch (error) {
            this.showNotification('Ошибка остановки бота', 'danger');
        } finally {
            this.setLoading(false);
        }
    }

    // Сброс демо-баланса
    async resetDemo() {
        if (!confirm('Вы уверены, что хотите сбросить демо-баланс? Все позиции будут закрыты.')) {
            return;
        }

        try {
            this.setLoading(true);
            const response = await fetch(`${this.apiBase}/demo/reset`, { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Демо-баланс сброшен', 'success');
                await this.updateStatus();
                this.loadPositions();
                this.loadTrades();
            } else {
                this.showNotification(`Ошибка сброса: ${result.error}`, 'danger');
            }
        } catch (error) {
            this.showNotification('Ошибка сброса демо-баланса', 'danger');
        } finally {
            this.setLoading(false);
        }
    }

    // Анализ символа
    async analyzeSymbol() {
        const symbol = document.getElementById('symbolSelect').value;
        if (!symbol) {
            this.showNotification('Выберите символ для анализа', 'warning');
            return;
        }

        try {
            this.setLoading(true);
            const response = await fetch(`${this.apiBase}/analysis/${symbol}`);
            const result = await response.json();
            
            if (result.success) {
                this.displayAnalysis(result.data);
            } else {
                this.showNotification('Ошибка анализа', 'danger');
            }
        } catch (error) {
            this.showNotification('Ошибка анализа символа', 'danger');
        } finally {
            this.setLoading(false);
        }
    }

    // Отображение анализа
    displayAnalysis(analysis) {
        const container = document.getElementById('analysisResults');
        
        if (analysis.error) {
            container.innerHTML = `<div class="alert alert-danger">${analysis.error}</div>`;
            return;
        }

        const trend = analysis.indicators?.trend;
        const trendClass = this.getTrendClass(trend?.direction);

        let html = `
            <div class="row">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Текущая цена: $${analysis.currentPrice?.toFixed(4) || 'N/A'}</h6>
                        </div>
                        <div class="card-body">
                            <p><strong>RSI:</strong> ${analysis.indicators?.rsi?.toFixed(2) || 'N/A'}</p>
                            <p><strong>SMA20:</strong> ${analysis.indicators?.sma20?.toFixed(4) || 'N/A'}</p>
                            <p><strong>SMA50:</strong> ${analysis.indicators?.sma50?.toFixed(4) || 'N/A'}</p>
                            <p><strong>SMA200:</strong> ${analysis.indicators?.sma200?.toFixed(4) || 'N/A'}</p>
                            <p><strong>Объем:</strong> ${analysis.indicators?.volume?.toLocaleString() || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Анализ тренда</h6>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-${trendClass}">
                                <strong>${trend?.description || 'Недостаточно данных'}</strong><br>
                                <small>Сила: ${trend?.strength || 0}/3</small><br>
                                <small>Направление: ${trend?.direction || 'NEUTRAL'}</small>
                            </div>
                            <p><strong>Цена выше SMA20:</strong> ${trend?.priceAboveSma20 ? 'Да' : 'Нет'}</p>
                            <p><strong>Цена выше SMA50:</strong> ${trend?.priceAboveSma50 ? 'Да' : 'Нет'}</p>
                            <p><strong>Цена выше SMA200:</strong> ${trend?.priceAboveSma200 ? 'Да' : 'Нет'}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Торговый сигнал</h6>
                        </div>
                        <div class="card-body">
        `;

        if (analysis.signal) {
            const signalTrend = analysis.signal.trend;
            const signalTrendClass = this.getTrendClass(signalTrend?.direction);
            
            html += `
                <div class="alert alert-${analysis.signal.type === 'BUY' ? 'success' : 'danger'}">
                    <strong>${analysis.signal.type === 'BUY' ? 'ПОКУПКА' : 'ПРОДАЖА'}</strong><br>
                    Уровень: $${analysis.signal.level?.toFixed(4)}<br>
                    Сила: ${analysis.signal.strength}<br>
                    Объем: ${analysis.signal.volume?.toLocaleString()}
                </div>
                <div class="alert alert-${signalTrendClass}">
                    <strong>Тренд сигнала:</strong> ${signalTrend?.description || 'N/A'}
                </div>
            `;
        } else {
            html += '<div class="alert alert-info">Нет активных сигналов</div>';
        }

        html += `
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    // Получение CSS класса для тренда
    getTrendClass(direction) {
        switch (direction) {
            case 'STRONG_UP':
            case 'UP':
                return 'success';
            case 'WEAK_UP':
                return 'info';
            case 'STRONG_DOWN':
            case 'DOWN':
                return 'danger';
            case 'WEAK_DOWN':
                return 'warning';
            case 'SIDEWAYS':
            case 'NEUTRAL':
            default:
                return 'secondary';
        }
    }

    // Открытие позиции
    async openPosition(e) {
        e.preventDefault();
        
        const symbol = document.getElementById('manualSymbol').value;
        const type = document.getElementById('positionType').value;
        const size = parseFloat(document.getElementById('positionSize').value);

        if (!symbol || !type || !size) {
            this.showNotification('Заполните все поля', 'warning');
            return;
        }

        try {
            this.setLoading(true);
            const response = await fetch(`${this.apiBase}/positions/open`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol, type, size })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(result.message, 'success');
                document.getElementById('openPositionForm').reset();
                await this.updateStatus();
                this.loadPositions();
            } else {
                this.showNotification(`Ошибка: ${result.error}`, 'danger');
            }
        } catch (error) {
            this.showNotification('Ошибка открытия позиции', 'danger');
        } finally {
            this.setLoading(false);
        }
    }

    // Закрытие позиции
    async closePosition(e) {
        e.preventDefault();
        
        const symbol = document.getElementById('closeSymbol').value;
        
        if (!symbol) {
            this.showNotification('Выберите символ', 'warning');
            return;
        }

        try {
            this.setLoading(true);
            const response = await fetch(`${this.apiBase}/positions/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(result.message, 'success');
                document.getElementById('closePositionForm').reset();
                await this.updateStatus();
                this.loadPositions();
                this.loadTrades();
            } else {
                this.showNotification(`Ошибка: ${result.error}`, 'danger');
            }
        } catch (error) {
            this.showNotification('Ошибка закрытия позиции', 'danger');
        } finally {
            this.setLoading(false);
        }
    }

    // Обновление статуса
    async updateStatus() {
        try {
            const response = await fetch(`${this.apiBase}/bot/status`);
            const result = await response.json();
            
            if (result.success) {
                const status = result.data;
                this.updateStatusIndicator(status.isRunning);
                this.updateStatistics(status.statistics);
                this.updateButtons(status.isRunning);
            }
        } catch (error) {
            console.error('Ошибка обновления статуса:', error);
        }
    }

    // Обновление индикатора статуса
    updateStatusIndicator(isRunning) {
        const indicator = document.getElementById('statusIndicator');
        if (isRunning) {
            indicator.className = 'status-indicator status-running';
        } else {
            indicator.className = 'status-indicator status-stopped';
        }
    }

    // Обновление статистики
    updateStatistics(stats) {
        document.getElementById('totalBalance').textContent = `$${stats.totalBalance?.toFixed(2) || '0'}`;
        document.getElementById('availableBalance').textContent = `$${stats.availableBalance?.toFixed(2) || '0'}`;
        
        const pnlElement = document.getElementById('totalPnL');
        const pnl = stats.totalPnL || 0;
        pnlElement.textContent = `$${pnl.toFixed(2)}`;
        pnlElement.className = `stat-value ${pnl >= 0 ? 'profit' : 'loss'}`;
        
        document.getElementById('winRate').textContent = `${stats.winRate?.toFixed(1) || '0'}%`;
    }

    // Обновление кнопок
    updateButtons(isRunning) {
        document.getElementById('startBot').disabled = isRunning;
        document.getElementById('stopBot').disabled = !isRunning;
    }

    // Загрузка позиций
    async loadPositions() {
        try {
            const response = await fetch(`${this.apiBase}/bot/status`);
            const result = await response.json();
            
            if (result.success) {
                const positions = result.data.activePositions;
                this.displayPositions(positions);
            }
        } catch (error) {
            console.error('Ошибка загрузки позиций:', error);
        }
    }

    // Отображение позиций
    displayPositions(positions) {
        const container = document.getElementById('positionsTable');
        
        if (!positions || positions.length === 0) {
            container.innerHTML = '<div class="alert alert-info">Нет активных позиций</div>';
            return;
        }

        let html = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Символ</th>
                        <th>Тип</th>
                        <th>Цена входа</th>
                        <th>Размер</th>
                        <th>PnL</th>
                        <th>Стоп-лосс</th>
                        <th>Тейк-профит</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
        `;

        positions.forEach(position => {
            const pnlClass = position.pnl >= 0 ? 'profit' : 'loss';
            html += `
                <tr>
                    <td><span class="symbol-table-cell">${position.symbol}</span></td>
                    <td><span class="badge bg-${position.type === 'LONG' ? 'success' : 'danger'}">${position.type}</span></td>
                    <td>$${position.entryPrice?.toFixed(4)}</td>
                    <td>$${position.size?.toFixed(2)}</td>
                    <td class="${pnlClass}">$${position.pnl?.toFixed(2)} (${position.pnlPercent?.toFixed(2)}%)</td>
                    <td>$${position.stopLoss?.toFixed(4)}</td>
                    <td>$${position.takeProfit?.toFixed(4)}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="tradingBotUI.closePosition('${position.symbol}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    // Загрузка истории сделок
    async loadTrades() {
        try {
            const response = await fetch(`${this.apiBase}/trades`);
            const result = await response.json();
            
            if (result.success) {
                this.displayTrades(result.data);
            }
        } catch (error) {
            console.error('Ошибка загрузки истории:', error);
        }
    }

    // Отображение истории сделок
    displayTrades(trades) {
        const container = document.getElementById('tradesTable');
        
        if (!trades || trades.length === 0) {
            container.innerHTML = '<div class="alert alert-info">История сделок пуста</div>';
            return;
        }

        let html = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Символ</th>
                        <th>Тип</th>
                        <th>Цена входа</th>
                        <th>Цена выхода</th>
                        <th>Размер</th>
                        <th>PnL</th>
                        <th>Причина закрытия</th>
                        <th>Время</th>
                    </tr>
                </thead>
                <tbody>
        `;

        trades.forEach(trade => {
            const pnlClass = trade.pnl >= 0 ? 'profit' : 'loss';
            const entryTime = new Date(trade.entryTime).toLocaleString();
            const exitTime = trade.exitTime ? new Date(trade.exitTime).toLocaleString() : 'N/A';
            
            html += `
                <tr>
                    <td><span class="symbol-table-cell">${trade.symbol}</span></td>
                    <td><span class="badge bg-${trade.type === 'LONG' ? 'success' : 'danger'}">${trade.type}</span></td>
                    <td>$${trade.entryPrice?.toFixed(4)}</td>
                    <td>$${trade.exitPrice?.toFixed(4) || 'N/A'}</td>
                    <td>$${trade.size?.toFixed(2)}</td>
                    <td class="${pnlClass}">$${trade.pnl?.toFixed(2)} (${trade.pnlPercent?.toFixed(2)}%)</td>
                    <td><span class="badge bg-secondary">${trade.closeReason || 'N/A'}</span></td>
                    <td>${entryTime}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    // Закрытие позиции (для кнопок в таблице)
    async closePosition(symbol) {
        try {
            this.setLoading(true);
            const response = await fetch(`${this.apiBase}/positions/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(result.message, 'success');
                await this.updateStatus();
                this.loadPositions();
                this.loadTrades();
            } else {
                this.showNotification(`Ошибка: ${result.error}`, 'danger');
            }
        } catch (error) {
            this.showNotification('Ошибка закрытия позиции', 'danger');
        } finally {
            this.setLoading(false);
        }
    }

    // Автообновление
    startAutoUpdate() {
        this.updateInterval = setInterval(() => {
            this.updateStatus();
        }, 10000); // Обновление каждые 10 секунд
    }

    // Остановка автообновления
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // Установка состояния загрузки
    setLoading(loading) {
        const buttons = document.querySelectorAll('button[disabled]');
        buttons.forEach(btn => {
            if (loading) {
                btn.disabled = true;
            } else {
                btn.disabled = false;
            }
        });
    }

    // Показ уведомлений
    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        const id = Date.now();
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.id = `alert-${id}`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        container.appendChild(alert);
        
        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            const alertElement = document.getElementById(`alert-${id}`);
            if (alertElement) {
                alertElement.remove();
            }
        }, 5000);
    }
}

// Инициализация UI
const tradingBotUI = new TradingBotUI();

// Очистка при закрытии страницы
window.addEventListener('beforeunload', () => {
    tradingBotUI.stopAutoUpdate();
}); 