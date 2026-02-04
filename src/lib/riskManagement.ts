// Risk Management Engine - HAYQ Project

import type { RiskConfig as RiskConfigType, AggregatedSignal, CandleData } from './strategies/types';
import { calculateATR } from './strategies/technicalIndicators';

export type RiskConfig = RiskConfigType;

export interface RiskState {
  consecutiveLosses: number;
  lastTradeTime: Date | null;
  currentExposure: number;
  totalCapital: number;
  dailyPnL: number;
  tradesCount: number;
}

export interface RiskCheckResult {
  approved: boolean;
  reason?: string;
  positionSize?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export const defaultRiskConfig: RiskConfig = {
  maxRiskPerTrade: 0.02,      // 2% max risk per trade
  maxExposure: 0.20,          // 20% max total exposure
  maxConsecutiveLosses: 3,    // Stop after 3 consecutive losses
  cooldownMinutes: 5,         // 5 minute cooldown between trades
  adaptiveSL: true,
  adaptiveTP: true,
  slMultiplier: 1.5,          // SL = 1.5 * ATR
  tpMultiplier: 2.5,          // TP = 2.5 * ATR
};

export function calculatePositionSize(
  capital: number,
  riskPerTrade: number,
  entryPrice: number,
  stopLossPrice: number
): number {
  const riskAmount = capital * riskPerTrade;
  const riskPerUnit = Math.abs(entryPrice - stopLossPrice);
  
  if (riskPerUnit === 0) return 0;
  
  return riskAmount / riskPerUnit;
}

export function calculateAdaptiveStops(
  candles: CandleData[],
  entryPrice: number,
  direction: 'BUY' | 'SELL',
  slMultiplier: number,
  tpMultiplier: number
): { stopLoss: number; takeProfit: number } {
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const closes = candles.map(c => c.close);
  
  const atr = calculateATR(highs, lows, closes, 14) || entryPrice * 0.01;
  
  if (direction === 'BUY') {
    return {
      stopLoss: entryPrice - (atr * slMultiplier),
      takeProfit: entryPrice + (atr * tpMultiplier)
    };
  } else {
    return {
      stopLoss: entryPrice + (atr * slMultiplier),
      takeProfit: entryPrice - (atr * tpMultiplier)
    };
  }
}

export function checkRiskRules(
  signal: AggregatedSignal,
  riskState: RiskState,
  riskConfig: RiskConfig,
  candles: CandleData[],
  entryPrice: number
): RiskCheckResult {
  // 1️⃣ Check consecutive losses
  if (riskState.consecutiveLosses >= riskConfig.maxConsecutiveLosses) {
    return {
      approved: false,
      reason: `Consecutive loss limit reached (${riskConfig.maxConsecutiveLosses}). Trading paused.`
    };
  }
  
  // 2️⃣ Check cooldown
  if (riskState.lastTradeTime) {
    const cooldownMs = riskConfig.cooldownMinutes * 60 * 1000;
    const timeSinceLastTrade = Date.now() - riskState.lastTradeTime.getTime();
    
    if (timeSinceLastTrade < cooldownMs) {
      const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastTrade) / 1000);
      return {
        approved: false,
        reason: `Cooldown active. Wait ${remainingSeconds}s`
      };
    }
  }
  
  // 3️⃣ Check exposure limit
  if (riskState.currentExposure >= riskConfig.maxExposure) {
    return {
      approved: false,
      reason: `Max exposure limit reached (${riskConfig.maxExposure * 100}%)`
    };
  }
  
  // 4️⃣ Check signal confidence
  if (!signal.approved || signal.confidence < 0.5) {
    return {
      approved: false,
      reason: `Signal confidence too low (${(signal.confidence * 100).toFixed(1)}%)`
    };
  }
  
  // 5️⃣ Calculate position size and stops
  const direction = signal.direction;
  if (!direction) {
    return { approved: false, reason: 'No direction in signal' };
  }
  
  const { stopLoss, takeProfit } = riskConfig.adaptiveSL 
    ? calculateAdaptiveStops(candles, entryPrice, direction, riskConfig.slMultiplier, riskConfig.tpMultiplier)
    : {
        stopLoss: direction === 'BUY' 
          ? entryPrice * (1 - 0.01) 
          : entryPrice * (1 + 0.01),
        takeProfit: direction === 'BUY'
          ? entryPrice * (1 + 0.02)
          : entryPrice * (1 - 0.02)
      };
  
  const positionSize = calculatePositionSize(
    riskState.totalCapital,
    riskConfig.maxRiskPerTrade,
    entryPrice,
    stopLoss
  );
  
  return {
    approved: true,
    positionSize,
    stopLoss,
    takeProfit
  };
}

export function updateRiskStateAfterTrade(
  state: RiskState,
  isWin: boolean,
  pnl: number
): RiskState {
  return {
    ...state,
    consecutiveLosses: isWin ? 0 : state.consecutiveLosses + 1,
    lastTradeTime: new Date(),
    dailyPnL: state.dailyPnL + pnl,
    tradesCount: state.tradesCount + 1
  };
}
