import { useState, useEffect, useCallback } from 'react';
import type { BotStats, MarketData, Trade, Strategy, Exchange, BotConfig } from '@/types/trading';

// Mock data generators for MVP
const generateMockMarkets = (): MarketData[] => {
  const btcBase = 43256.80;
  const ethBase = 2845.20;
  const btcPrice = btcBase + (Math.random() - 0.5) * 400;
  const ethPrice = ethBase + (Math.random() - 0.5) * 100;
  
  return [
    {
      symbol: 'BTC/USD',
      price: btcPrice,
      change: btcPrice - btcBase,
      changePercent: ((btcPrice - btcBase) / btcBase) * 100,
    },
    {
      symbol: 'ETH/USD',
      price: ethPrice,
      change: ethPrice - ethBase,
      changePercent: ((ethPrice - ethBase) / ethBase) * 100,
    },
    {
      symbol: 'SOL/USD',
      price: 98.45 + (Math.random() - 0.5) * 10,
      change: (Math.random() - 0.5) * 5,
      changePercent: (Math.random() - 0.5) * 5,
    },
  ];
};

const generateMockTrades = (): Trade[] => {
  const pairs = ['BTC/USD', 'ETH/USD', 'SOL/USD'];
  return Array.from({ length: 10 }, (_, i) => ({
    id: `trade-${i}`,
    pair: pairs[Math.floor(Math.random() * pairs.length)],
    type: Math.random() > 0.5 ? 'BUY' : 'SELL',
    price: 40000 + Math.random() * 5000,
    quantity: 0.001 + Math.random() * 0.01,
    profit: (Math.random() - 0.4) * 50,
    timestamp: new Date(Date.now() - i * 15 * 60000),
    status: 'completed',
  }));
};

const initialStrategies: Strategy[] = [
  {
    id: 'trend-following',
    name: 'Trend Following',
    description: 'EMA crossover with RSI confirmation',
    enabled: true,
    performance: 72.4,
    risk: 'low',
    tradesCount: 47,
  },
  {
    id: 'mean-reversion',
    name: 'Mean Reversion',
    description: 'Bollinger Bands with volume analysis',
    enabled: true,
    performance: 65.8,
    risk: 'medium',
    tradesCount: 32,
  },
  {
    id: 'scalping',
    name: 'Scalping',
    description: 'Quick trades on small price movements',
    enabled: false,
    performance: 58.2,
    risk: 'high',
    tradesCount: 63,
  },
  {
    id: 'breakout',
    name: 'Breakout Trading',
    description: 'Support/resistance breakout detection',
    enabled: false,
    performance: 61.5,
    risk: 'medium',
    tradesCount: 28,
  },
];

const initialExchanges: Exchange[] = [
  { id: 'binance', name: 'Binance', logo: '₿', connected: false, status: 'offline' },
  { id: 'bybit', name: 'Bybit', logo: 'BY', connected: false, status: 'offline' },
  { id: 'tradingview', name: 'TradingView', logo: 'TV', connected: false, status: 'offline' },
  { id: 'pocket-option', name: 'Pocket Option', logo: 'PO', connected: false, status: 'offline' },
];

const initialConfig: BotConfig = {
  symbol: 'BTCUSDT',
  stopLossPct: 0.003,
  takeProfitPct: 0.005,
  tradeQuantity: 0.001,
  dryRun: true,
  emaShortPeriod: 9,
  emaLongPeriod: 21,
  rsiPeriod: 14,
};

export function useBotState() {
  const [isRunning, setIsRunning] = useState(false);
  const [markets, setMarkets] = useState<MarketData[]>(generateMockMarkets());
  const [trades, setTrades] = useState<Trade[]>(generateMockTrades());
  const [strategies, setStrategies] = useState<Strategy[]>(initialStrategies);
  const [exchanges, setExchanges] = useState<Exchange[]>(initialExchanges);
  const [config, setConfig] = useState<BotConfig>(initialConfig);
  
  const [stats, setStats] = useState<BotStats>({
    totalProfit: 2456.80,
    profitPercent: 12.5,
    totalTrades: 142,
    weeklyTrades: 24,
    winRate: 68.3,
    winRateChange: 2.1,
    balance: 12845.60,
    balanceChange: 19.2,
  });

  // Update market data periodically
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      setMarkets(generateMockMarkets());
      
      // Occasionally update stats
      if (Math.random() > 0.7) {
        setStats(prev => ({
          ...prev,
          totalProfit: prev.totalProfit + (Math.random() - 0.4) * 20,
          balance: prev.balance + (Math.random() - 0.4) * 50,
          totalTrades: prev.totalTrades + (Math.random() > 0.8 ? 1 : 0),
        }));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const toggleBot = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  const toggleStrategy = useCallback((id: string) => {
    setStrategies(prev => 
      prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    );
  }, []);

  const connectExchange = useCallback((id: string) => {
    setExchanges(prev => 
      prev.map(e => e.id === id 
        ? { ...e, status: 'connecting' as const }
        : e
      )
    );
    
    // Simulate connection
    setTimeout(() => {
      setExchanges(prev => 
        prev.map(e => e.id === id 
          ? { ...e, connected: true, status: 'online' as const, balance: Math.random() * 10000 }
          : e
        )
      );
    }, 2000);
  }, []);

  const disconnectExchange = useCallback((id: string) => {
    setExchanges(prev => 
      prev.map(e => e.id === id 
        ? { ...e, connected: false, status: 'offline' as const, balance: undefined }
        : e
      )
    );
  }, []);

  const updateConfig = useCallback((updates: Partial<BotConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    isRunning,
    markets,
    trades,
    strategies,
    exchanges,
    stats,
    config,
    toggleBot,
    toggleStrategy,
    connectExchange,
    disconnectExchange,
    updateConfig,
  };
}
