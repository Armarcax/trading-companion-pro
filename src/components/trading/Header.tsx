// Updated Header with Mode Selector & Status - HAYQ Project

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { MarketData } from '@/types/trading';
import { TrendingUp, TrendingDown, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeSelector } from './ModeSelector';
import { SystemStatus, SystemMode, SystemState, ConnectionState, RiskLevel } from './SystemStatus';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ThemeToggle';

interface HeaderProps {
  title: string;
  markets: MarketData[];
  isRunning: boolean;
  tradingMode: 'signal' | 'trade';
  onToggleBot: () => void;
  onModeChange: (mode: 'signal' | 'trade') => void;
  systemState?: SystemState;
  connectionStatus?: ConnectionState;
  riskLevel?: RiskLevel;
  dailyPnL?: number;
}

export function Header({ 
  title, 
  markets, 
  isRunning, 
  tradingMode,
  onToggleBot,
  onModeChange,
  systemState = 'active',
  connectionStatus = 'disconnected',
  riskLevel = 'low',
  dailyPnL,
}: HeaderProps) {
  const { t } = useTranslation();

  // Map trading mode to system mode
  const systemMode: SystemMode = tradingMode === 'trade' ? 'demo' : 'signal';

  return (
    <header className="px-6 py-4 border-b border-border flex justify-between items-center flex-wrap gap-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">{title}</h1>
        
        {/* System Status */}
        <SystemStatus
          mode={systemMode}
          state={isRunning ? systemState : 'paused'}
          connection={connectionStatus}
          riskLevel={riskLevel}
          dailyPnL={dailyPnL}
          className="hidden md:flex"
        />
      </div>
      
      <div className="flex items-center gap-4 flex-wrap">
        {/* Market Prices */}
        <div className="flex gap-3">
          {markets.slice(0, 2).map((market) => (
            <div 
              key={market.symbol}
              className="bg-card rounded-lg px-4 py-2 min-w-[120px] hidden lg:block"
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

        {/* Mode Selector */}
        <ModeSelector mode={tradingMode} onModeChange={onModeChange} />

        {/* Language & Theme */}
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
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
          {isRunning ? t('header.stopBot') : t('header.startBot')}
        </Button>
      </div>
    </header>
  );
}
