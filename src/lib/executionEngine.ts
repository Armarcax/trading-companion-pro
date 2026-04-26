// Execution Engine - HAYQ Project
// Central trade execution with state safety, duplicate prevention, and fail-safe behavior

import type { AggregatedSignal, CandleData } from './strategies/types';
import { RiskManager, RiskCheckResult, MarketConditions, TradeResult, getRiskManager } from './riskManager';
import { TradeSimulator, SimulatedOrder, MarketSnapshot, getTradeSimulator } from './tradeSimulator';
import { TradeAnalytics, TradeLog, getTradeAnalytics } from './analytics';
import { callExchangeApi, ExchangeType } from './exchangeService';

export type ExecutionMode = 'signal' | 'demo' | 'live';
export type ExecutionStatus = 'idle' | 'processing' | 'executing' | 'completed' | 'error';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ExecutionConfig {
  mode: ExecutionMode;
  exchange: ExchangeType;
  symbol: string;
  testnet: boolean;
  
  // Timeouts
  orderTimeoutMs: number;
  confirmationTimeoutMs: number;
  
  // Retry settings
  maxRetries: number;
  retryDelayMs: number;
  
  // Safety
  requireConfirmation: boolean;
  enableDuplicateCheck: boolean;
  duplicateWindowMs: number;
}

export interface PendingOrder {
  id: string;
  signal: AggregatedSignal;
  riskCheck: RiskCheckResult;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  quantity: number;
  createdAt: Date;
  status: 'pending' | 'confirmed' | 'executing' | 'completed' | 'failed' | 'cancelled';
  retryCount: number;
  error?: string;
}

export interface ExecutionResult {
  success: boolean;
  orderId?: string;
  executedPrice?: number;
  executedQuantity?: number;
  error?: string;
  simulatedOrder?: SimulatedOrder;
  tradeLog?: TradeLog;
}

export interface SystemStatus {
  executionStatus: ExecutionStatus;
  connectionStatus: ConnectionStatus;
  mode: ExecutionMode;
  lastSignalTime: Date | null;
  lastTradeTime: Date | null;
  pendingOrders: number;
  activePositions: number;
  riskStatus: {
    status: 'active' | 'paused' | 'kill_switch';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
}

export const defaultExecutionConfig: ExecutionConfig = {
  mode: 'signal',
  exchange: 'binance',
  symbol: 'BTCUSDT',
  testnet: true,
  
  orderTimeoutMs: 30000,
  confirmationTimeoutMs: 5000,
  
  maxRetries: 3,
  retryDelayMs: 1000,
  
  requireConfirmation: true,
  enableDuplicateCheck: true,
  duplicateWindowMs: 60000,
};

export class ExecutionEngine {
  private config: ExecutionConfig;
  private riskManager: RiskManager;
  private simulator: TradeSimulator;
  private analytics: TradeAnalytics;
  
  private status: ExecutionStatus = 'idle';
  private connectionStatus: ConnectionStatus = 'disconnected';
  private pendingOrders: Map<string, PendingOrder> = new Map();
  private recentOrderHashes: Map<string, Date> = new Map();
  private activePositions: Map<string, TradeResult> = new Map();
  
  private lastSignalTime: Date | null = null;
  private lastTradeTime: Date | null = null;
  private orderIdCounter = 0;
  
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(
    config: ExecutionConfig = defaultExecutionConfig,
    initialCapital: number = 10000
  ) {
    this.config = config;
    this.riskManager = getRiskManager(undefined, initialCapital);
    this.simulator = getTradeSimulator();
    this.analytics = getTradeAnalytics(initialCapital);
  }

