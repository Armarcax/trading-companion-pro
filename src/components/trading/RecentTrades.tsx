import { cn } from '@/lib/utils';
import type { Trade } from '@/types/trading';

interface RecentTradesProps {
  trades: Trade[];
}

export function RecentTrades({ trades }: RecentTradesProps) {
  const recentTrades = trades.slice(0, 5);

  return (
    <div className="bg-card rounded-xl p-5 shadow-card animate-fade-in">
      <h3 className="font-semibold mb-4">Recent Trades</h3>
      
      <div className="space-y-3">
        {recentTrades.map((trade) => (
          <div
            key={trade.id}
            className="flex justify-between items-center py-2 border-b border-border last:border-0"
          >
            <div>
              <div className="font-medium text-sm">{trade.pair}</div>
              <div className="text-xs text-muted-foreground">
                {trade.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
            <div className={cn(
              "font-semibold text-sm",
              trade.profit >= 0 ? "text-profit" : "text-loss"
            )}>
              {trade.profit >= 0 ? '+' : ''}
              ${Math.abs(trade.profit).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
