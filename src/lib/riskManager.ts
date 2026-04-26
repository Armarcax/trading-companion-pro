// Enhanced Risk Manager - HAYQ Project
// Independent risk control layer that operates separately from strategy logic

import type { CandleData } from './strategies/types';
import { calculateATR } from './strategies/technicalIndicators';

export interface RiskManagerConfig {
  // Daily limits
  maxDailyDrawdownPct: number;      // e.g., 0.05 = 5% max daily loss
  maxDailyTrades: number;           // Maximum trades per day
  
  // Consecutive loss protection
  maxConsecutiveLosses: number;     // Pause after N consecutive losses
  consecutiveLossCooldownMinutes: number; // Cooldown after hitting limit
  
  // Position sizing
  baseRiskPerTrade: number;         // Base risk % per trade (e.g., 0.02 = 2%)
  maxRiskPerTrade: number;          // Maximum risk % per trade
  minRiskPerTrade: number;          // Minimum risk % per trade
  
  // Volatility adjustments
  volatilityAdjustmentEnabled: boolean;
  highVolatilityThreshold: number;  // ATR multiple to consider "high volatility"
  volatilityRiskReduction: number;  // Reduce position size by this factor during high vol
  
  // Spread/Liquidity controls
  maxSpreadPct: number;             // Block trades if spread > this %
  minLiquidityThreshold: number;    // Minimum volume requirement
  
  // Exposure limits
  maxTotalExposure: number;         // Max % of capital in open positions
  maxSinglePairExposure: number;    // Max % of capital in single pair
  
  // Emergency controls
  killSwitchEnabled: boolean;       // Master kill switch
  autoRecoveryEnabled: boolean;     // Auto-resume after cooldown
  
  // Cooldowns
  tradeIntervalMinutes: number;     // Minimum time between trades
  
  // Advanced
  equityCurveFilter: boolean;       // Reduce size when equity curve is declining
  equityLookbackPeriod: number;     // Days to look back for equity curve
}

export interface RiskState {
  // Daily tracking
  dailyPnL: number;
  dailyPnLPercent: number;
  dailyTradesCount: number;
  dailyStartBalance: number;
  lastDailyReset: Date;
  
  // Consecutive tracking
  consecutiveLosses: number;
  consecutiveWins: number;
  
  // Time tracking
  lastTradeTime: Date | null;
  pausedUntil: Date | null;
  
  // Position tracking
  currentExposure: number;
  openPositions: Map<string, number>; // symbol -> exposure
  
  // Capital tracking
  totalCapital: number;
  availableCapital: number;
  peakEquity: number;
  currentDrawdown: number;
  
  // Status
  isKillSwitchActive: boolean;
  isPaused: boolean;
  pauseReason: string | null;
  
  // Historical
  recentTrades: TradeResult[];
  equityCurve: EquityPoint[];
}

export interface TradeResult {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  timestamp: Date;
  closedAt: Date | null;
  isOpen: boolean;
}

export interface EquityPoint {
  timestamp: Date;
  equity: number;
  drawdown: number;
}

