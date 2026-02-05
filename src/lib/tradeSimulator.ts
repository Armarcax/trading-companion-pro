// Trade Simulation Layer - HAYQ Project
// Realistic trade execution simulation with commission, slippage, partial fills, latency

export interface SimulationConfig {
  // Fees
  makerFee: number;          // e.g., 0.001 = 0.1%
  takerFee: number;          // e.g., 0.001 = 0.1%
  
  // Slippage
  slippageEnabled: boolean;
  avgSlippagePct: number;    // Average slippage percentage
  maxSlippagePct: number;    // Maximum slippage (rejected if exceeded)
  volatilitySlippageMultiplier: number; // Extra slippage during high volatility
  
  // Partial fills
  partialFillsEnabled: boolean;
  avgFillRate: number;       // Average fill rate (0.8 = 80% filled on average)
  minFillRate: number;       // Minimum fill rate to accept
  
  // Latency
  latencyEnabled: boolean;
  avgLatencyMs: number;      // Average execution latency
  maxLatencyMs: number;      // Maximum latency
  latencyVarianceMs: number; // Variance in latency
  
  // Market impact
  marketImpactEnabled: boolean;
  impactThresholdUsd: number; // Order size above which market impact applies
  impactMultiplier: number;   // Impact per $100k of order size
}

export interface SimulatedOrder {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  requestedQuantity: number;
  requestedPrice: number;
  
  // Simulation results
  executedQuantity: number;
  executedPrice: number;
  fillRate: number;
  slippagePct: number;
  commission: number;
  latencyMs: number;
  marketImpact: number;
  
  // Totals
  totalCost: number;        // Including fees
  effectivePrice: number;   // Price after all costs
  
  // Status
  status: 'filled' | 'partial' | 'rejected' | 'pending';
  rejectionReason?: string;
  
  // Timestamps
  createdAt: Date;
  executedAt: Date;
}

export interface MarketSnapshot {
  bid: number;
  ask: number;
  lastPrice: number;
  volume24h: number;
  volatility: number; // ATR-based or std dev
  depth: OrderBookDepth[];
}

export interface OrderBookDepth {
  price: number;
  quantity: number;
  side: 'bid' | 'ask';
}

export const defaultSimulationConfig: SimulationConfig = {
  // Fees (Binance-like)
  makerFee: 0.001,
  takerFee: 0.001,
  
  // Slippage
  slippageEnabled: true,
  avgSlippagePct: 0.0005,      // 0.05%
  maxSlippagePct: 0.005,       // 0.5%
  volatilitySlippageMultiplier: 2.0,
  
  // Partial fills
  partialFillsEnabled: true,
  avgFillRate: 0.95,
  minFillRate: 0.5,
  
  // Latency
  latencyEnabled: true,
  avgLatencyMs: 50,
  maxLatencyMs: 500,
  latencyVarianceMs: 30,
  
  // Market impact
  marketImpactEnabled: true,
  impactThresholdUsd: 10000,
  impactMultiplier: 0.0001,    // 0.01% per $100k
};

export class TradeSimulator {
  private config: SimulationConfig;
  private orderHistory: SimulatedOrder[] = [];
  private nextOrderId = 1;

  constructor(config: SimulationConfig = defaultSimulationConfig) {
    this.config = config;
  }

