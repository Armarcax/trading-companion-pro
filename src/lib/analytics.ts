// Trade Analytics Layer - HAYQ Project
// Advanced performance metrics, logging, and analytics

export interface TradeLog {
  id: string;
  timestamp: Date;
  symbol: string;
  direction: 'BUY' | 'SELL';
  
  // Entry details
  entryPrice: number;
  entryQuantity: number;
  
  // Exit details
  exitPrice: number | null;
  exitQuantity: number | null;
  closedAt: Date | null;
  
  // Strategy breakdown
  strategyScores: StrategyScore[];
  aggregatedScore: number;
  confidence: number;
  
  // Risk state at execution
  riskState: RiskSnapshot;
  
  // Market conditions
  marketConditions: MarketConditionsLog;
  
  // Results
  pnl: number;
  pnlPercent: number;
  holdingTimeMinutes: number;
  
  // Execution details
  slippage: number;
  commission: number;
  effectivePrice: number;
  
  // Status
  status: 'open' | 'closed' | 'cancelled';
}

export interface StrategyScore {
  name: string;
  signal: 'BUY' | 'SELL' | null;
  score: number;
  weight: number;
  weightedScore: number;
}

export interface RiskSnapshot {
  dailyPnLPercent: number;
  consecutiveLosses: number;
  currentExposure: number;
  currentDrawdown: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface MarketConditionsLog {
  price: number;
  volume: number;
  volatility: number;
  spread: number;
  trend: 'up' | 'down' | 'sideways';
}

export interface PerformanceMetrics {
  // Basic metrics
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  
  // Profit metrics
  totalPnL: number;
  totalPnLPercent: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  
  // Risk-adjusted metrics
  expectancy: number;
  profitFactor: number;
  payoffRatio: number;
  
  // Sharpe & Sortino (simplified)
  sharpeRatio: number;
  sortinoRatio: number;
  
  // Drawdown metrics
  maxDrawdown: number;
  maxDrawdownDuration: number; // in days
  currentDrawdown: number;
  avgDrawdown: number;
  
  // Streak metrics
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  currentStreak: number;
  currentStreakType: 'win' | 'loss' | 'none';
  
  // Time metrics
  avgHoldingTime: number; // minutes
  tradesPerDay: number;
  
  // Recovery metrics
  recoveryFactor: number;
  
  // Per-strategy breakdown
  strategyPerformance: Map<string, StrategyMetrics>;
}

export interface StrategyMetrics {
  name: string;
  signalCount: number;
  winRate: number;
  avgContribution: number;
  profitContribution: number;
}

export interface DrawdownPeriod {
  startDate: Date;
  endDate: Date | null;
  peakEquity: number;
  troughEquity: number;
  drawdownPercent: number;
  durationDays: number;
  recovered: boolean;
}

export interface EquityDataPoint {
  timestamp: Date;
  equity: number;
  drawdown: number;
  pnl: number;
}

const RISK_FREE_RATE = 0.05; // 5% annual risk-free rate

export class TradeAnalytics {
  private trades: TradeLog[] = [];
  private equityCurve: EquityDataPoint[] = [];
  private initialCapital: number;
  private currentCapital: number;
  private peakEquity: number;
  private drawdownPeriods: DrawdownPeriod[] = [];
  private currentDrawdownPeriod: DrawdownPeriod | null = null;

  constructor(initialCapital: number = 10000) {
    this.initialCapital = initialCapital;
    this.currentCapital = initialCapital;
    this.peakEquity = initialCapital;
    
    this.equityCurve.push({
      timestamp: new Date(),
      equity: initialCapital,
      drawdown: 0,
      pnl: 0,
    });
  }

