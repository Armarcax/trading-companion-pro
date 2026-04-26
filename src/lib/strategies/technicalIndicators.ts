// Technical Indicators - HAYQ Project
// Converted from Python to TypeScript

export function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function calculateEMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const k = 2 / (period + 1);
  
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  
  return ema;
}

export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50.0;
  
  const deltas: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    deltas.push(prices[i] - prices[i - 1]);
  }
  
  const gains = deltas.map(d => (d > 0 ? d : 0));
  const losses = deltas.map(d => (d < 0 ? -d : 0));
  
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  let rsi: number;
  
  if (avgLoss === 0) {
    rsi = 100.0;
  } else {
    const rs = avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));
  }
  
  for (let i = period; i < deltas.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    
    if (avgLoss === 0) {
      rsi = 100.0;
    } else {
      const rs = avgGain / avgLoss;
      rsi = 100 - (100 / (1 + rs));
    }
  }
  
  return rsi;
}

export function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number {
  if (highs.length < period + 1) return 0.0;
  
  const trValues: number[] = [];
  
  for (let i = 1; i < highs.length; i++) {
    const hl = highs[i] - lows[i];
    const hc = Math.abs(highs[i] - closes[i - 1]);
    const lc = Math.abs(lows[i] - closes[i - 1]);
    trValues.push(Math.max(hl, hc, lc));
  }
  
  let atr = trValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < trValues.length; i++) {
    atr = (atr * (period - 1) + trValues[i]) / period;
  }
  
  return atr;
}

export function calculateMACD(
  prices: number[],
  fast: number = 12,
  slow: number = 26,
  signal: number = 9
): { macdLine: number; signalLine: number; histogram: number } {
  if (prices.length < slow + signal) {
    return { macdLine: 0, signalLine: 0, histogram: 0 };
  }
  
  const macdSeries: number[] = [];
  
  for (let i = slow; i <= prices.length; i++) {
    const slice = prices.slice(0, i);
    const emaFast = calculateEMA(slice, fast);
    const emaSlow = calculateEMA(slice, slow);
    
    if (emaFast !== null && emaSlow !== null) {
      macdSeries.push(emaFast - emaSlow);
    }
  }
  
  const signalLine = calculateEMA(macdSeries, signal) ?? 0;
  const macdLine = macdSeries[macdSeries.length - 1] ?? 0;
  const histogram = macdLine - signalLine;
  
  return { macdLine, signalLine, histogram };
}

export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number; middle: number; lower: number } {
  if (prices.length < period) {
    const lastPrice = prices[prices.length - 1] ?? 0;
    return { upper: lastPrice, middle: lastPrice, lower: lastPrice };
  }
  
  const slice = prices.slice(-period);
  const sma = slice.reduce((a, b) => a + b, 0) / period;
  
  const squaredDiffs = slice.map(p => Math.pow(p - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(variance);
  
  return {
    upper: sma + stdDev * std,
    middle: sma,
    lower: sma - stdDev * std
  };
}