export interface RiskCheckResult {
  approved: boolean;
  reason: string;
  adjustedRiskPercent: number;
  adjustedPositionSize: number;
  warnings: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface MarketConditions {
  currentPrice: number;
  bidPrice: number;
  askPrice: number;
  volume24h: number;
  avgVolume: number;
  volatility: number; // ATR-based
  spreadPct: number;
}

export const defaultRiskManagerConfig: RiskManagerConfig = {
  // Daily limits
  maxDailyDrawdownPct: 0.05,
  maxDailyTrades: 20,
  
  // Consecutive loss protection
  maxConsecutiveLosses: 3,
  consecutiveLossCooldownMinutes: 30,
  
  // Position sizing
  baseRiskPerTrade: 0.02,
  maxRiskPerTrade: 0.03,
  minRiskPerTrade: 0.005,
  
  // Volatility adjustments
  volatilityAdjustmentEnabled: true,
  highVolatilityThreshold: 2.0,
  volatilityRiskReduction: 0.5,
  
  // Spread/Liquidity controls
  maxSpreadPct: 0.001,
  minLiquidityThreshold: 100000,
  
  // Exposure limits
  maxTotalExposure: 0.30,
  maxSinglePairExposure: 0.10,
  
  // Emergency controls
  killSwitchEnabled: false,
  autoRecoveryEnabled: true,
  
  // Cooldowns
  tradeIntervalMinutes: 2,
  
  // Advanced
  equityCurveFilter: true,
  equityLookbackPeriod: 7,
};

export function createInitialRiskState(initialCapital: number): RiskState {
  return {
    dailyPnL: 0,
    dailyPnLPercent: 0,
    dailyTradesCount: 0,
    dailyStartBalance: initialCapital,
    lastDailyReset: new Date(),
    
    consecutiveLosses: 0,
    consecutiveWins: 0,
    
    lastTradeTime: null,
    pausedUntil: null,
    
    currentExposure: 0,
    openPositions: new Map(),
    
    totalCapital: initialCapital,
    availableCapital: initialCapital,
    peakEquity: initialCapital,
    currentDrawdown: 0,
    
    isKillSwitchActive: false,
    isPaused: false,
    pauseReason: null,
    
    recentTrades: [],
    equityCurve: [{
      timestamp: new Date(),
      equity: initialCapital,
      drawdown: 0,
    }],
  };
}

export class RiskManager {
  private config: RiskManagerConfig;
  private state: RiskState;

  constructor(config: RiskManagerConfig = defaultRiskManagerConfig, initialCapital: number = 10000) {
    this.config = config;
    this.state = createInitialRiskState(initialCapital);
  }

