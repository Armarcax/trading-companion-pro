// useBotState - HAYQ Pro
// Real WS, real RSI, batch reducer, strategies, Telegram, TradingView, Pocket Option

import { useEffect, useCallback, useRef, useReducer } from 'react';
import type { BotStats, MarketData, Trade, Exchange, BotConfig } from '@/types/trading';
import type { MarketState, AggregatedSignal, CandleData } from '@/lib/strategies/types';
import { getMarketFeed, type FeedSource } from '@/lib/websocketFeed';
import { getExchangeBalance } from '@/lib/exchangeService';
import { toast } from 'sonner';
import { type RiskConfig, defaultRiskConfig } from '@/lib/riskManagement';
import { type StrategyConfig, defaultStrategies, generateSignal } from '@/lib/strategyEngine';
import { classicStrategyConfigs } from '@/lib/strategies/classicStrategies';
import { calculateRSI, calculateATR } from '@/lib/strategies/technicalIndicators';
import { defaultTelegramConfig, type TelegramConfig, telegramSendSignal, telegramSendRiskAlert } from '@/lib/telegramService';

export type { FeedSource };

const MAX_CANDLES = 200;

interface RiskStateLocal {
  consecutiveLosses: number; lastTradeTime: Date | null;
  currentExposure: number; totalCapital: number; dailyPnL: number; tradesCount: number;
}

// Build all strategy configs: original 8 + 12 classic = 20 total
export const allStrategyConfigs: StrategyConfig[] = [
...defaultStrategies,
...classicStrategyConfigs.map(c => ({ id: c.id, name: c.name, enabled: c.enabled, weight: c.weight })),
];

interface BotState {
  isRunning: boolean; tradingMode: 'signal' | 'trade'; feedSource: FeedSource;
  markets: MarketData[]; trades: Trade[]; exchanges: Exchange[];
  config: BotConfig; riskConfig: RiskConfig; riskState: RiskStateLocal;
  strategies: StrategyConfig[]; currentSignal: AggregatedSignal | null;
  candleMap: Record<string, CandleData[]>; stats: BotStats;
  wsConnected: boolean; telegramConfig: TelegramConfig;
}

type Action =
  | { type: 'SET_RUNNING'; v: boolean }
  | { type: 'SET_MODE'; v: 'signal' | 'trade' }
  | { type: 'SET_FEED'; v: FeedSource }
  | { type: 'SET_WS'; v: boolean }
  | { type: 'TICK'; sym: string; candle: CandleData; price: number; change24h: number }
  | { type: 'SET_SIGNAL'; v: AggregatedSignal | null }
  | { type: 'SET_EXCHANGE'; v: Exchange }
  | { type: 'UPD_CONFIG'; v: Partial<BotConfig> }
  | { type: 'UPD_RISK'; v: Partial<RiskConfig> }
  | { type: 'UPD_TELEGRAM'; v: Partial<TelegramConfig> }
  | { type: 'TOGGLE_STRAT'; id: string }
  | { type: 'SET_STRAT_W'; id: string; w: number }
  | { type: 'SET_STATS'; v: Partial<BotStats> };

const EXCHANGES: Exchange[] = [
  { id: 'binance', name: 'Binance', logo: '₿', connected: false, status: 'offline' },
  { id: 'bybit', name: 'Bybit', logo: 'BY', connected: false, status: 'offline' },
  { id: 'coinbase', name: 'Coinbase', logo: 'CB', connected: false, status: 'offline' },
  { id: 'tradingview', name: 'TradingView', logo: 'TV', connected: false, status: 'offline' },
  { id: 'pocket_option', name: 'Pocket Option', logo: 'PO', connected: false, status: 'offline' },
  { id: 'deribit', name: 'Deribit', logo: 'DR', connected: false, status: 'offline' },
];

const INIT: BotState = {
  isRunning: false, tradingMode: 'signal', feedSource: 'binance', wsConnected: false,
  markets: [
    { symbol: 'BTCUSDT', price: 0, change: 0, changePercent: 0 },
    { symbol: 'ETHUSDT', price: 0, change: 0, changePercent: 0 },
    { symbol: 'SOLUSDT', price: 0, change: 0, changePercent: 0 },
    { symbol: 'XAUUSD', price: 0, change: 0, changePercent: 0 },
  ],
  trades: [], exchanges: EXCHANGES,
  config: { symbol: 'BTCUSDT', stopLossPct: 0.003, takeProfitPct: 0.005, tradeQuantity: 0.001, dryRun: true, emaShortPeriod: 9, emaLongPeriod: 21, rsiPeriod: 14 },
  riskConfig: defaultRiskConfig,
  riskState: { consecutiveLosses: 0, lastTradeTime: null, currentExposure: 0.05, totalCapital: 10000, dailyPnL: 0, tradesCount: 0 },
  strategies: allStrategyConfigs,
  currentSignal: null, candleMap: {},
  stats: { totalProfit: 0, profitPercent: 0, totalTrades: 0, weeklyTrades: 0, winRate: 0, winRateChange: 0, balance: 10000, balanceChange: 0 },
  telegramConfig: defaultTelegramConfig,
};

