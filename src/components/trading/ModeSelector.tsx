// Mode Selector Component - HAYQ Project
// Switch between Signal Mode and Trade Mode

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Signal, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ModeSelectorProps {
  mode: 'signal' | 'trade';
  onModeChange: (mode: 'signal' | 'trade') => void;
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onModeChange('signal')}
            className={cn(
              "gap-2 px-3 transition-all",
              mode === 'signal' 
                ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Signal className="h-4 w-4" />
            <span className="hidden sm:inline">{t('header.signalMode')}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Generate signals only - no trade execution</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onModeChange('trade')}
            className={cn(
              "gap-2 px-3 transition-all",
              mode === 'trade' 
                ? "bg-brand/20 text-brand hover:bg-brand/30" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">{t('header.tradeMode')}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Fully automated trade execution</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
