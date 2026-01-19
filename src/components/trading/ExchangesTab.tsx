import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Circle, Loader2 } from 'lucide-react';
import type { Exchange } from '@/types/trading';

interface ExchangesTabProps {
  exchanges: Exchange[];
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
}

export function ExchangesTab({ exchanges, onConnect, onDisconnect }: ExchangesTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {exchanges.map((exchange) => (
        <div
          key={exchange.id}
          className="bg-card rounded-xl p-6 shadow-card animate-fade-in"
        >
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold",
              exchange.connected 
                ? "gradient-brand shadow-glow" 
                : "bg-secondary"
            )}>
              {exchange.logo}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">{exchange.name}</h3>
                <div className="flex items-center gap-1.5">
                  <Circle
                    className={cn(
                      "h-2 w-2 fill-current",
                      exchange.status === 'online' && "text-profit",
                      exchange.status === 'connecting' && "text-yellow-500 animate-pulse",
                      exchange.status === 'offline' && "text-muted-foreground"
                    )}
                  />
                  <span className="text-xs text-muted-foreground capitalize">
                    {exchange.status}
                  </span>
                </div>
              </div>

              {exchange.connected && exchange.balance !== undefined && (
                <p className="text-sm text-muted-foreground mb-3">
                  Balance: <span className="text-foreground font-medium">
                    ${exchange.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </p>
              )}

              <div className="flex gap-2">
                {!exchange.connected ? (
                  <Button
                    onClick={() => onConnect(exchange.id)}
                    disabled={exchange.status === 'connecting'}
                    className="gradient-brand border-0 shadow-glow"
                  >
                    {exchange.status === 'connecting' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect'
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => onDisconnect(exchange.id)}
                  >
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
