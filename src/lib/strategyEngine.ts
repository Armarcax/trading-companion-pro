// Strategy Voting Engine - HAYQ Project

import type { 
  BaseStrategy, 
  MarketState, 
  StrategySignal, 
  StrategyVote, 
  AggregatedSignal 
} from './strategies/types';

import { candleForceStrategy } from './strategies/candleForce';
import { confirmationsStrategy } from './strategies/confirmations';
import { marketStructureStrategy } from './strategies/marketStructure';
import { rsiFilterStrategy } from './strategies/rsiFilter';
import { srLevelsStrategy } from './strategies/srLevels';
import { trendTFStrategy } from './strategies/trendTF';
import { volatilityStrategy } from './strategies/volatility';
import { volumeConfirmStrategy } from './strategies/volumeConfirm';

// Strategy weights (can be adjusted)
const STRATEGY_WEIGHTS: Record<string, number> = {
  TrendTF: 3.0,
  MarketStructure: 2.5,
  CandleForce: 2.0,
  SR: 2.0,
  RSI: 1.5,
  Confirmations: 1.5,
  Volume: 1.0,
  Volatility: 1.0
};

// Minimum score threshold for signal generation
const MIN_CONFIDENCE_THRESHOLD = 0.4;
const MIN_TOTAL_SCORE = 4;

export interface StrategyConfig {
  id: string;
  name: string;
  enabled: boolean;
  weight: number;
}

export const defaultStrategies: StrategyConfig[] = [
  { id: 'trendTF', name: 'Multi-TF Trend', enabled: true, weight: 3.0 },
  { id: 'marketStructure', name: 'Market Structure', enabled: true, weight: 2.5 },
  { id: 'candleForce', name: 'Candle Force', enabled: true, weight: 2.0 },
  { id: 'sr', name: 'Support/Resistance', enabled: true, weight: 2.0 },
  { id: 'rsi', name: 'RSI Filter', enabled: true, weight: 1.5 },
  { id: 'confirmations', name: 'Confirmations', enabled: true, weight: 1.5 },
  { id: 'volume', name: 'Volume Confirm', enabled: true, weight: 1.0 },
  { id: 'volatility', name: 'Volatility', enabled: true, weight: 1.0 }
];

const strategyMap: Record<string, BaseStrategy> = {
  trendTF: trendTFStrategy,
  marketStructure: marketStructureStrategy,
  candleForce: candleForceStrategy,
  sr: srLevelsStrategy,
  rsi: rsiFilterStrategy,
  confirmations: confirmationsStrategy,
  volume: volumeConfirmStrategy,
  volatility: volatilityStrategy
};

export function evaluateStrategies(
  state: MarketState,
  enabledStrategies: StrategyConfig[]
): StrategySignal[] {
  const signals: StrategySignal[] = [];
  
  for (const config of enabledStrategies) {
    if (!config.enabled) continue;
    
    const strategy = strategyMap[config.id];
    if (!strategy) continue;
    
    try {
      const signal = strategy.evaluate(state);
      signals.push(signal);
    } catch (error) {
      console.error(`Strategy ${config.name} error:`, error);
      signals.push({ name: config.name, signal: null, score: 0 });
    }
  }
  
  return signals;
}

export function aggregateSignals(
  signals: StrategySignal[],
  strategyConfigs: StrategyConfig[]
): AggregatedSignal {
  const votes: StrategyVote[] = [];
  let buyScore = 0;
  let sellScore = 0;
  let totalWeight = 0;
  
  for (const signal of signals) {
    const config = strategyConfigs.find(c => c.name === signal.name || 
      strategyMap[c.id]?.name === signal.name);
    const weight = config?.weight ?? STRATEGY_WEIGHTS[signal.name] ?? 1;
    
    const weightedScore = signal.score * weight;
    
    votes.push({
      strategy: signal.name,
      signal: signal.signal,
      score: signal.score,
      weight,
      weightedScore
    });
    
    if (signal.signal === 'BUY') {
      buyScore += weightedScore;
    } else if (signal.signal === 'SELL') {
      sellScore += weightedScore;
    }
    
    if (signal.signal) {
      totalWeight += weight;
    }
  }
  
  // Determine direction
  let direction: 'BUY' | 'SELL' | null = null;
  let totalScore = 0;
  
  if (buyScore > sellScore && buyScore >= MIN_TOTAL_SCORE) {
    direction = 'BUY';
    totalScore = buyScore;
  } else if (sellScore > buyScore && sellScore >= MIN_TOTAL_SCORE) {
    direction = 'SELL';
    totalScore = sellScore;
  }
  
  // Calculate confidence
  const maxPossibleScore = strategyConfigs
    .filter(c => c.enabled)
    .reduce((sum, c) => sum + c.weight * 4, 0); // Max score per strategy is 4
  
  const confidence = maxPossibleScore > 0 
    ? Math.min(totalScore / (maxPossibleScore * 0.5), 1) 
    : 0;
  
  // Final approval check
  const approved = direction !== null && 
    confidence >= MIN_CONFIDENCE_THRESHOLD &&
    totalScore >= MIN_TOTAL_SCORE;
  
  return {
    direction,
    confidence,
    totalScore,
    votes,
    timestamp: new Date(),
    approved,
    reason: approved 
      ? `Signal approved: ${direction} with ${(confidence * 100).toFixed(1)}% confidence`
      : `Signal rejected: Insufficient score (${totalScore.toFixed(1)}) or confidence (${(confidence * 100).toFixed(1)}%)`
  };
}

export function generateSignal(
  state: MarketState,
  strategyConfigs: StrategyConfig[]
): AggregatedSignal {
  const enabledStrategies = strategyConfigs.filter(s => s.enabled);
  const signals = evaluateStrategies(state, enabledStrategies);
  return aggregateSignals(signals, strategyConfigs);
}