  // ===== LOGGING =====
  logTrade(trade: TradeLog): void {
    this.trades.push(trade);
    
    if (trade.status === 'closed' && trade.pnl !== undefined) {
      this.currentCapital += trade.pnl;
      
      // Update equity curve
      const drawdown = this.peakEquity > 0 
        ? (this.peakEquity - this.currentCapital) / this.peakEquity 
        : 0;
      
      this.equityCurve.push({
        timestamp: new Date(),
        equity: this.currentCapital,
        drawdown,
        pnl: trade.pnl,
      });
      
      // Track drawdown periods
      if (this.currentCapital > this.peakEquity) {
        this.peakEquity = this.currentCapital;
        
        if (this.currentDrawdownPeriod) {
          this.currentDrawdownPeriod.endDate = new Date();
          this.currentDrawdownPeriod.recovered = true;
          this.currentDrawdownPeriod.durationDays = this.calculateDaysBetween(
            this.currentDrawdownPeriod.startDate,
            this.currentDrawdownPeriod.endDate
          );
          this.drawdownPeriods.push(this.currentDrawdownPeriod);
          this.currentDrawdownPeriod = null;
        }
      } else if (drawdown > 0) {
        if (!this.currentDrawdownPeriod) {
          this.currentDrawdownPeriod = {
            startDate: new Date(),
            endDate: null,
            peakEquity: this.peakEquity,
            troughEquity: this.currentCapital,
            drawdownPercent: drawdown,
            durationDays: 0,
            recovered: false,
          };
        } else if (this.currentCapital < this.currentDrawdownPeriod.troughEquity) {
          this.currentDrawdownPeriod.troughEquity = this.currentCapital;
          this.currentDrawdownPeriod.drawdownPercent = drawdown;
        }
      }
    }
  }

  // ===== METRICS CALCULATION =====
  calculateMetrics(): PerformanceMetrics {
    const closedTrades = this.trades.filter(t => t.status === 'closed');
    
    if (closedTrades.length === 0) {
      return this.getEmptyMetrics();
    }

    const wins = closedTrades.filter(t => t.pnl > 0);
    const losses = closedTrades.filter(t => t.pnl < 0);
    
    // Basic metrics
    const totalTrades = closedTrades.length;
    const winningTrades = wins.length;
    const losingTrades = losses.length;
    const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;
    
    // Profit metrics
    const totalPnL = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalPnLPercent = this.initialCapital > 0 ? totalPnL / this.initialCapital : 0;
    
    const avgWin = wins.length > 0 
      ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length 
      : 0;
    const avgLoss = losses.length > 0 
      ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length)
      : 0;
    
    const largestWin = wins.length > 0 
      ? Math.max(...wins.map(t => t.pnl)) 
      : 0;
    const largestLoss = losses.length > 0 
      ? Math.min(...losses.map(t => t.pnl)) 
      : 0;
    
    // Risk-adjusted metrics
    const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
    
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;
    const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);
    
    // Sharpe & Sortino
    const returns = this.calculateReturns(closedTrades);
    const sharpeRatio = this.calculateSharpeRatio(returns);
    const sortinoRatio = this.calculateSortinoRatio(returns);
    
    // Drawdown
    const maxDrawdown = this.calculateMaxDrawdown();
    const maxDrawdownDuration = this.calculateMaxDrawdownDuration();
    const currentDrawdown = this.peakEquity > 0 
      ? (this.peakEquity - this.currentCapital) / this.peakEquity 
      : 0;
    const avgDrawdown = this.equityCurve.length > 0
      ? this.equityCurve.reduce((sum, p) => sum + p.drawdown, 0) / this.equityCurve.length
      : 0;
    
    // Streaks
    const { maxConsecutiveWins, maxConsecutiveLosses, currentStreak, currentStreakType } = 
      this.calculateStreaks(closedTrades);
    
    // Time metrics
    const holdingTimes = closedTrades
      .filter(t => t.holdingTimeMinutes > 0)
      .map(t => t.holdingTimeMinutes);
    const avgHoldingTime = holdingTimes.length > 0
      ? holdingTimes.reduce((a, b) => a + b, 0) / holdingTimes.length
      : 0;
    
    const tradingDays = this.calculateTradingDays();
    const tradesPerDay = tradingDays > 0 ? totalTrades / tradingDays : 0;
    
    // Recovery factor
    const recoveryFactor = maxDrawdown > 0 ? totalPnLPercent / maxDrawdown : 0;
    
