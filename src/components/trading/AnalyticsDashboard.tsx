// Analytics Dashboard Component - HAYQ Project

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertTriangle,
  BarChart3,
  Timer,
  Percent,
} from 'lucide-react';
import type { PerformanceMetrics } from '@/lib/analytics';

interface AnalyticsDashboardProps {
  metrics: PerformanceMetrics;
  className?: string;
}

export function AnalyticsDashboard({ metrics, className }: AnalyticsDashboardProps) {
  const { t } = useTranslation();

  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatNumber = (value: number, decimals = 2) => value.toFixed(decimals);
  const formatCurrency = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Primary Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Win Rate */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t('analytics.winRate')}</span>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{formatPercent(metrics.winRate)}</div>
            <Progress 
              value={metrics.winRate * 100} 
              className="h-1.5 mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{metrics.winningTrades} wins</span>
              <span>{metrics.losingTrades} losses</span>
            </div>
          </CardContent>
        </Card>

        {/* Total P&L */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t('analytics.totalPnL')}</span>
              {metrics.totalPnL >= 0 ? (
                <TrendingUp className="h-4 w-4 text-profit" />
              ) : (
                <TrendingDown className="h-4 w-4 text-loss" />
              )}
            </div>
            <div className={cn(
              "text-2xl font-bold",
              metrics.totalPnL >= 0 ? "text-profit" : "text-loss"
            )}>
              {formatCurrency(metrics.totalPnL)}
            </div>
            <div className={cn(
              "text-sm",
              metrics.totalPnLPercent >= 0 ? "text-profit" : "text-loss"
            )}>
              {metrics.totalPnLPercent >= 0 ? '+' : ''}{formatPercent(metrics.totalPnLPercent)}
            </div>
          </CardContent>
        </Card>

        {/* Profit Factor */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t('analytics.profitFactor')}</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className={cn(
              "text-2xl font-bold",
              metrics.profitFactor >= 1.5 ? "text-profit" : 
              metrics.profitFactor >= 1 ? "text-warning" : "text-loss"
            )}>
              {metrics.profitFactor === Infinity ? '∞' : formatNumber(metrics.profitFactor)}
            </div>
            <div className="text-xs text-muted-foreground">
              {metrics.profitFactor >= 2 ? '🟢 Excellent' :
               metrics.profitFactor >= 1.5 ? '🟡 Good' :
               metrics.profitFactor >= 1 ? '🟠 Break-even' : '🔴 Losing'}
            </div>
          </CardContent>
        </Card>

        {/* Expectancy */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t('analytics.expectancy')}</span>
              <Award className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className={cn(
              "text-2xl font-bold",
              metrics.expectancy >= 0 ? "text-profit" : "text-loss"
            )}>
              {formatCurrency(metrics.expectancy)}
            </div>
            <div className="text-xs text-muted-foreground">
              Per trade expected value
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Max Drawdown */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t('analytics.maxDrawdown')}</span>
              <AlertTriangle className={cn(
                "h-4 w-4",
                metrics.maxDrawdown > 0.2 ? "text-loss" :
                metrics.maxDrawdown > 0.1 ? "text-warning" : "text-muted-foreground"
              )} />
            </div>
            <div className={cn(
              "text-2xl font-bold",
              metrics.maxDrawdown > 0.2 ? "text-loss" :
              metrics.maxDrawdown > 0.1 ? "text-warning" : "text-foreground"
            )}>
              {formatPercent(metrics.maxDrawdown)}
            </div>
            <Progress 
              value={metrics.maxDrawdown * 100} 
              className="h-1.5 mt-2 [&>div]:bg-loss"
            />
          </CardContent>
        </Card>

        {/* Current Drawdown */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t('analytics.currentDrawdown')}</span>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className={cn(
              "text-2xl font-bold",
              metrics.currentDrawdown > 0.1 ? "text-loss" :
              metrics.currentDrawdown > 0.05 ? "text-warning" : "text-foreground"
            )}>
              {formatPercent(metrics.currentDrawdown)}
            </div>
            <Progress 
              value={metrics.currentDrawdown * 100} 
              className="h-1.5 mt-2 [&>div]:bg-warning"
            />
          </CardContent>
        </Card>

        {/* Sharpe Ratio */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t('analytics.sharpeRatio')}</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className={cn(
              "text-2xl font-bold",
              metrics.sharpeRatio >= 2 ? "text-profit" :
              metrics.sharpeRatio >= 1 ? "text-warning" : "text-loss"
            )}>
              {formatNumber(metrics.sharpeRatio)}
            </div>
            <div className="text-xs text-muted-foreground">
              {metrics.sharpeRatio >= 3 ? '🟢 Exceptional' :
               metrics.sharpeRatio >= 2 ? '🟢 Excellent' :
               metrics.sharpeRatio >= 1 ? '🟡 Acceptable' : '🔴 Poor'}
            </div>
          </CardContent>
        </Card>

        {/* Sortino Ratio */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t('analytics.sortinoRatio')}</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className={cn(
              "text-2xl font-bold",
              metrics.sortinoRatio >= 2 ? "text-profit" :
              metrics.sortinoRatio >= 1 ? "text-warning" : "text-loss"
            )}>
              {formatNumber(metrics.sortinoRatio)}
            </div>
            <div className="text-xs text-muted-foreground">
              Downside risk adjusted
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streaks & Time Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Win Streak */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t('analytics.maxWinStreak')}</span>
              <TrendingUp className="h-4 w-4 text-profit" />
            </div>
            <div className="text-2xl font-bold text-profit">
              {metrics.maxConsecutiveWins}
            </div>
            <div className="text-xs text-muted-foreground">
              Current: {metrics.currentStreakType === 'win' ? metrics.currentStreak : 0}
            </div>
          </CardContent>
        </Card>

        {/* Loss Streak */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t('analytics.maxLossStreak')}</span>
              <TrendingDown className="h-4 w-4 text-loss" />
            </div>
            <div className="text-2xl font-bold text-loss">
              {metrics.maxConsecutiveLosses}
            </div>
            <div className="text-xs text-muted-foreground">
              Current: {metrics.currentStreakType === 'loss' ? metrics.currentStreak : 0}
            </div>
          </CardContent>
        </Card>

        {/* Avg Holding Time */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t('analytics.avgHoldingTime')}</span>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {metrics.avgHoldingTime < 60 
                ? `${Math.round(metrics.avgHoldingTime)}m`
                : `${(metrics.avgHoldingTime / 60).toFixed(1)}h`
              }
            </div>
            <div className="text-xs text-muted-foreground">
              Average per trade
            </div>
          </CardContent>
        </Card>

        {/* Trades Per Day */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t('analytics.tradesPerDay')}</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {formatNumber(metrics.tradesPerDay, 1)}
            </div>
            <div className="text-xs text-muted-foreground">
              Total: {metrics.totalTrades} trades
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Avg Win/Loss */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{t('analytics.winLossAnalysis')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Average Win</span>
                <span className="text-sm font-medium text-profit">
                  +{formatCurrency(metrics.avgWin)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Largest Win</span>
                <span className="text-sm font-medium text-profit">
                  +{formatCurrency(metrics.largestWin)}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Average Loss</span>
                <span className="text-sm font-medium text-loss">
                  -{formatCurrency(metrics.avgLoss)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Largest Loss</span>
                <span className="text-sm font-medium text-loss">
                  {formatCurrency(metrics.largestLoss)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Payoff Ratio Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Payoff Ratio (Reward/Risk)</span>
              <Badge variant={metrics.payoffRatio >= 1.5 ? "default" : "outline"}>
                {metrics.payoffRatio === Infinity ? '∞' : formatNumber(metrics.payoffRatio)}:1
              </Badge>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
              <div 
                className="bg-profit h-full"
                style={{ width: `${Math.min(metrics.payoffRatio / 3 * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Recovery Factor */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Recovery Factor</span>
              <span className={cn(
                "text-sm font-medium",
                metrics.recoveryFactor >= 3 ? "text-profit" :
                metrics.recoveryFactor >= 1 ? "text-warning" : "text-loss"
              )}>
                {formatNumber(metrics.recoveryFactor)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Net profit ÷ Max drawdown (higher is better)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
