// Market Feed Manager - HAYQ Pro
// Binance REST + Bybit REST, Historical preload, Mock fallback

import type { CandleData } from './strategies/types';
export type FeedSource = 'binance' | 'bybit' | 'tradingview' | 'mock';

export interface TickerUpdate {
  symbol: string; price: number; bid: number; ask: number;
  volume24h: number; change24h: number; timestamp: Date; source: FeedSource;
}
export interface KlineUpdate {
  symbol: string; interval: string; candle: CandleData; isFinal: boolean; source: FeedSource;
}
type TickerCB = (u: TickerUpdate) => void;
type KlineCB = (u: KlineUpdate) => void;

export class MarketFeedManager {
  private tickerCBs = new Map<string, Set<TickerCB>>();
  private klineCBs = new Map<string, Set<KlineCB>>();
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private mockTimer: ReturnType<typeof setInterval> | null = null;
  private source: FeedSource = 'mock';
  private syms: string[] = [];
  connected = false;
  private lastCandleTime: Record<string, number> = {};
  private historicalLoaded = false;

  private mockPrices: Record<string, number> = {
    BTCUSDT: 67350, ETHUSDT: 3580, SOLUSDT: 175, BNBUSDT: 605,
    EURUSD: 1.0812, XAUUSD: 2345,
  };

  connect(source: FeedSource, symbols: string[]) {
    this.source = source;
    this.syms = symbols;
    this.historicalLoaded = false;

    if (source === 'mock' || source === 'tradingview') {
      this.startMock();
      return;
    }
    if (source === 'binance') {
      this.startBinancePolling(symbols);
      return;
    }
    if (source === 'bybit') {
      this.startBybitPolling(symbols);
      return;
    }
  }

  // Binance Testnet REST API - Պատմական + Live
  private startBinancePolling(symbols: string[]) {
    this.connected = true;
    console.log('✅ Binance Testnet REST polling started');

    const fetchHistorical = async () => {
      // 1. ԲԵՐԵՆՔ 100 ՀԱՏ ՊԱՏՄԱԿԱՆ CANDLE - միանգամից
      for (const sym of symbols) {
        try {
          const res = await fetch(
            `https://testnet.binance.vision/api/v3/klines?symbol=${sym}&interval=1m&limit=100`
          );
          const klines = await res.json();

          if (Array.isArray(klines)) {
            console.log(`📈 ${sym}: Loaded ${klines.length} historical candles`);
            for (const k of klines) {
              this.emitKline({
                symbol: sym,
                interval: '1m',
                candle: {
                  open: +k[1],
                  high: +k[2],
                  low: +k[3],
                  close: +k[4],
                  volume: +k[5],
                  timestamp: new Date(k[0])
                },
                isFinal: true,
                source: 'binance'
              });
            }
            this.lastCandleTime[sym] = klines[klines.length - 1][0];
          }
        } catch (e) {
          console.error(`Binance historical error for ${sym}:`, e);
        }
      }
      this.historicalLoaded = true;
      console.log('✅ Historical candles loaded - Bot ready');
    };

    const fetchLive = async () => {
      if (!this.historicalLoaded) return; // Սպասենք պատմականը լցվի

      for (const sym of symbols) {
        try {
          // Ticker
          const tickerRes = await fetch(
            `https://testnet.binance.vision/api/v3/ticker/24hr?symbol=${sym}`
          );
          const ticker = await tickerRes.json();

          if (ticker.lastPrice) {
            const price = +ticker.lastPrice;
            const spread = price * 0.0001;
            this.emitTicker({
              symbol: sym,
              price,
              bid: price - spread,
              ask: price + spread,
              volume24h: +ticker.volume,
              change24h: +ticker.priceChangePercent,
              timestamp: new Date(),
              source: 'binance'
            });
          }

          // Նոր candle - միայն եթե նոր է
          const klineRes = await fetch(
            `https://testnet.binance.vision/api/v3/klines?symbol=${sym}&interval=1m&limit=1`
          );
          const klines = await klineRes.json();

          if (klines.length > 0) {
            const k = klines[0];
            const candleTime = k[0];

            if (this.lastCandleTime[sym]!== candleTime) {
              this.lastCandleTime[sym] = candleTime;
              this.emitKline({
                symbol: sym,
                interval: '1m',
                candle: {
                  open: +k[1],
                  high: +k[2],
                  low: +k[3],
                  close: +k[4],
                  volume: +k[5],
                  timestamp: new Date(candleTime)
                },
                isFinal: true,
                source: 'binance'
              });
            }
          }
        } catch (e) {
          console.error(`Binance live fetch error for ${sym}:`, e);
        }
      }
    };

    // 1. Միանգամից պատմականը
    fetchHistorical().then(() => {
      // 2. Հետո ամեն 3 վայրկյան live
      this.pollTimer = setInterval(fetchLive, 3000);
    });
  }