function reducer(s: BotState, a: Action): BotState {
  switch (a.type) {
    case 'SET_RUNNING': return {...s, isRunning: a.v };
    case 'SET_MODE': return {...s, tradingMode: a.v };
    case 'SET_FEED': return {...s, feedSource: a.v };
    case 'SET_WS': return {...s, wsConnected: a.v };
    case 'SET_SIGNAL': return {...s, currentSignal: a.v };
    case 'UPD_CONFIG': return {...s, config: {...s.config,...a.v } };
    case 'UPD_RISK': return {...s, riskConfig: {...s.riskConfig,...a.v } };
    case 'UPD_TELEGRAM':return {...s, telegramConfig: {...s.telegramConfig,...a.v } };
    case 'SET_STATS': return {...s, stats: {...s.stats,...a.v } };
    case 'SET_EXCHANGE':return {...s, exchanges: s.exchanges.map(e => e.id === a.v.id? a.v : e) };
    case 'TOGGLE_STRAT':return {...s, strategies: s.strategies.map(st => st.id === a.id? {...st, enabled:!st.enabled } : st) };
    case 'SET_STRAT_W': return {...s, strategies: s.strategies.map(st => st.id === a.id? {...st, weight: a.w } : st) };
    case 'TICK': {
      const prev = s.candleMap[a.sym]?? [];
      const newCandles = [...prev, a.candle].slice(-MAX_CANDLES);
      const markets = s.markets.map(m => m.symbol === a.sym
     ? {...m, price: a.price, change: a.price - m.price, changePercent: a.change24h || m.changePercent }
        : m);
      return {...s, candleMap: {...s.candleMap, [a.sym]: newCandles }, markets };
    }
    default: return s;
  }
}

