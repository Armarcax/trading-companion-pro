import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Play, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketData } from '@/types/trading';
import type { FeedSource } from '@/lib/websocketFeed';

interface Props {
  title: string; markets: MarketData[]; isRunning: boolean;
  tradingMode: 'signal' | 'trade'; feedSource: FeedSource;
  onToggleBot: () => void; onModeChange: (m: 'signal' | 'trade') => void;
  onFeedChange: (f: FeedSource) => void;
}

const FEEDS: { label: string; value: FeedSource }[] = [
  { label: 'Mock', value: 'mock' },
  { label: 'Binance', value: 'binance' },
  { label: 'Bybit', value: 'bybit' },
];

export function Header({ title, markets, isRunning, tradingMode, feedSource, onToggleBot, onModeChange, onFeedChange }: Props) {
  const { t } = useTranslation();
  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur px-4 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-4 min-w-0">
        <h1 className="text-base font-semibold truncate hidden sm:block">{title}</h1>
        <div className="hidden lg:flex items-center gap-3">
          {markets.slice(0, 3).map(m => (
            <div key={m.symbol} className="text-xs">
              <span className="text-muted-foreground">{m.symbol.replace('USDT', '')}</span>
              <span className="ml-1 font-mono tabular-nums">
                ${m.price.toLocaleString(undefined, { maximumFractionDigits: m.price > 10 ? 2 : 4 })}
              </span>
              <span className={cn('ml-1', m.changePercent >= 0 ? 'text-green-500' : 'text-red-500')}>
                {m.changePercent >= 0 ? '▲' : '▼'}{Math.abs(m.changePercent).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        {/* Feed selector */}
        <div className="hidden sm:flex items-center text-xs border rounded overflow-hidden">
          {FEEDS.map(f => (
            <button key={f.value} onClick={() => onFeedChange(f.value)}
              className={cn('px-2 py-1 transition-colors', feedSource === f.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Signal/Trade toggle */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className={cn(tradingMode === 'signal' ? 'text-foreground' : 'text-muted-foreground')}>Ազդ.</span>
          <Switch checked={tradingMode === 'trade'} onCheckedChange={c => onModeChange(c ? 'trade' : 'signal')}
            className="data-[state=checked]:bg-orange-500 scale-75" />
          <span className={cn(tradingMode === 'trade' ? 'text-orange-500 font-medium' : 'text-muted-foreground')}>Թրեյդ</span>
        </div>

        <Button size="sm" variant={isRunning ? 'destructive' : 'default'} onClick={onToggleBot} className="h-8 gap-1.5">
          {isRunning ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          <span className="hidden sm:inline">{isRunning ? t('bot.stop') : t('bot.start')}</span>
        </Button>

        {isRunning && <Badge variant="outline" className="text-green-500 border-green-500/50 text-xs animate-pulse hidden sm:flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />LIVE
        </Badge>}

        <LanguageSelector />
        <ThemeToggle />
      </div>
    </header>
  );
}
