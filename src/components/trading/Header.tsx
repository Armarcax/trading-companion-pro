import { cn } from '@/lib/utils';
import type { MarketData } from '@/types/trading';
import { TrendingUp, TrendingDown, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  markets: MarketData[];
  isRunning: boolean;
  onToggleBot: () => void;
}

export function Header({ title, markets, isRunning, onToggleBot }: HeaderProps) {
  return (
    <header className="px-6 py-4 border-b border-border flex justify-between items-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      
      <div className="flex items-center gap-4">
        {/* Market Prices */}
        <div className="flex gap-3">
          {markets.map((market) => (
            <div 
              key={market.symbol}
              className="bg-card rounded-lg px-4 py-2 min-w-[120px]"
            >
              <div className="text-xs text-muted-foreground mb-0.5">
                {market.symbol}
              </div>
              <div className={cn(
                "font-semibold flex items-center gap-1",
                market.change >= 0 ? "text-profit" : "text-loss"
              )}>
                {market.change >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                ${market.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>

        {/* Bot Toggle */}
        <Button
          onClick={onToggleBot}
          variant={isRunning ? "destructive" : "default"}
          className={cn(
            "gap-2",
            !isRunning && "gradient-brand border-0 shadow-glow"
          )}
        >
          <Power className="h-4 w-4" />
          {isRunning ? 'Stop Bot' : 'Start Bot'}
        </Button>
      </div>
    </header>
  );
}