export function useBotState() {
  const [state, dispatch] = useReducer(reducer, INIT);
  const stateRef = useRef(state);
  stateRef.current = state;
  const unsubsRef = useRef<Array<() => void>>([]);
  const sigTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startFeed = useCallback((source: FeedSource, symbols: string[]) => {
    const feed = getMarketFeed();
    unsubsRef.current.forEach(f => f());
    unsubsRef.current = [];
    feed.disconnect();
    feed.connect(source, symbols);
    for (const sym of symbols) {
      unsubsRef.current.push(
        feed.onKline(sym, u => {
          if (!u.isFinal) return;
          dispatch({ type: 'TICK', sym, candle: u.candle, price: u.candle.close, change24h: 0 });
        }),
        feed.onTicker(sym, t => {
          dispatch({ type: 'TICK', sym, candle: { open: t.price, high: t.price, low: t.price, close: t.price, volume: 0, timestamp: t.timestamp }, price: t.price, change24h: t.change24h });
        })
      );
    }
    dispatch({ type: 'SET_WS', v: true });
  }, []);

  const computeSignal = useCallback(() => {
    const s = stateRef.current;
    const candles = s.candleMap[s.config.symbol]?? [];

    if (candles.length < 10) {
      console.log(`⏳ Candles: ${candles.length}/10 - սպասում ենք...`);
      return;
    }

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const rsi = calculateRSI(closes, 14);
    const recent = candles.slice(-20);
    const ms: MarketState = {
      price: closes[closes.length - 1], rsi, direction: null,
      volume: candles[candles.length - 1].volume,
      avgVolume: recent.reduce((a, c) => a + c.volume, 0) / 20,
      support: Math.min(...recent.map(c => c.low)),
      resistance: Math.max(...recent.map(c => c.high)),
      candles1m: candles,
      trend5mPrices: closes.filter((_, i) => i % 5 === 0),
      trend15mPrices: closes.filter((_, i) => i % 15 === 0),
    };
    const signal = generateSignal(ms, s.strategies);

    // FIXED: signal.votes է, ոչ թե signal.strategies
    console.log('📊 Signal:', {
      direction: signal.direction || 'NONE',
      totalScore: signal.totalScore.toFixed(1),
      confidence: signal.confidence.toFixed(1),
      approved: signal.approved,
      rsi: rsi.toFixed(1),
      activeVotes: signal.votes?.filter(v => v.signal).map(v => `${v.strategy}: ${v.signal} ${v.weightedScore.toFixed(1)}`)?? []
    });

    dispatch({ type: 'SET_SIGNAL', v: signal });

    // Send Telegram alert - ուղարկում ենք նույնիսկ եթե approved: false է, թեստի համար
    if (signal.direction && s.telegramConfig.enabled && s.telegramConfig.signalAlerts) {
      const statusTag = signal.approved? '✅ Approved' : '⚠️ Weak';
      telegramSendSignal(s.telegramConfig, signal.direction, s.config.symbol, signal.confidence, signal.totalScore, ms.price)
     .catch((err) => {
        console.error('Telegram send failed:', err);
      });
    }
  }, []);

  const toggleBot = useCallback(() => {
    const running =!stateRef.current.isRunning;
    dispatch({ type: 'SET_RUNNING', v: running });
    if (running) {
      const syms = [stateRef.current.config.symbol, 'ETHUSDT', 'SOLUSDT'];
      startFeed(stateRef.current.feedSource, syms);
      sigTimer.current = setInterval(computeSignal, 3000);

      // Telegram նամակ ուղարկիր որ բոտը միացավ
      if (stateRef.current.telegramConfig.enabled && stateRef.current.telegramConfig.botToken && stateRef.current.telegramConfig.chatId) {
        const msg = `🤖 <b>HAYQ Bot միացված է</b>\n\n📊 Symbol: ${stateRef.current.config.symbol}\n⚙️ Mode: ${stateRef.current.tradingMode}\n📡 Feed: ${stateRef.current.feedSource}\n\nՍիգնալների սպասում...`;
        fetch(`https://api.telegram.org/bot${stateRef.current.telegramConfig.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: stateRef.current.telegramConfig.chatId,
            text: msg,
            parse_mode: 'HTML'
          })
        }).catch(() => {});
      }

      toast.success('🤖 Բոտը գործարկված է');
    } else {
      if (sigTimer.current) { clearInterval(sigTimer.current); sigTimer.current = null; }
      getMarketFeed().disconnect();
      dispatch({ type: 'SET_WS', v: false });
      toast('🛑 Բոտը կանգնեցված է');
    }
  }, [startFeed, computeSignal]);

  const connectExchange = useCallback(async (id: string) => {
    const meta = EXCHANGES.find(e => e.id === id)?? { id, name: id, logo: '?', connected: false, status: 'offline' as const };
    const noRest = ['tradingview', 'pocket_option', 'deribit'];
    if (noRest.includes(id)) {
      dispatch({ type: 'SET_EXCHANGE', v: {...meta, connected: true, status: 'online' } });
      toast.success(`${meta.name} կապակցված է`);
      return;
    }

    dispatch({ type: 'SET_EXCHANGE', v: {...meta, status: 'connecting' } });

    // ԿԱՐԵՎՈՐ: true ենք ուղարկում testnet-ի համար
    const res = await getExchangeBalance(id as 'binance' | 'bybit' | 'coinbase', true);

    if (!res.success) {
      dispatch({ type: 'SET_EXCHANGE', v: {...meta, status: 'offline' } });
      const errorMsg = res.error?.includes('Supabase')
     ? 'Կարգավորեք Supabase.env ֆայլում API key-երը'
        : res.error || 'Unknown error';
      toast.error(`${meta.name}: ${errorMsg}`);
      console.error(`Connect ${id} failed:`, res.error);
      return;
    }

    let balance = 0;
    if (id === 'binance' && res.data?.balances) {
      const u = res.data.balances.find(b => b.asset === 'USDT');
      if (u) balance = parseFloat(u.free) + parseFloat(u.locked);
    } else if (id === 'bybit' && res.data?.result?.list?.[0]?.totalEquity) {
      balance = parseFloat(res.data.result.list[0].totalEquity);
    }

    dispatch({ type: 'SET_EXCHANGE', v: {...meta, connected: true, status: 'online', balance } });
    toast.success(`${meta.name} կապակցված է — $${balance.toFixed(2)}`);
  }, []);

  const disconnectExchange = useCallback((id: string) => {
    const meta = EXCHANGES.find(e => e.id === id)?? { id, name: id, logo: '?', connected: false, status: 'offline' as const };
    dispatch({ type: 'SET_EXCHANGE', v: {...meta, connected: false, status: 'offline' } });
  }, []);

  useEffect(() => () => {
    unsubsRef.current.forEach(f => f());
    if (sigTimer.current) clearInterval(sigTimer.current);
    getMarketFeed().disconnect();
  }, []);

  return {
 ...state,
    candles: state.candleMap[state.config.symbol]?? [],
    toggleBot,
    setTradingMode: (v: 'signal' | 'trade') => dispatch({ type: 'SET_MODE', v }),
    setFeedSource: (v: FeedSource) => dispatch({ type: 'SET_FEED', v }),
    toggleStrategy: (id: string) => dispatch({ type: 'TOGGLE_STRAT', id }),
    updateStrategyWeight: (id: string, w: number) => dispatch({ type: 'SET_STRAT_W', id, w }),
    connectExchange, disconnectExchange,
    updateConfig: (v: Partial<BotConfig>) => dispatch({ type: 'UPD_CONFIG', v }),
    updateRiskConfig: (v: Partial<RiskConfig>) => dispatch({ type: 'UPD_RISK', v }),
    updateTelegramConfig: (v: Partial<TelegramConfig>) => dispatch({ type: 'UPD_TELEGRAM', v }),
  };
}