// Enhanced Bot State Hook - HAYQ Project

import { useState, useEffect, useCallback } from 'react';
import type { BotStats, MarketData, Trade, Exchange, BotConfig } from '@/types/trading';
import type { MarketState, AggregatedSignal, CandleData } from '@/lib/strategies/types';
import { RiskConfig, RiskState, defaultRiskConfig } from '@/lib/riskManagement';
import { StrategyConfig, defaultStrategies, generateSignal } from '@/lib/strategyEngine';

// Mock data generators for MVP
const generateMockCandles = (count: number = 50): CandleData[] => {
  const candles: CandleData[] = [];
  let price = 43256.80;
  
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * 100;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 30;
    const low = Math.min(open, close) - Math.random() * 30;
    
    candles.push({
      open,
      high,
      low,
      close,
      volume: 100 + Math.random() * 500,
      timestamp: new Date(Date.now() - (count - i) * 60000)
    });
    
    price = close;
  }
  
  return candles;
};

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

const initialExchanges: Exchange[] = [
  { id: 'binance', name: 'Binance', logo: '₿', connected: false, status: 'offline' },
  { id: 'bybit', name: 'Bybit', logo: 'BY', connected: false, status: 'offline' },
  { id: 'coinbase', name: 'Coinbase', logo: 'CB', connected: false, status: 'offline' },
  { id: 'tradingview', name: 'TradingView', logo: 'TV', connected: false, status: 'offline' },
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

const initialRiskState: RiskState = {
  consecutiveLosses: 0,
  lastTradeTime: null,
  currentExposure: 0.05,
  totalCapital: 10000,
  dailyPnL: 0,
  tradesCount: 0
};

export function useBotState() {
  const [isRunning, setIsRunning] = useState(false);
  const [tradingMode, setTradingMode] = useState<'signal' | 'trade'>('signal');
  const [markets, setMarkets] = useState<MarketData[]>(generateMockMarkets());
  const [trades, setTrades] = useState<Trade[]>(generateMockTrades());
  const [exchanges, setExchanges] = useState<Exchange[]>(initialExchanges);
  const [config, setConfig] = useState<BotConfig>(initialConfig);
  const [riskConfig, setRiskConfig] = useState<RiskConfig>(defaultRiskConfig);
  const [riskState, setRiskState] = useState<RiskState>(initialRiskState);
  const [strategies, setStrategies] = useState<StrategyConfig[]>(defaultStrategies);
  const [currentSignal, setCurrentSignal] = useState<AggregatedSignal | null>(null);
  const [candles, setCandles] = useState<CandleData[]>(generateMockCandles());
  
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

  // Generate market state for strategy evaluation
  const generateMarketState = useCallback((): MarketState => {
    const closes = candles.map(c => c.close);
    const avgVolume = candles.slice(-20).reduce((a, c) => a + c.volume, 0) / 20;
    
    // Calculate simple support/resistance
    const recentHighs = candles.slice(-20).map(c => c.high);
    const recentLows = candles.slice(-20).map(c => c.low);
    const resistance = Math.max(...recentHighs);
    const support = Math.min(...recentLows);
    
    return {
      price: candles[candles.length - 1]?.close ?? 0,
      rsi: 50 + (Math.random() - 0.5) * 40, // Simplified RSI
      direction: null,
      volume: candles[candles.length - 1]?.volume ?? 0,
      avgVolume,
      support,
      resistance,
      candles1m: candles,
      trend5mPrices: closes.filter((_, i) => i % 5 === 0),
      trend15mPrices: closes.filter((_, i) => i % 15 === 0)
    };
  }, [candles]);

  // Update market data and generate signals periodically
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      // Update candles
      setCandles(prev => {
        const newCandle = generateMockCandles(1)[0];
        return [...prev.slice(1), newCandle];
      });
      
      setMarkets(generateMockMarkets());
      
      // Generate signal
      const marketState = generateMarketState();
      const signal = generateSignal(marketState, strategies);
      setCurrentSignal(signal);
      
      // Update stats occasionally
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
  }, [isRunning, strategies, generateMarketState]);

  const toggleBot = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  const toggleStrategy = useCallback((id: string) => {
    setStrategies(prev => 
      prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    );
  }, []);

  const updateStrategyWeight = useCallback((id: string, weight: number) => {
    setStrategies(prev =>
      prev.map(s => s.id === id ? { ...s, weight } : s)
    );
  }, []);

  const connectExchange = useCallback((id: string) => {
    setExchanges(prev => 
      prev.map(e => e.id === id 
        ? { ...e, status: 'connecting' as const }
        : e
      )
    );
    
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

  const updateRiskConfig = useCallback((updates: Partial<RiskConfig>) => {
    setRiskConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    isRunning,
    tradingMode,
    setTradingMode,
    markets,
    trades,
    strategies,
    exchanges,
    stats,
    config,
    riskConfig,
    riskState,
    currentSignal,
    candles,
    toggleBot,
    toggleStrategy,
    updateStrategyWeight,
    connectExchange,
    disconnectExchange,
    updateConfig,
    updateRiskConfig,
  };
}