    // Strategy performance
    const strategyPerformance = this.calculateStrategyPerformance(closedTrades);
    
    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalPnL,
      totalPnLPercent,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      expectancy,
      profitFactor,
      payoffRatio,
      sharpeRatio,
      sortinoRatio,
      maxDrawdown,
      maxDrawdownDuration,
      currentDrawdown,
      avgDrawdown,
      maxConsecutiveWins,
      maxConsecutiveLosses,
      currentStreak,
      currentStreakType,
      avgHoldingTime,
      tradesPerDay,
      recoveryFactor,
      strategyPerformance,
    };
  }

  // ===== HELPER CALCULATIONS =====
  private calculateReturns(trades: TradeLog[]): number[] {
    let capital = this.initialCapital;
    const returns: number[] = [];
    
    for (const trade of trades) {
      if (trade.pnl !== 0) {
        const returnPct = trade.pnl / capital;
        returns.push(returnPct);
        capital += trade.pnl;
      }
    }
    
    return returns;
  }

  private calculateSharpeRatio(returns: number[]): number {
    if (returns.length < 2) return 0;
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return 0;
    
    // Annualize (assuming ~252 trading days, 10 trades per day average)
    const annualizedReturn = avgReturn * 252 * 10;
    const annualizedStdDev = stdDev * Math.sqrt(252 * 10);
    
    return (annualizedReturn - RISK_FREE_RATE) / annualizedStdDev;
  }

  private calculateSortinoRatio(returns: number[]): number {
    if (returns.length < 2) return 0;
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const negativeReturns = returns.filter(r => r < 0);
    
    if (negativeReturns.length === 0) return avgReturn > 0 ? Infinity : 0;
    
    const downsideVariance = negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length;
    const downsideDeviation = Math.sqrt(downsideVariance);
    
    if (downsideDeviation === 0) return 0;
    
    const annualizedReturn = avgReturn * 252 * 10;
    const annualizedDownside = downsideDeviation * Math.sqrt(252 * 10);
    
    return (annualizedReturn - RISK_FREE_RATE) / annualizedDownside;
  }

  private calculateMaxDrawdown(): number {
    if (this.equityCurve.length < 2) return 0;
    
    let maxDD = 0;
    let peak = this.equityCurve[0].equity;
    
    for (const point of this.equityCurve) {
      if (point.equity > peak) {
        peak = point.equity;
      }
      const dd = (peak - point.equity) / peak;
      if (dd > maxDD) {
        maxDD = dd;
      }
    }
    
    return maxDD;
  }

  private calculateMaxDrawdownDuration(): number {
    const allPeriods = [...this.drawdownPeriods];
    if (this.currentDrawdownPeriod) {
      allPeriods.push({
        ...this.currentDrawdownPeriod,
        endDate: new Date(),
        durationDays: this.calculateDaysBetween(this.currentDrawdownPeriod.startDate, new Date()),
      });
    }
    
    if (allPeriods.length === 0) return 0;
    
    return Math.max(...allPeriods.map(p => p.durationDays));
  }

  private calculateStreaks(trades: TradeLog[]): {
    maxConsecutiveWins: number;
    maxConsecutiveLosses: number;
    currentStreak: number;
    currentStreakType: 'win' | 'loss' | 'none';
  } {
    let maxWins = 0, maxLosses = 0;
    let currentWins = 0, currentLosses = 0;
    
    for (const trade of trades) {
      if (trade.pnl > 0) {
        currentWins++;
        currentLosses = 0;
        maxWins = Math.max(maxWins, currentWins);
      } else if (trade.pnl < 0) {
        currentLosses++;
        currentWins = 0;
        maxLosses = Math.max(maxLosses, currentLosses);
      }
    }
    
    return {
      maxConsecutiveWins: maxWins,
      maxConsecutiveLosses: maxLosses,
      currentStreak: Math.max(currentWins, currentLosses),
      currentStreakType: currentWins > 0 ? 'win' : currentLosses > 0 ? 'loss' : 'none',
    };
  }

  private calculateStrategyPerformance(trades: TradeLog[]): Map<string, StrategyMetrics> {
    const strategyMap = new Map<string, StrategyMetrics>();
    
    for (const trade of trades) {
      for (const score of trade.strategyScores) {
        let metrics = strategyMap.get(score.name);
        
        if (!metrics) {
          metrics = {
            name: score.name,
            signalCount: 0,
            winRate: 0,
            avgContribution: 0,
            profitContribution: 0,
          };
          strategyMap.set(score.name, metrics);
        }
        
        if (score.signal !== null) {
          metrics.signalCount++;
          
          const isCorrect = (score.signal === 'BUY' && trade.pnl > 0) ||
                           (score.signal === 'SELL' && trade.pnl > 0);
          
          // Update win rate incrementally
          metrics.winRate = ((metrics.winRate * (metrics.signalCount - 1)) + (isCorrect ? 1 : 0)) / metrics.signalCount;
          
          // Track contribution
          metrics.avgContribution = ((metrics.avgContribution * (metrics.signalCount - 1)) + score.weightedScore) / metrics.signalCount;
          metrics.profitContribution += score.weightedScore * (trade.pnl > 0 ? 1 : -1) * Math.abs(trade.pnl);
        }
      }
    }
    
    return strategyMap;
  }

  private calculateTradingDays(): number {
    if (this.trades.length < 2) return 1;
    
    const firstTrade = this.trades[0].timestamp;
    const lastTrade = this.trades[this.trades.length - 1].timestamp;
    
    return Math.max(1, this.calculateDaysBetween(firstTrade, lastTrade));
  }

  private calculateDaysBetween(start: Date, end: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((end.getTime() - start.getTime()) / msPerDay);
  }

  private getEmptyMetrics(): PerformanceMetrics {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      expectancy: 0,
      profitFactor: 0,
      payoffRatio: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      maxDrawdown: 0,
      maxDrawdownDuration: 0,
      currentDrawdown: 0,
      avgDrawdown: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      currentStreak: 0,
      currentStreakType: 'none',
      avgHoldingTime: 0,
      tradesPerDay: 0,
      recoveryFactor: 0,
      strategyPerformance: new Map(),
    };
  }

  // ===== GETTERS =====
  getTrades(): TradeLog[] {
    return [...this.trades];
  }

  getEquityCurve(): EquityDataPoint[] {
    return [...this.equityCurve];
  }

  getDrawdownPeriods(): DrawdownPeriod[] {
    return [...this.drawdownPeriods];
  }

  getCurrentCapital(): number {
    return this.currentCapital;
  }

  exportToCSV(): string {
    const headers = [
      'ID', 'Timestamp', 'Symbol', 'Direction', 'Entry Price', 'Exit Price',
      'Quantity', 'PnL', 'PnL %', 'Confidence', 'Status'
    ].join(',');
    
    const rows = this.trades.map(t => [
      t.id,
      t.timestamp.toISOString(),
      t.symbol,
      t.direction,
      t.entryPrice,
      t.exitPrice ?? '',
      t.entryQuantity,
      t.pnl.toFixed(2),
      (t.pnlPercent * 100).toFixed(2),
      (t.confidence * 100).toFixed(1),
      t.status
    ].join(','));
    
    return [headers, ...rows].join('\n');
  }

  reset(): void {
    this.trades = [];
    this.equityCurve = [{
      timestamp: new Date(),
      equity: this.initialCapital,
      drawdown: 0,
      pnl: 0,
    }];
    this.currentCapital = this.initialCapital;
    this.peakEquity = this.initialCapital;
    this.drawdownPeriods = [];
    this.currentDrawdownPeriod = null;
  }
}

// Export singleton
let analyticsInstance: TradeAnalytics | null = null;

export function getTradeAnalytics(initialCapital?: number): TradeAnalytics {
  if (!analyticsInstance) {
    analyticsInstance = new TradeAnalytics(initialCapital);
  }
  return analyticsInstance;
}

export function resetTradeAnalytics(initialCapital?: number): TradeAnalytics {
  analyticsInstance = new TradeAnalytics(initialCapital);
  return analyticsInstance;
}
