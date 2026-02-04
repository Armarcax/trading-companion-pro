// Signals Panel - HAYQ Project
// Displays active signals from strategy voting engine

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import type { AggregatedSignal } from '@/lib/strategies/types';

interface SignalsPanelProps {
  signal: AggregatedSignal | null;
}

export function SignalsPanel({ signal }: SignalsPanelProps) {
  const { t } = useTranslation();

  if (!signal) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-card animate-fade-in">
        <h3 className="text-lg font-semibold mb-4">{t('signals.title')}</h3>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <AlertCircle className="h-5 w-5 mr-2" />
          {t('signals.noSignals')}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-card animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{t('signals.title')}</h3>
        <div className={cn(
          "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
          signal.approved 
            ? "bg-profit/20 text-profit" 
            : "bg-loss/20 text-loss"
        )}>
          {signal.approved ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {signal.approved ? t('signals.approved') : t('signals.rejected')}
        </div>
      </div>

      {/* Signal Direction */}
      {signal.direction && (
        <div className={cn(
          "flex items-center gap-3 p-4 rounded-lg mb-4",
          signal.direction === 'BUY' 
            ? "bg-profit/10 border border-profit/30" 
            : "bg-loss/10 border border-loss/30"
        )}>
          {signal.direction === 'BUY' ? (
            <TrendingUp className="h-8 w-8 text-profit" />
          ) : (
            <TrendingDown className="h-8 w-8 text-loss" />
          )}
          <div>
            <div className={cn(
              "text-2xl font-bold",
              signal.direction === 'BUY' ? "text-profit" : "text-loss"
            )}>
              {signal.direction}
            </div>
            <div className="text-sm text-muted-foreground">
              {t('signals.confidence')}: {(signal.confidence * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Votes */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Strategy Votes</h4>
        {signal.votes.map((vote, index) => (
          <div 
            key={index}
            className="flex items-center justify-between py-2 px-3 bg-secondary/30 rounded-lg"
          >
            <span className="text-sm font-medium">{vote.strategy}</span>
            <div className="flex items-center gap-3">
              {vote.signal && (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded",
                  vote.signal === 'BUY' 
                    ? "bg-profit/20 text-profit" 
                    : "bg-loss/20 text-loss"
                )}>
                  {vote.signal}
                </span>
              )}
              <span className={cn(
                "text-sm font-medium",
                vote.score > 0 ? "text-profit" : vote.score < 0 ? "text-loss" : "text-muted-foreground"
              )}>
                {vote.weightedScore > 0 ? '+' : ''}{vote.weightedScore.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Reason */}
      {signal.reason && (
        <div className="mt-4 p-3 bg-secondary/20 rounded-lg">
          <span className="text-sm text-muted-foreground">{t('signals.reason')}: </span>
          <span className="text-sm">{signal.reason}</span>
        </div>
      )}
    </div>
  );
}