  // ===== MAIN SIMULATION =====
  async simulateOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: number,
    requestedPrice: number,
    market: MarketSnapshot
  ): Promise<SimulatedOrder> {
    const order: SimulatedOrder = {
      id: `SIM-${Date.now()}-${this.nextOrderId++}`,
      symbol,
      side,
      requestedQuantity: quantity,
      requestedPrice,
      executedQuantity: 0,
      executedPrice: 0,
      fillRate: 0,
      slippagePct: 0,
      commission: 0,
      latencyMs: 0,
      marketImpact: 0,
      totalCost: 0,
      effectivePrice: 0,
      status: 'pending',
      createdAt: new Date(),
      executedAt: new Date(),
    };

    // 1️⃣ Simulate latency
    if (this.config.latencyEnabled) {
      order.latencyMs = this.simulateLatency();
      await this.delay(Math.min(order.latencyMs, 100)); // Cap actual delay for UX
    }

    // 2️⃣ Calculate market impact
    const orderValueUsd = quantity * requestedPrice;
    if (this.config.marketImpactEnabled && orderValueUsd > this.config.impactThresholdUsd) {
      order.marketImpact = this.calculateMarketImpact(orderValueUsd);
    }

    // 3️⃣ Calculate slippage
    if (this.config.slippageEnabled) {
      order.slippagePct = this.calculateSlippage(market.volatility, side, market);
      
      if (order.slippagePct > this.config.maxSlippagePct) {
        order.status = 'rejected';
        order.rejectionReason = `Slippage too high: ${(order.slippagePct * 100).toFixed(3)}%`;
        this.orderHistory.push(order);
        return order;
      }
    }

    // 4️⃣ Calculate execution price
    let basePrice = side === 'BUY' ? market.ask : market.bid;
    const slippageAmount = basePrice * order.slippagePct;
    const impactAmount = basePrice * order.marketImpact;
    
    order.executedPrice = side === 'BUY'
      ? basePrice + slippageAmount + impactAmount
      : basePrice - slippageAmount - impactAmount;

    // 5️⃣ Calculate fill rate
    if (this.config.partialFillsEnabled) {
      order.fillRate = this.calculateFillRate(quantity, market);
      order.executedQuantity = quantity * order.fillRate;
      
      if (order.fillRate < this.config.minFillRate) {
        order.status = 'rejected';
        order.rejectionReason = `Fill rate too low: ${(order.fillRate * 100).toFixed(1)}%`;
        this.orderHistory.push(order);
        return order;
      }
      
      order.status = order.fillRate < 1.0 ? 'partial' : 'filled';
    } else {
      order.fillRate = 1.0;
      order.executedQuantity = quantity;
      order.status = 'filled';
    }

    // 6️⃣ Calculate commission
    const isMaker = Math.random() > 0.7; // 30% chance of maker
    const feeRate = isMaker ? this.config.makerFee : this.config.takerFee;
    order.commission = order.executedQuantity * order.executedPrice * feeRate;

    // 7️⃣ Calculate totals
    order.totalCost = (order.executedQuantity * order.executedPrice) + order.commission;
    order.effectivePrice = order.totalCost / order.executedQuantity;
    order.executedAt = new Date();

    this.orderHistory.push(order);
    return order;
  }

  // ===== SIMULATION HELPERS =====
  private simulateLatency(): number {
    const base = this.config.avgLatencyMs;
    const variance = this.config.latencyVarianceMs;
    const random = (Math.random() - 0.5) * 2 * variance;
    return Math.min(Math.max(0, base + random), this.config.maxLatencyMs);
  }

  private calculateSlippage(volatility: number, side: 'BUY' | 'SELL', market: MarketSnapshot): number {
    // Base slippage
    let slippage = this.config.avgSlippagePct;
    
    // Volatility adjustment
    const avgVolatility = 0.02; // 2% daily volatility baseline
    if (volatility > avgVolatility) {
      slippage *= 1 + (volatility / avgVolatility - 1) * this.config.volatilitySlippageMultiplier;
    }
    
    // Spread-based adjustment
    const spreadPct = (market.ask - market.bid) / market.lastPrice;
    slippage += spreadPct * 0.5; // Half spread as additional slippage
    
    // Random variance (±50%)
    slippage *= 0.5 + Math.random();
    
    return Math.min(slippage, this.config.maxSlippagePct);
  }

  private calculateMarketImpact(orderValueUsd: number): number {
    const excessValue = orderValueUsd - this.config.impactThresholdUsd;
    const impact = (excessValue / 100000) * this.config.impactMultiplier;
    return Math.min(impact, 0.01); // Cap at 1%
  }

  private calculateFillRate(quantity: number, market: MarketSnapshot): number {
    // Base fill rate
    let fillRate = this.config.avgFillRate;
    
    // Adjust based on volume
    const orderValueRatio = quantity * market.lastPrice / market.volume24h;
    if (orderValueRatio > 0.001) { // Order is >0.1% of 24h volume
      fillRate *= Math.max(0.5, 1 - orderValueRatio * 10);
    }
    
    // Random variance
    fillRate *= 0.9 + Math.random() * 0.2;
    
    return Math.min(1.0, Math.max(this.config.minFillRate, fillRate));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===== ANALYSIS =====
  getAverageSlippage(): number {
    const filled = this.orderHistory.filter(o => o.status !== 'rejected');
    if (filled.length === 0) return 0;
    return filled.reduce((sum, o) => sum + o.slippagePct, 0) / filled.length;
  }

  getAverageFillRate(): number {
    const filled = this.orderHistory.filter(o => o.status !== 'rejected');
    if (filled.length === 0) return 1;
    return filled.reduce((sum, o) => sum + o.fillRate, 0) / filled.length;
  }

  getTotalCommissions(): number {
    return this.orderHistory.reduce((sum, o) => sum + o.commission, 0);
  }

  getTotalMarketImpact(): number {
    return this.orderHistory
      .filter(o => o.status !== 'rejected')
      .reduce((sum, o) => sum + (o.marketImpact * o.executedQuantity * o.executedPrice), 0);
  }

  getOrderHistory(): SimulatedOrder[] {
    return [...this.orderHistory];
  }

  getSimulationStats(): {
    totalOrders: number;
    filledOrders: number;
    partialFills: number;
    rejectedOrders: number;
    avgSlippage: number;
    avgFillRate: number;
    totalCommissions: number;
    avgLatency: number;
  } {
    const filled = this.orderHistory.filter(o => o.status === 'filled');
    const partial = this.orderHistory.filter(o => o.status === 'partial');
    const rejected = this.orderHistory.filter(o => o.status === 'rejected');
    
    return {
      totalOrders: this.orderHistory.length,
      filledOrders: filled.length,
      partialFills: partial.length,
      rejectedOrders: rejected.length,
      avgSlippage: this.getAverageSlippage(),
      avgFillRate: this.getAverageFillRate(),
      totalCommissions: this.getTotalCommissions(),
      avgLatency: this.orderHistory.length > 0
        ? this.orderHistory.reduce((sum, o) => sum + o.latencyMs, 0) / this.orderHistory.length
        : 0,
    };
  }

  // ===== CONFIG =====
  updateConfig(updates: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getConfig(): SimulationConfig {
    return { ...this.config };
  }

  clearHistory(): void {
    this.orderHistory = [];
  }
}

// Export singleton
let simulatorInstance: TradeSimulator | null = null;

export function getTradeSimulator(config?: SimulationConfig): TradeSimulator {
  if (!simulatorInstance) {
    simulatorInstance = new TradeSimulator(config);
  }
  return simulatorInstance;
}

export function resetTradeSimulator(config?: SimulationConfig): TradeSimulator {
  simulatorInstance = new TradeSimulator(config);
  return simulatorInstance;
}