  // ===== MAIN EXECUTION FLOW =====
  async processSignal(
    signal: AggregatedSignal,
    candles: CandleData[],
    marketConditions: MarketConditions
  ): Promise<ExecutionResult> {
    this.lastSignalTime = new Date();
    this.emit('signal', signal);

    // 1️⃣ Mode check - Signal mode only logs, doesn't execute
    if (this.config.mode === 'signal') {
      this.logSignal(signal, candles, marketConditions);
      return {
        success: true,
        error: 'Signal mode - no execution',
      };
    }

    // 2️⃣ Signal validation
    if (!signal.approved || !signal.direction) {
      return {
        success: false,
        error: `Signal not approved: ${signal.reason}`,
      };
    }

    // 3️⃣ Duplicate check
    const orderHash = this.generateOrderHash(signal, marketConditions.currentPrice);
    if (this.config.enableDuplicateCheck && this.isDuplicateOrder(orderHash)) {
      return {
        success: false,
        error: 'Duplicate order detected within window',
      };
    }

    // 4️⃣ Calculate entry and stops
    const entryPrice = marketConditions.currentPrice;
    const { stopLoss, takeProfit } = this.calculateStops(
      candles, 
      entryPrice, 
      signal.direction
    );

    // 5️⃣ Risk check
    const riskCheck = this.riskManager.checkTradeRisk(
      this.config.symbol,
      signal.direction,
      entryPrice,
      stopLoss,
      marketConditions,
      candles
    );

    this.emit('riskCheck', riskCheck);

    if (!riskCheck.approved) {
      return {
        success: false,
        error: riskCheck.reason,
      };
    }

    // 6️⃣ Create pending order
    const orderId = this.generateOrderId();
    const pendingOrder: PendingOrder = {
      id: orderId,
      signal,
      riskCheck,
      entryPrice,
      stopLoss,
      takeProfit,
      quantity: riskCheck.adjustedPositionSize,
      createdAt: new Date(),
      status: 'pending',
      retryCount: 0,
    };

    this.pendingOrders.set(orderId, pendingOrder);
    this.recentOrderHashes.set(orderHash, new Date());
    this.emit('orderCreated', pendingOrder);

    // 7️⃣ Execute based on mode
    try {
      this.status = 'executing';
      let result: ExecutionResult;

      if (this.config.mode === 'demo') {
        result = await this.executeDemo(pendingOrder, marketConditions);
      } else {
        result = await this.executeLive(pendingOrder);
      }

      if (result.success) {
        pendingOrder.status = 'completed';
        this.lastTradeTime = new Date();
        this.emit('orderCompleted', { order: pendingOrder, result });
      } else {
        pendingOrder.status = 'failed';
        pendingOrder.error = result.error;
        this.emit('orderFailed', { order: pendingOrder, result });
      }

      return result;
    } catch (error) {
      pendingOrder.status = 'failed';
      pendingOrder.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit('orderError', { order: pendingOrder, error });
      
      return {
        success: false,
        error: pendingOrder.error,
      };
    } finally {
      this.status = 'idle';
      this.pendingOrders.delete(orderId);
    }
  }

  // ===== EXECUTION METHODS =====
  private async executeDemo(
    order: PendingOrder,
    marketConditions: MarketConditions
  ): Promise<ExecutionResult> {
    const marketSnapshot: MarketSnapshot = {
      bid: marketConditions.bidPrice,
      ask: marketConditions.askPrice,
      lastPrice: marketConditions.currentPrice,
      volume24h: marketConditions.volume24h,
      volatility: marketConditions.volatility,
      depth: [],
    };

    const simulatedOrder = await this.simulator.simulateOrder(
      this.config.symbol,
      order.signal.direction!,
      order.quantity,
      order.entryPrice,
      marketSnapshot
    );

    if (simulatedOrder.status === 'rejected') {
      return {
        success: false,
        error: simulatedOrder.rejectionReason,
        simulatedOrder,
      };
    }

    // Log the trade
    const tradeLog = this.createTradeLog(order, simulatedOrder);
    this.analytics.logTrade(tradeLog);

    // Update risk manager
    const tradeResult: TradeResult = {
      id: order.id,
      symbol: this.config.symbol,
      direction: order.signal.direction!,
      entryPrice: simulatedOrder.executedPrice,
      exitPrice: null,
      quantity: simulatedOrder.executedQuantity,
      pnl: 0,
      pnlPercent: 0,
      timestamp: new Date(),
      closedAt: null,
      isOpen: true,
    };

    this.riskManager.recordTradeResult(tradeResult);
    this.activePositions.set(order.id, tradeResult);

    return {
      success: true,
      orderId: order.id,
      executedPrice: simulatedOrder.executedPrice,
      executedQuantity: simulatedOrder.executedQuantity,
      simulatedOrder,
      tradeLog,
    };
  }