  // ===== MAIN RISK CHECK =====
  checkTradeRisk(
    symbol: string,
    direction: 'BUY' | 'SELL',
    entryPrice: number,
    stopLossPrice: number,
    marketConditions: MarketConditions,
    candles: CandleData[]
  ): RiskCheckResult {
    const warnings: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // 1️⃣ KILL SWITCH CHECK (Highest Priority)
    if (this.config.killSwitchEnabled || this.state.isKillSwitchActive) {
      return {
        approved: false,
        reason: '🚨 KILL SWITCH ACTIVE - All trading halted',
        adjustedRiskPercent: 0,
        adjustedPositionSize: 0,
        warnings: ['Emergency kill switch is active'],
        riskLevel: 'critical',
      };
    }

    // 2️⃣ PAUSE CHECK
    if (this.state.isPaused && this.state.pausedUntil) {
      if (new Date() < this.state.pausedUntil) {
        const remainingMs = this.state.pausedUntil.getTime() - Date.now();
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        return {
          approved: false,
          reason: `⏸️ Trading paused: ${this.state.pauseReason}. Resumes in ${remainingMinutes} min`,
          adjustedRiskPercent: 0,
          adjustedPositionSize: 0,
          warnings: [`Pause reason: ${this.state.pauseReason}`],
          riskLevel: 'high',
        };
      } else {
        // Auto-recovery
        this.resumeTrading();
      }
    }

    // 3️⃣ DAILY DRAWDOWN CHECK
    this.checkDailyReset();
    if (Math.abs(this.state.dailyPnLPercent) >= this.config.maxDailyDrawdownPct) {
      this.pauseTrading(`Daily drawdown limit reached (${(this.state.dailyPnLPercent * 100).toFixed(2)}%)`);
      return {
        approved: false,
        reason: `📉 Daily drawdown limit reached: ${(this.state.dailyPnLPercent * 100).toFixed(2)}%`,
        adjustedRiskPercent: 0,
        adjustedPositionSize: 0,
        warnings: ['Maximum daily loss exceeded'],
        riskLevel: 'critical',
      };
    }

    // 4️⃣ DAILY TRADE LIMIT CHECK
    if (this.state.dailyTradesCount >= this.config.maxDailyTrades) {
      return {
        approved: false,
        reason: `📊 Daily trade limit reached: ${this.state.dailyTradesCount}/${this.config.maxDailyTrades}`,
        adjustedRiskPercent: 0,
        adjustedPositionSize: 0,
        warnings: ['Maximum daily trades exceeded'],
        riskLevel: 'high',
      };
    }

    // 5️⃣ CONSECUTIVE LOSS CHECK
    if (this.state.consecutiveLosses >= this.config.maxConsecutiveLosses) {
      this.pauseTrading(
        `${this.config.maxConsecutiveLosses} consecutive losses`,
        this.config.consecutiveLossCooldownMinutes
      );
      return {
        approved: false,
        reason: `🔴 Consecutive loss limit: ${this.state.consecutiveLosses} losses in a row`,
        adjustedRiskPercent: 0,
        adjustedPositionSize: 0,
        warnings: ['Consecutive loss protection triggered'],
        riskLevel: 'critical',
      };
    }

    // 6️⃣ TRADE INTERVAL CHECK
    if (this.state.lastTradeTime) {
      const minIntervalMs = this.config.tradeIntervalMinutes * 60 * 1000;
      const timeSinceLastTrade = Date.now() - this.state.lastTradeTime.getTime();
      if (timeSinceLastTrade < minIntervalMs) {
        const remainingSec = Math.ceil((minIntervalMs - timeSinceLastTrade) / 1000);
        return {
          approved: false,
          reason: `⏱️ Trade cooldown: Wait ${remainingSec}s`,
          adjustedRiskPercent: 0,
          adjustedPositionSize: 0,
          warnings: ['Minimum trade interval not met'],
          riskLevel: 'medium',
        };
      }
    }

    // 7️⃣ SPREAD CHECK
    if (marketConditions.spreadPct > this.config.maxSpreadPct) {
      warnings.push(`High spread: ${(marketConditions.spreadPct * 100).toFixed(3)}%`);
      riskLevel = 'high';
      return {
        approved: false,
        reason: `📈 Spread too high: ${(marketConditions.spreadPct * 100).toFixed(3)}% > ${(this.config.maxSpreadPct * 100).toFixed(3)}%`,
        adjustedRiskPercent: 0,
        adjustedPositionSize: 0,
        warnings,
        riskLevel,
      };
    }

    // 8️⃣ LIQUIDITY CHECK
    if (marketConditions.volume24h < this.config.minLiquidityThreshold) {
      warnings.push(`Low liquidity: ${marketConditions.volume24h.toLocaleString()}`);
      riskLevel = 'high';
      return {
        approved: false,
        reason: `💧 Insufficient liquidity: ${marketConditions.volume24h.toLocaleString()} < ${this.config.minLiquidityThreshold.toLocaleString()}`,
        adjustedRiskPercent: 0,
        adjustedPositionSize: 0,
        warnings,
        riskLevel,
      };
    }

    // 9️⃣ EXPOSURE CHECK
    const existingExposure = this.state.openPositions.get(symbol) || 0;
    if (this.state.currentExposure >= this.config.maxTotalExposure) {
      return {
        approved: false,
        reason: `🔒 Max exposure reached: ${(this.state.currentExposure * 100).toFixed(1)}%`,
        adjustedRiskPercent: 0,
        adjustedPositionSize: 0,
        warnings: ['Total exposure limit reached'],
        riskLevel: 'high',
      };
    }

    // ===== CALCULATE ADJUSTED RISK =====
    let adjustedRiskPercent = this.config.baseRiskPerTrade;

    // Volatility adjustment
    if (this.config.volatilityAdjustmentEnabled) {
      const avgATR = this.calculateAvgATR(candles);
      const currentATR = marketConditions.volatility;
      
      if (avgATR > 0 && currentATR / avgATR > this.config.highVolatilityThreshold) {
        adjustedRiskPercent *= this.config.volatilityRiskReduction;
        warnings.push(`High volatility detected - risk reduced by ${((1 - this.config.volatilityRiskReduction) * 100).toFixed(0)}%`);
        riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      }
    }

    // Equity curve filter
    if (this.config.equityCurveFilter) {
      const equityTrend = this.calculateEquityTrend();
      if (equityTrend < 0) {
        adjustedRiskPercent *= 0.75;
        warnings.push('Equity curve declining - position size reduced');
        riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      }
    }

    // Clamp to min/max
    adjustedRiskPercent = Math.max(
      this.config.minRiskPerTrade,
      Math.min(this.config.maxRiskPerTrade, adjustedRiskPercent)
    );

    // Calculate position size
    const riskAmount = this.state.availableCapital * adjustedRiskPercent;
    const riskPerUnit = Math.abs(entryPrice - stopLossPrice);
    const adjustedPositionSize = riskPerUnit > 0 ? riskAmount / riskPerUnit : 0;

    // Final exposure check after position sizing
    const newExposure = (adjustedPositionSize * entryPrice) / this.state.totalCapital;
    if (existingExposure + newExposure > this.config.maxSinglePairExposure) {
      const maxAllowedSize = ((this.config.maxSinglePairExposure - existingExposure) * this.state.totalCapital) / entryPrice;
      return {
        approved: true,
        reason: `⚠️ Position size reduced due to pair exposure limit`,
        adjustedRiskPercent,
        adjustedPositionSize: Math.max(0, maxAllowedSize),
        warnings: [...warnings, 'Position reduced to respect pair exposure limit'],
        riskLevel: 'medium',
      };
    }

    return {
      approved: true,
      reason: `✅ Risk check passed`,
      adjustedRiskPercent,
      adjustedPositionSize,
      warnings,
      riskLevel,
    };
  }

