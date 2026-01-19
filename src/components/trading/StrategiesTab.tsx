import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import type { Strategy } from '@/types/trading';

interface StrategiesTabProps {
  strategies: Strategy[];
  onToggle: (id: string) => void;
}

const riskColors = {
  low: 'text-profit',
  medium: 'text-yellow-500',
  high: 'text-loss',
};

export function StrategiesTab({ strategies, onToggle }: StrategiesTabProps) {
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
            {strategy.description}
          </p>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Performance</span>
              <span className="font-medium">{strategy.performance}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Risk Level</span>
              <span className={cn("font-medium capitalize", riskColors[strategy.risk])}>
                {strategy.risk}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Trades</span>
              <span className="font-medium">{strategy.tradesCount}</span>
            </div>
          </div>

          <Button variant="outline" className="w-full">
            Configure
          </Button>
        </div>
      ))}
    </div>
  );
}