  private async executeLive(order: PendingOrder): Promise<ExecutionResult> {
    let lastError: string | undefined;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await Promise.race([
          callExchangeApi(this.config.exchange, 'place_order', {
            symbol: this.config.symbol,
            side: order.signal.direction,
            quantity: order.quantity,
            type: 'MARKET',
            testnet: this.config.testnet,
          }),
          this.createTimeout(this.config.orderTimeoutMs),
        ]);

        if (response && typeof response === 'object' && 'success' in response) {
          if (response.success) {
            const data = response.data as { orderId?: string; executedQty?: number; avgPrice?: number };
            return {
              success: true,
              orderId: data?.orderId ?? order.id,
              executedPrice: data?.avgPrice ?? order.entryPrice,
              executedQuantity: data?.executedQty ?? order.quantity,
            };
          } else {
            lastError = (response as { error?: string }).error ?? 'Unknown exchange error';
          }
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Execution error';
      }

      if (attempt < this.config.maxRetries) {
        await this.delay(this.config.retryDelayMs * (attempt + 1));
        order.retryCount++;
      }
    }

    return {
      success: false,
      error: `Failed after ${this.config.maxRetries + 1} attempts: ${lastError}`,
    };
  }

  // ===== POSITION MANAGEMENT =====
  async closePosition(positionId: string, exitPrice: number): Promise<ExecutionResult> {
    const position = this.activePositions.get(positionId);
    if (!position) {
      return { success: false, error: 'Position not found' };
    }

    const pnl = position.direction === 'BUY'
      ? (exitPrice - position.entryPrice) * position.quantity
      : (position.entryPrice - exitPrice) * position.quantity;

    const pnlPercent = pnl / (position.entryPrice * position.quantity);

    // Update position
    position.exitPrice = exitPrice;
    position.closedAt = new Date();
    position.isOpen = false;
    position.pnl = pnl;
    position.pnlPercent = pnlPercent;

    // Update risk manager
    this.riskManager.recordTradeResult(position);
    this.riskManager.closePosition(this.config.symbol, pnl);

    // Remove from active
    this.activePositions.delete(positionId);

    this.emit('positionClosed', position);

    return {
      success: true,
      orderId: positionId,
      executedPrice: exitPrice,
    };
  }

  // ===== UTILITY METHODS =====
  private logSignal(
    signal: AggregatedSignal,
    candles: CandleData[],
    marketConditions: MarketConditions
  ): void {
    console.log('[SIGNAL]', {
      direction: signal.direction,
      confidence: `${(signal.confidence * 100).toFixed(1)}%`,
      score: signal.totalScore.toFixed(1),
      approved: signal.approved,
      price: marketConditions.currentPrice,
      votes: signal.votes.map(v => `${v.strategy}: ${v.signal ?? 'NEUTRAL'} (${v.weightedScore.toFixed(1)})`),
    });
  }

  private generateOrderHash(signal: AggregatedSignal, price: number): string {
    return `${signal.direction}-${Math.round(price)}-${Math.round(signal.totalScore)}`;
  }

  private isDuplicateOrder(hash: string): boolean {
    const existing = this.recentOrderHashes.get(hash);
    if (!existing) return false;

    const age = Date.now() - existing.getTime();
    if (age > this.config.duplicateWindowMs) {
      this.recentOrderHashes.delete(hash);
      return false;
    }

    return true;
  }

  private generateOrderId(): string {
    return `ORD-${Date.now()}-${++this.orderIdCounter}`;
  }

  private calculateStops(
    candles: CandleData[],
    entryPrice: number,
    direction: 'BUY' | 'SELL'
  ): { stopLoss: number; takeProfit: number } {
    // Use ATR-based stops (simplified)
    const recentCandles = candles.slice(-14);
    const avgRange = recentCandles.reduce((sum, c) => sum + (c.high - c.low), 0) / recentCandles.length;
    const atr = avgRange || entryPrice * 0.01;

    if (direction === 'BUY') {
      return {
        stopLoss: entryPrice - (atr * 1.5),
        takeProfit: entryPrice + (atr * 2.5),
      };
    } else {
      return {
        stopLoss: entryPrice + (atr * 1.5),
        takeProfit: entryPrice - (atr * 2.5),
      };
    }
  }