  // ===== STATE MANAGEMENT =====
  recordTradeResult(trade: TradeResult): void {
    this.state.recentTrades.unshift(trade);
    if (this.state.recentTrades.length > 100) {
      this.state.recentTrades.pop();
    }

    if (!trade.isOpen && trade.pnl !== 0) {
      // Update daily PnL
      this.state.dailyPnL += trade.pnl;
      this.state.dailyPnLPercent = this.state.dailyPnL / this.state.dailyStartBalance;
      this.state.dailyTradesCount++;

      // Update consecutive counts
      if (trade.pnl > 0) {
        this.state.consecutiveWins++;
        this.state.consecutiveLosses = 0;
      } else {
        this.state.consecutiveLosses++;
        this.state.consecutiveWins = 0;
      }

      // Update capital
      this.state.totalCapital += trade.pnl;
      this.state.availableCapital = this.state.totalCapital - 
        Array.from(this.state.openPositions.values()).reduce((a, b) => a + b, 0);

      // Update peak/drawdown
      if (this.state.totalCapital > this.state.peakEquity) {
        this.state.peakEquity = this.state.totalCapital;
      }
      this.state.currentDrawdown = (this.state.peakEquity - this.state.totalCapital) / this.state.peakEquity;

      // Update equity curve
      this.state.equityCurve.push({
        timestamp: new Date(),
        equity: this.state.totalCapital,
        drawdown: this.state.currentDrawdown,
      });

      this.state.lastTradeTime = new Date();
    }

    // Update exposure
    if (trade.isOpen) {
      const exposure = trade.quantity * trade.entryPrice;
      this.state.openPositions.set(trade.symbol, (this.state.openPositions.get(trade.symbol) || 0) + exposure);
      this.state.currentExposure = Array.from(this.state.openPositions.values()).reduce((a, b) => a + b, 0) / this.state.totalCapital;
    }
  }

  closePosition(symbol: string, pnl: number): void {
    this.state.openPositions.delete(symbol);
    this.state.currentExposure = Array.from(this.state.openPositions.values()).reduce((a, b) => a + b, 0) / this.state.totalCapital;
  }

