// Updated Strategies Tab - HAYQ Project

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { StrategyConfig } from '@/lib/strategyEngine';

interface StrategiesTabProps {
  strategies: StrategyConfig[];
  onToggle: (id: string) => void;
  onWeightChange: (id: string, weight: number) => void;
}

const strategyDescriptions: Record<string, string> = {
  trendTF: 'Multi-timeframe EMA trend confirmation (5m + 15m)',
  marketStructure: 'Swing high/low breakout detection',
  candleForce: 'Strong candle body + volume analysis',
  sr: 'Support/Resistance bounce detection',
  rsi: 'RSI pullback and momentum filter',
  confirmations: 'Multi-factor confirmation layer',
  volume: 'Volume spike detection',
  volatility: 'ATR-based volatility regime detection'
};

export function StrategiesTab({ strategies, onToggle, onWeightChange }: StrategiesTabProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {strategies.map((strategy) => (
        <div
          key={strategy.id}
          className="bg-card rounded-xl p-6 shadow-card animate-fade-in"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{strategy.name}</h3>
            <Switch
              checked={strategy.enabled}
              onCheckedChange={() => onToggle(strategy.id)}
            />
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            {strategyDescriptions[strategy.id] || strategy.name}
          </p>

          <div className="space-y-3 mb-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t('strategies.weight')}</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="5"
                value={strategy.weight}
                onChange={(e) => onWeightChange(strategy.id, parseFloat(e.target.value) || 1)}
                className="h-8"
              />
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('strategies.riskLevel')}</span>
              <span className={cn(
                "font-medium capitalize",
                strategy.weight >= 2.5 ? "text-profit" : 
                strategy.weight >= 1.5 ? "text-warning" : "text-loss"
              )}>
                {strategy.weight >= 2.5 ? t('strategies.high') : 
                 strategy.weight >= 1.5 ? t('strategies.medium') : t('strategies.low')}
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full">
            {t('strategies.configure')}
          </Button>
        </div>
      ))}
    </div>
  );
}
