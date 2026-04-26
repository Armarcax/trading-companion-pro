// Translations - HAYQ Trading Pro
// Languages: Հայերեն (hy), English (en), Русский (ru)

export const translations = {
  en: {
    translation: {
      nav: {
        dashboard: 'Dashboard', strategies: 'Strategies', exchanges: 'Exchanges',
        trades: 'Trades', settings: 'Settings', reports: 'Reports',
        risk: 'Risk Management', analytics: 'Analytics', options: 'Options', signals: 'Signals',
      },
      bot: { start: 'Start Bot', stop: 'Stop Bot' },
      header: {
        title: 'HAYQ Trading Pro', startBot: 'Start Bot', stopBot: 'Stop Bot',
        signalMode: 'Signal Mode', tradeMode: 'Trade Mode',
        demoMode: 'Demo Mode', liveMode: 'Live Mode',
      },
      status: {
        modeDescription: {
          signal: 'Analysis only — no trades executed',
          demo: 'Simulated trading with realistic conditions',
          live: 'Live trading with real funds — use caution',
        },
        active: 'Active', paused: 'Paused', killSwitch: 'Emergency Stop',
        connected: 'Connected', disconnected: 'Disconnected',
      },
      dashboard: {
        title: 'Trading Dashboard', totalProfit: 'Total Profit', totalTrades: 'Total Trades',
        winRate: 'Win Rate', balance: 'Balance', weeklyTrades: 'this week',
        recentTrades: 'Recent Trades', profitChart: 'Profit Chart',
        noTrades: 'No trades yet', signals: 'Signals',
        activeSignal: 'Active Signal', noSignal: 'No active signal',
      },
      strategies: {
        title: 'Trading Strategies', enable: 'Enable', disable: 'Disable',
        enabled: 'Enabled', disabled: 'Disabled', configure: 'Configure',
        performance: 'Performance', riskLevel: 'Risk Level', totalTrades: 'Total Trades',
        weight: 'Weight', low: 'Low', medium: 'Medium', high: 'High',
      },
      exchanges: {
        title: 'Exchange Connections', connect: 'Connect', disconnect: 'Disconnect',
        connecting: 'Connecting...', connected: 'Connected', offline: 'Offline',
        balance: 'Balance', testnet: 'Testnet', mainnet: 'Mainnet',
      },
      trades: {
        title: 'Trade History', pair: 'Pair', type: 'Type', price: 'Price',
        quantity: 'Quantity', profit: 'Profit', time: 'Time', status: 'Status',
        buy: 'BUY', sell: 'SELL', completed: 'Completed', pending: 'Pending', cancelled: 'Cancelled',
      },
      settings: {
        title: 'Bot Settings', symbol: 'Trading Symbol', stopLoss: 'Stop Loss %',
        takeProfit: 'Take Profit %', quantity: 'Trade Quantity', dryRun: 'Dry Run Mode',
        emaShort: 'EMA Short Period', emaLong: 'EMA Long Period', rsiPeriod: 'RSI Period',
        save: 'Save Settings',
      },
      risk: {
        title: 'Risk Management', dailyDrawdown: 'Daily Drawdown Limit', maxExposure: 'Max Exposure',
        maxConsecutiveLosses: 'Max Consecutive Losses', riskPerTrade: 'Risk Per Trade',
        cooldown: 'Trade Cooldown', killSwitch: 'Kill Switch', activate: 'Activate',
        deactivate: 'Deactivate', currentState: 'Current State',
        consecutiveLosses: 'Consecutive Losses', currentExposure: 'Current Exposure',
        dailyPnL: 'Daily P&L', adaptiveSL: 'Adaptive Stop Loss', adaptiveTP: 'Adaptive Take Profit',
        slMultiplier: 'SL Multiplier (ATR)', tpMultiplier: 'TP Multiplier (ATR)',
      },
      analytics: {
        title: 'Performance Analytics', winRate: 'Win Rate', totalPnL: 'Total P&L',
        profitFactor: 'Profit Factor', expectancy: 'Expectancy', maxDrawdown: 'Max Drawdown',
        currentDrawdown: 'Current Drawdown', sharpeRatio: 'Sharpe Ratio', sortinoRatio: 'Sortino Ratio',
        maxWinStreak: 'Max Win Streak', maxLossStreak: 'Max Loss Streak',
        avgHoldingTime: 'Avg Holding Time', tradesPerDay: 'Trades Per Day',
        winLossAnalysis: 'Win/Loss Analysis', recoveryFactor: 'Recovery Factor',
      },
      simulation: {
        title: 'Trade Simulation', commission: 'Commission', slippage: 'Slippage',
        partialFills: 'Partial Fills', latency: 'Latency', marketImpact: 'Market Impact',
      },
      signals: {
        title: 'Signal Analysis', direction: 'Direction', confidence: 'Confidence',
        score: 'Total Score', approved: 'Approved', rejected: 'Rejected',
        votes: 'Strategy Votes', noSignal: 'Waiting for signal...',
      },
      reports: {
        title: 'Trading Reports', export: 'Export', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
      },
      telegram: {
        title: 'Telegram Notifications', token: 'Bot Token', chatId: 'Chat ID',
        enable: 'Enable Notifications', test: 'Send Test', connected: 'Connected',
        signals: 'Signal Alerts', trades: 'Trade Alerts', risk: 'Risk Alerts',
      },
      common: {
        save: 'Save', cancel: 'Cancel', confirm: 'Confirm', loading: 'Loading...',
        error: 'Error', success: 'Success', on: 'On', off: 'Off',
        enabled: 'Enabled', disabled: 'Disabled',
      },
    },
  },

  hy: {
    translation: {
      nav: {
        dashboard: 'Վահանակ', strategies: 'Ռազմավարություններ', exchanges: 'Բորսաներ',
        trades: 'Գործարքներ', settings: 'Կարգավորումներ', reports: 'Հաշվետվություններ',
        risk: 'Ռիսկի կառավարում', analytics: 'Վերլուծություն', options: 'Օպցիոններ', signals: 'Ազդանշաններ',
      },
      bot: { start: 'Գործարկել բոտը', stop: 'Կանգնեցնել բոտը' },
      header: {
        title: 'HAYQ Թրեյդինգ Պրո', startBot: 'Գործարկել', stopBot: 'Կանգնեցնել',
        signalMode: 'Ազդանշանի ռեժիմ', tradeMode: 'Առևտրի ռեժիմ',
        demoMode: 'Դեմո ռեժիմ', liveMode: 'Իրական առևտուր',
      },
      status: {
        modeDescription: {
          signal: 'Միայն վերլուծություն — գործարքներ չեն կատարվում',
          demo: 'Սիմուլացված առևտուր իրատեսական պայմաններով',
          live: 'Իրական առևտուր — զգուշացեք',
        },
        active: 'Ակտիվ', paused: 'Դադարեցված', killSwitch: 'Արտակարգ կանգ',
        connected: 'Կապակցված', disconnected: 'Անջատված',
      },
      dashboard: {
        title: 'Թրեյդինգի վահանակ', totalProfit: 'Ընդհանուր շահույթ', totalTrades: 'Ընդհանուր գործարքներ',
        winRate: 'Հաղթանակների տոկոս', balance: 'Մնացորդ', weeklyTrades: 'այս շաբաթ',
        recentTrades: 'Վերջին գործարքներ', profitChart: 'Շահույթի գծապատկեր',
        noTrades: 'Գործարքներ դեռ չկան', signals: 'Ազդանշաններ',
        activeSignal: 'Ակտիվ ազդանշան', noSignal: 'Ակտիվ ազդանշան չկա',
      },
      strategies: {
        title: 'Թրեյդինգի ռազմավարություններ', enable: 'Միացնել', disable: 'Անջատել',
        enabled: 'Միացված', disabled: 'Անջատված', configure: 'Կարգավորել',
        performance: 'Արդյունավետություն', riskLevel: 'Ռիսկի մակարդակ',
        totalTrades: 'Ընդհանուր գործարքներ', weight: 'Կշիռ',
        low: 'Ցածր', medium: 'Միջին', high: 'Բարձր',
      },
      exchanges: {
        title: 'Բորսաների կապակցումներ', connect: 'Կապակցել', disconnect: 'Անջատել',
        connecting: 'Կապակցվում...', connected: 'Կապակցված', offline: 'Անցանց',
        balance: 'Մնացորդ', testnet: 'Փորձնական ցանց', mainnet: 'Հիմնական ցանց',
      },
      trades: {
        title: 'Գործարքների պատմություն', pair: 'Զույգ', type: 'Տեսակ', price: 'Գին',
        quantity: 'Քանակ', profit: 'Շահույթ', time: 'Ժամ', status: 'Կարգավիճակ',
        buy: 'ԳՆԵԼ', sell: 'ՎԱՃԱՌԵԼ', completed: 'Ավարտված',
        pending: 'Սպասվող', cancelled: 'Չեղարկված',
      },
      settings: {
        title: 'Բոտի կարգավորումներ', symbol: 'Թրեյդինգի զույգ', stopLoss: 'Կանգ-կորուստ %',
        takeProfit: 'Շահույթ վերցնել %', quantity: 'Գործարքի ծավալ', dryRun: 'Փորձնական ռեժիմ',
        emaShort: 'EMA կարճ պարբերություն', emaLong: 'EMA երկար պարբերություն',
        rsiPeriod: 'RSI պարբերություն', save: 'Պահպանել կարգավորումները',
      },
      risk: {
        title: 'Ռիսկի կառավարում', dailyDrawdown: 'Օրական կորստի սահմանաչափ',
        maxExposure: 'Առավելագույն ազդեցություն', maxConsecutiveLosses: 'Անընդմեջ կորուստների սահմանաչափ',
        riskPerTrade: 'Ռիսկ մեկ գործարքի համար', cooldown: 'Դադար գործարքների միջև',
        killSwitch: 'Արտակարգ կանգ', activate: 'Ակտիվացնել', deactivate: 'Ապաակտիվացնել',
        currentState: 'Ընթացիկ վիճակ', consecutiveLosses: 'Անընդմեջ կորուստներ',
        currentExposure: 'Ընթացիկ ազդեցություն', dailyPnL: 'Օրական Շ/Կ',
        adaptiveSL: 'Հարմարվող կանգ-կորուստ', adaptiveTP: 'Հարմարվող շահույթ-վերցնել',
        slMultiplier: 'ԿԿ բազմապատկիչ (ATR)', tpMultiplier: 'ՇՎ բազմապատկիչ (ATR)',
      },
      analytics: {
        title: 'Արդյունավետության վերլուծություն', winRate: 'Հաղթանակների տոկոս',
        totalPnL: 'Ընդհանուր Շ/Կ', profitFactor: 'Շահույթի գործակից', expectancy: 'Ակնկալիք',
        maxDrawdown: 'Առավ. նվազում', currentDrawdown: 'Ընթ. նվազում',
        sharpeRatio: 'Շարփի հարաբերություն', sortinoRatio: 'Սորտինոյի հարաբերություն',
        maxWinStreak: 'Հաղթ. շարան', maxLossStreak: 'Կոր. շարան',
        avgHoldingTime: 'Պահման միջ. ժամ', tradesPerDay: 'Գործ. օրական',
        winLossAnalysis: 'Հաղթ./Կոր. վերլուծություն', recoveryFactor: 'Վերականգման գործ.',
      },
      simulation: {
        title: 'Գործարքի սիմուլացիա', commission: 'Միջնորդավճար', slippage: 'Սայթաք',
        partialFills: 'Մասնակի կատարում', latency: 'Ուշացում', marketImpact: 'Շուկայի ազդեցություն',
      },
      signals: {
        title: 'Ազդանշանների վերլուծություն', direction: 'Ուղղություն', confidence: 'Վստահություն',
        score: 'Ընդհ. գնահ.', approved: 'Հաստատված', rejected: 'Մերժված',
        votes: 'Ռազմ. ձայներ', noSignal: 'Ազդանշան սպասվում է...',
      },
      reports: {
        title: 'Թրեյդինգի հաշվետվություններ', export: 'Արտահանել',
        daily: 'Օրական', weekly: 'Շաբաթական', monthly: 'Ամսական',
      },
      telegram: {
        title: 'Telegram ծանուցումներ', token: 'Բոտի token', chatId: 'Chat ID',
        enable: 'Միացնել ծանուցումները', test: 'Փորձնական ուղարկել', connected: 'Կապակցված',
        signals: 'Ազդանշանի ծանուցումներ', trades: 'Գործ. ծանուցումներ', risk: 'Ռիսկի ծանուցումներ',
      },
      common: {
        save: 'Պահպանել', cancel: 'Չեղարկել', confirm: 'Հաստատել', loading: 'Բեռնվում...',
        error: 'Սխալ', success: 'Հաջողված', on: 'Միացված', off: 'Անջատված',
        enabled: 'Միացված', disabled: 'Անջատված',
      },
    },
  },

  ru: {
    translation: {
      nav: {
        dashboard: 'Панель', strategies: 'Стратегии', exchanges: 'Биржи',
        trades: 'Сделки', settings: 'Настройки', reports: 'Отчёты',
        risk: 'Управление рисками', analytics: 'Аналитика', options: 'Опционы', signals: 'Сигналы',
      },
      bot: { start: 'Запустить бота', stop: 'Остановить бота' },
      header: {
        title: 'HAYQ Trading Pro', startBot: 'Запустить', stopBot: 'Остановить',
        signalMode: 'Режим сигналов', tradeMode: 'Режим торговли',
        demoMode: 'Демо режим', liveMode: 'Реальная торговля',
      },
      status: {
        modeDescription: {
          signal: 'Только анализ — сделки не исполняются',
          demo: 'Симуляция торговли с реалистичными условиями',
          live: 'Реальная торговля — будьте осторожны',
        },
        active: 'Активен', paused: 'Пауза', killSwitch: 'Аварийный стоп',
        connected: 'Подключено', disconnected: 'Отключено',
      },
      dashboard: {
        title: 'Торговая панель', totalProfit: 'Общая прибыль', totalTrades: 'Всего сделок',
        winRate: 'Винрейт', balance: 'Баланс', weeklyTrades: 'за неделю',
        recentTrades: 'Последние сделки', profitChart: 'График прибыли',
        noTrades: 'Сделок пока нет', signals: 'Сигналы',
        activeSignal: 'Активный сигнал', noSignal: 'Нет активного сигнала',
      },
      strategies: {
        title: 'Торговые стратегии', enable: 'Включить', disable: 'Выключить',
        enabled: 'Включено', disabled: 'Выключено', configure: 'Настроить',
        performance: 'Производительность', riskLevel: 'Уровень риска',
        totalTrades: 'Всего сделок', weight: 'Вес', low: 'Низкий', medium: 'Средний', high: 'Высокий',
      },
      exchanges: {
        title: 'Подключения к биржам', connect: 'Подключить', disconnect: 'Отключить',
        connecting: 'Подключение...', connected: 'Подключено', offline: 'Оффлайн',
        balance: 'Баланс', testnet: 'Тестнет', mainnet: 'Основная сеть',
      },
      trades: {
        title: 'История сделок', pair: 'Пара', type: 'Тип', price: 'Цена',
        quantity: 'Объём', profit: 'Прибыль', time: 'Время', status: 'Статус',
        buy: 'КУПИТЬ', sell: 'ПРОДАТЬ', completed: 'Завершено', pending: 'В ожидании', cancelled: 'Отменено',
      },
      settings: {
        title: 'Настройки бота', symbol: 'Торговый символ', stopLoss: 'Стоп-лосс %',
        takeProfit: 'Тейк-профит %', quantity: 'Объём сделки', dryRun: 'Тестовый режим',
        emaShort: 'EMA короткий период', emaLong: 'EMA длинный период',
        rsiPeriod: 'Период RSI', save: 'Сохранить настройки',
      },
      risk: {
        title: 'Управление рисками', dailyDrawdown: 'Лимит дневной просадки',
        maxExposure: 'Макс. экспозиция', maxConsecutiveLosses: 'Макс. убытков подряд',
        riskPerTrade: 'Риск на сделку', cooldown: 'Пауза между сделками',
        killSwitch: 'Аварийная остановка', activate: 'Активировать', deactivate: 'Деактивировать',
        currentState: 'Текущее состояние', consecutiveLosses: 'Убытков подряд',
        currentExposure: 'Текущая экспозиция', dailyPnL: 'Дневной П/У',
        adaptiveSL: 'Адаптивный стоп-лосс', adaptiveTP: 'Адаптивный тейк-профит',
        slMultiplier: 'Множитель SL (ATR)', tpMultiplier: 'Множитель TP (ATR)',
      },
      analytics: {
        title: 'Аналитика эффективности', winRate: 'Винрейт', totalPnL: 'Общий П/У',
        profitFactor: 'Профит-фактор', expectancy: 'Ожидание', maxDrawdown: 'Макс. просадка',
        currentDrawdown: 'Текущая просадка', sharpeRatio: 'Коэф. Шарпа', sortinoRatio: 'Коэф. Сортино',
        maxWinStreak: 'Макс. серия побед', maxLossStreak: 'Макс. серия убытков',
        avgHoldingTime: 'Сред. время удержания', tradesPerDay: 'Сделок в день',
        winLossAnalysis: 'Анализ прибыли/убытков', recoveryFactor: 'Фактор восстановления',
      },
      simulation: {
        title: 'Симуляция торговли', commission: 'Комиссия', slippage: 'Проскальзывание',
        partialFills: 'Частичное исполнение', latency: 'Задержка', marketImpact: 'Влияние на рынок',
      },
      signals: {
        title: 'Анализ сигналов', direction: 'Направление', confidence: 'Уверенность',
        score: 'Общий балл', approved: 'Одобрено', rejected: 'Отклонено',
        votes: 'Голоса стратегий', noSignal: 'Ожидание сигнала...',
      },
      reports: {
        title: 'Торговые отчёты', export: 'Экспорт', daily: 'Дневной', weekly: 'Недельный', monthly: 'Месячный',
      },
      telegram: {
        title: 'Уведомления Telegram', token: 'Токен бота', chatId: 'Chat ID',
        enable: 'Включить уведомления', test: 'Тест', connected: 'Подключено',
        signals: 'Уведомления о сигналах', trades: 'Уведомления о сделках', risk: 'Уведомления о риске',
      },
      common: {
        save: 'Сохранить', cancel: 'Отмена', confirm: 'Подтвердить', loading: 'Загрузка...',
        error: 'Ошибка', success: 'Успех', on: 'Вкл', off: 'Выкл',
        enabled: 'Включено', disabled: 'Выключено',
      },
    },
  },
};