  // ===== CONTROL METHODS =====
  activateKillSwitch(): void {
    this.state.isKillSwitchActive = true;
    this.state.isPaused = true;
    this.state.pauseReason = 'Emergency kill switch activated';
  }

  deactivateKillSwitch(): void {
    this.state.isKillSwitchActive = false;
    this.resumeTrading();
  }

  pauseTrading(reason: string, durationMinutes?: number): void {
    this.state.isPaused = true;
    this.state.pauseReason = reason;
    
    if (durationMinutes && this.config.autoRecoveryEnabled) {
      this.state.pausedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
    }
  }

  resumeTrading(): void {
    this.state.isPaused = false;
    this.state.pauseReason = null;
    this.state.pausedUntil = null;
    this.state.consecutiveLosses = 0; // Reset on resume
  }

  // ===== UTILITY METHODS =====
  private checkDailyReset(): void {
    const now = new Date();
    const lastReset = this.state.lastDailyReset;
    
    if (now.getUTCDate() !== lastReset.getUTCDate() || 
        now.getUTCMonth() !== lastReset.getUTCMonth() ||
        now.getUTCFullYear() !== lastReset.getUTCFullYear()) {
      // New day - reset daily stats
      this.state.dailyPnL = 0;
      this.state.dailyPnLPercent = 0;
      this.state.dailyTradesCount = 0;
      this.state.dailyStartBalance = this.state.totalCapital;
      this.state.lastDailyReset = now;
      
      // Auto-resume if paused for daily reasons
      if (this.state.pauseReason?.includes('Daily')) {
        this.resumeTrading();
      }
    }
  }

  private calculateAvgATR(candles: CandleData[]): number {
    if (candles.length < 14) return 0;
    
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const closes = candles.map(c => c.close);
    
    return calculateATR(highs, lows, closes, 14) || 0;
  }

  private calculateEquityTrend(): number {
    const lookbackDays = this.config.equityLookbackPeriod;
    const cutoff = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
    
    const recentPoints = this.state.equityCurve.filter(p => p.timestamp >= cutoff);
    if (recentPoints.length < 2) return 0;
    
    const first = recentPoints[0].equity;
    const last = recentPoints[recentPoints.length - 1].equity;
    
    return (last - first) / first;
  }

  // ===== GETTERS =====
  getState(): RiskState {
    return { ...this.state };
  }

  getConfig(): RiskManagerConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<RiskManagerConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getStatusSummary(): {
    status: 'active' | 'paused' | 'kill_switch';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    dailyPnLPercent: number;
    consecutiveLosses: number;
    currentExposure: number;
    currentDrawdown: number;
  } {
    let status: 'active' | 'paused' | 'kill_switch' = 'active';
    if (this.state.isKillSwitchActive) status = 'kill_switch';
    else if (this.state.isPaused) status = 'paused';

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (this.state.currentDrawdown > 0.10) riskLevel = 'critical';
    else if (this.state.currentDrawdown > 0.05) riskLevel = 'high';
    else if (this.state.consecutiveLosses >= 2) riskLevel = 'medium';

    return {
      status,
      riskLevel,
      dailyPnLPercent: this.state.dailyPnLPercent,
      consecutiveLosses: this.state.consecutiveLosses,
      currentExposure: this.state.currentExposure,
      currentDrawdown: this.state.currentDrawdown,
    };
  }
}

// Export singleton factory
let riskManagerInstance: RiskManager | null = null;

export function getRiskManager(config?: RiskManagerConfig, initialCapital?: number): RiskManager {
  if (!riskManagerInstance) {
    riskManagerInstance = new RiskManager(config, initialCapital);
  }
  return riskManagerInstance;
}

export function resetRiskManager(config?: RiskManagerConfig, initialCapital?: number): RiskManager {
  riskManagerInstance = new RiskManager(config, initialCapital);
  return riskManagerInstance;
}