  // Bybit Testnet REST API
  private startBybitPolling(symbols: string[]) {
    this.connected = true;
    console.log('✅ Bybit Testnet REST polling started');

    const fetchHistorical = async () => {
      for (const sym of symbols) {
        try {
          const res = await fetch(
            `https://api-testnet.bybit.com/v5/market/kline?category=spot&symbol=${sym}&interval=1&limit=100`
          );
          const data = await res.json();
          const klines = data.result?.list?? [];

          if (klines.length > 0) {
            console.log(`📈 ${sym}: Loaded ${klines.length} historical candles`);
            // Bybit-ը հակառակ հերթականությամբ է տալիս
            for (const k of klines.reverse()) {
              this.emitKline({
                symbol: sym,
                interval: '1m',
                candle: {
                  open: +k[1],
                  high: +k[2],
                  low: +k[3],
                  close: +k[4],
                  volume: +k[5],
                  timestamp: new Date(+k[0])
                },
                isFinal: true,
                source: 'bybit'
              });
            }
            this.lastCandleTime[sym] = +klines[0][0];
          }
        } catch (e) {
          console.error(`Bybit historical error for ${sym}:`, e);
        }
      }
      this.historicalLoaded = true;
      console.log('✅ Historical candles loaded - Bot ready');
    };

    const fetchLive = async () => {
      if (!this.historicalLoaded) return;

      for (const sym of symbols) {
        try {
          const tickerRes = await fetch(
            `https://api-testnet.bybit.com/v5/market/tickers?category=spot&symbol=${sym}`
          );
          const data = await tickerRes.json();
          const t = data.result?.list?.[0];

          if (t) {
            const price = +t.lastPrice;
            const spread = price * 0.0001;
            this.emitTicker({
              symbol: sym,
              price,
              bid: price - spread,
              ask: price + spread,
              volume24h: +t.volume24h,
              change24h: +t.price24hPcnt * 100,
              timestamp: new Date(),
              source: 'bybit'
            });
          }

          const klineRes = await fetch(
            `https://api-testnet.bybit.com/v5/market/kline?category=spot&symbol=${sym}&interval=1&limit=1`
          );
          const klineData = await klineRes.json();
          const k = klineData.result?.list?.[0];

          if (k) {
            const candleTime = +k[0];
            if (this.lastCandleTime[sym]!== candleTime) {
              this.lastCandleTime[sym] = candleTime;
              this.emitKline({
                symbol: sym,
                interval: '1m',
                candle: {
                  open: +k[1],
                  high: +k[2],
                  low: +k[3],
                  close: +k[4],
                  volume: +k[5],
                  timestamp: new Date(candleTime)
                },
                isFinal: true,
                source: 'bybit'
              });
            }
          }
        } catch (e) {
          console.error(`Bybit live fetch error for ${sym}:`, e);
        }
      }
    };

    fetchHistorical().then(() => {
      this.pollTimer = setInterval(fetchLive, 3000);
    });
  }

  private startMock() {
    if (this.mockTimer) clearInterval(this.mockTimer);
    this.connected = true;
    console.log('⚠️ Using MOCK feed');
    // Mock-ը մնում է նույնը
    for (const sym of this.syms) {
      let p = this.mockPrices[sym]?? 1000;
      for (let i = 100; i >= 0; i--) {
        const chg = (Math.random() - 0.5) * p * 0.002;
        const o = p, c = p + chg;
        this.emitKline({ symbol: sym, interval: '1m',
          candle: { open: o, high: Math.max(o,c)+Math.random()*p*0.001, low: Math.min(o,c)-Math.random()*p*0.001,
            close: c, volume: 20+Math.random()*200, timestamp: new Date(Date.now()-i*60000) },
          isFinal: true, source: 'mock' });
        p = c;
      }
      this.mockPrices[sym] = p;
    }
    this.mockTimer = setInterval(() => {
      for (const sym of this.syms) {
        const base = this.mockPrices[sym]?? 1000;
        const chg = (Math.random() - 0.495) * base * 0.0015;
        const p = Math.max(base + chg, base * 0.5);
        this.mockPrices[sym] = p;
        const spread = p * 0.0001;
        this.emitTicker({ symbol: sym, price: p, bid: p-spread, ask: p+spread,
          volume24h: 1e9+Math.random()*5e8, change24h: (chg/base)*100,
          timestamp: new Date(), source: 'mock' });
        this.emitKline({ symbol: sym, interval: '1m',
          candle: { open: base, high: Math.max(base,p)+Math.random()*p*0.0003,
            low: Math.min(base,p)-Math.random()*p*0.0003, close: p,
            volume: 10+Math.random()*100, timestamp: new Date() },
          isFinal: true, source: 'mock' });
      }
    }, 2000);
  }

  private emitTicker(u: TickerUpdate) {
    this.tickerCBs.get(u.symbol)?.forEach(cb => cb(u));
    this.tickerCBs.get('*')?.forEach(cb => cb(u));
  }
  private emitKline(u: KlineUpdate) {
    this.klineCBs.get(u.symbol)?.forEach(cb => cb(u));
    this.klineCBs.get('*')?.forEach(cb => cb(u));
  }

  onTicker(sym: string, cb: TickerCB) {
    if (!this.tickerCBs.has(sym)) this.tickerCBs.set(sym, new Set());
    this.tickerCBs.get(sym)!.add(cb);
    return () => this.tickerCBs.get(sym)?.delete(cb);
  }
  onKline(sym: string, cb: KlineCB) {
    if (!this.klineCBs.has(sym)) this.klineCBs.set(sym, new Set());
    this.klineCBs.get(sym)!.add(cb);
    return () => this.klineCBs.get(sym)?.delete(cb);
  }

  disconnect() {
    this.connected = false;
    if (this.mockTimer) { clearInterval(this.mockTimer); this.mockTimer = null; }
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
    this.lastCandleTime = {};
    this.historicalLoaded = false;
    console.log('🛑 Feed disconnected');
  }
}

let _feed: MarketFeedManager | null = null;
export const getMarketFeed = () => { if (!_feed) _feed = new MarketFeedManager(); return _feed; };