  private createTradeLog(order: PendingOrder, simOrder: SimulatedOrder): TradeLog {
    return {
      id: order.id,
      timestamp: new Date(),
      symbol: this.config.symbol,
      direction: order.signal.direction!,
      entryPrice: simOrder.executedPrice,
      entryQuantity: simOrder.executedQuantity,
      exitPrice: null,
      exitQuantity: null,
      closedAt: null,
      strategyScores: order.signal.votes.map(v => ({
        name: v.strategy,
        signal: v.signal,
        score: v.score,
        weight: v.weight,
        weightedScore: v.weightedScore,
      })),
      aggregatedScore: order.signal.totalScore,
      confidence: order.signal.confidence,
      riskState: {
        dailyPnLPercent: this.riskManager.getState().dailyPnLPercent,
        consecutiveLosses: this.riskManager.getState().consecutiveLosses,
        currentExposure: this.riskManager.getState().currentExposure,
        currentDrawdown: this.riskManager.getState().currentDrawdown,
        riskLevel: order.riskCheck.riskLevel,
      },
      marketConditions: {
        price: order.entryPrice,
        volume: 0,
        volatility: 0,
        spread: 0,
        trend: 'sideways',
      },
      pnl: 0,
      pnlPercent: 0,
      holdingTimeMinutes: 0,
      slippage: simOrder.slippagePct,
      commission: simOrder.commission,
      effectivePrice: simOrder.effectivePrice,
      status: 'open',
    };
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timeout')), ms)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===== EVENT SYSTEM =====
  on(event: string, callback: (data: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: unknown) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach(cb => {
      try {
        cb(data);
      } catch (e) {
        console.error(`Event listener error (${event}):`, e);
      }
    });
  }

  // ===== CONTROL METHODS =====
  setMode(mode: ExecutionMode): void {
    this.config.mode = mode;
    this.emit('modeChanged', mode);
  }

  activateKillSwitch(): void {
    this.riskManager.activateKillSwitch();
    this.emit('killSwitchActivated', null);
  }

  deactivateKillSwitch(): void {
    this.riskManager.deactivateKillSwitch();
    this.emit('killSwitchDeactivated', null);
  }

  pauseTrading(reason: string): void {
    this.riskManager.pauseTrading(reason);
    this.emit('tradingPaused', reason);
  }

  resumeTrading(): void {
    this.riskManager.resumeTrading();
    this.emit('tradingResumed', null);
  }

  // ===== GETTERS =====
  getStatus(): SystemStatus {
    const riskSummary = this.riskManager.getStatusSummary();
    
    return {
      executionStatus: this.status,
      connectionStatus: this.connectionStatus,
      mode: this.config.mode,
      lastSignalTime: this.lastSignalTime,
      lastTradeTime: this.lastTradeTime,
      pendingOrders: this.pendingOrders.size,
      activePositions: this.activePositions.size,
      riskStatus: {
        status: riskSummary.status,
        riskLevel: riskSummary.riskLevel,
      },
    };
  }

  getConfig(): ExecutionConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ExecutionConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getRiskManager(): RiskManager {
    return this.riskManager;
  }

  getAnalytics(): TradeAnalytics {
    return this.analytics;
  }

  getSimulator(): TradeSimulator {
    return this.simulator;
  }

  getActivePositions(): TradeResult[] {
    return Array.from(this.activePositions.values());
  }
}

// Export singleton
let engineInstance: ExecutionEngine | null = null;

export function getExecutionEngine(config?: ExecutionConfig, initialCapital?: number): ExecutionEngine {
  if (!engineInstance) {
    engineInstance = new ExecutionEngine(config, initialCapital);
  }
  return engineInstance;
}

export function resetExecutionEngine(config?: ExecutionConfig, initialCapital?: number): ExecutionEngine {
  engineInstance = new ExecutionEngine(config, initialCapital);
  return engineInstance;
}
