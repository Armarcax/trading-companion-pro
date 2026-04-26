import { TrendingUp, ArrowLeftRight, Percent, Wallet } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { ProfitChart } from './ProfitChart';
import { RecentTrades } from './RecentTrades';
import type { BotStats, Trade } from '@/types/trading';

interface DashboardTabProps {
  stats: BotStats;
  trades: Trade[];
}

export function DashboardTab({ stats, trades }: DashboardTabProps) {
  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      {/* Chart Section */}
      <div className="col-span-2">
        <ProfitChart initialBalance={stats.balance - stats.totalProfit} />
      </div>

      {/* Stats Section */}
      <div className="space-y-4">
        <StatsCard
          title="Total Profit"
          value={`$${stats.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          change={`+${stats.profitPercent}% this month`}
          icon={<TrendingUp className="h-4 w-4" />}
          iconColor="profit"
        />

        <StatsCard
          title="Total Trades"
          value={stats.totalTrades.toString()}
          change={`${stats.weeklyTrades} this week`}
          icon={<ArrowLeftRight className="h-4 w-4" />}
          iconColor="primary"
        />

        <StatsCard
          title="Win Rate"
          value={`${stats.winRate}%`}
          change={`+${stats.winRateChange}% from last week`}
          icon={<Percent className="h-4 w-4" />}
          iconColor="pink"
        />

        <StatsCard
          title="Balance"
          value={`$${stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          change={`+${stats.balanceChange}% monthly`}
          icon={<Wallet className="h-4 w-4" />}
          iconColor="blue"
        />

        <RecentTrades trades={trades} />
      </div>
    </div>
  );
}
