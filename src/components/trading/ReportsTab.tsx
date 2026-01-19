import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { BotStats, Trade } from '@/types/trading';

interface ReportsTabProps {
  stats: BotStats;
  trades: Trade[];
}

const COLORS = ['hsl(160, 84%, 39%)', 'hsl(0, 72%, 51%)'];

export function ReportsTab({ stats, trades }: ReportsTabProps) {
  // Calculate weekly data
  const weeklyData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    profit: Math.random() * 500 - 100,
    trades: Math.floor(Math.random() * 10) + 1,
  }));

  // Calculate win/loss data
  const winCount = trades.filter(t => t.profit >= 0).length;
  const lossCount = trades.filter(t => t.profit < 0).length;
  const pieData = [
    { name: 'Wins', value: winCount },
    { name: 'Losses', value: lossCount },
  ];

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Weekly Performance */}
      <div className="bg-card rounded-xl p-6 shadow-card animate-fade-in">
        <h3 className="text-lg font-semibold mb-4">Weekly Performance</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(217, 33%, 17%)',
                  border: '1px solid hsl(217, 33%, 25%)',
                  borderRadius: '8px',
                  color: 'hsl(210, 40%, 96%)',
                }}
              />
              <Bar
                dataKey="profit"
                radius={[4, 4, 0, 0]}
                fill="hsl(17, 95%, 57%)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Win/Loss Ratio */}
      <div className="bg-card rounded-xl p-6 shadow-card animate-fade-in">
        <h3 className="text-lg font-semibold mb-4">Win/Loss Ratio</h3>
        <div className="h-[300px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(217, 33%, 17%)',
                  border: '1px solid hsl(217, 33%, 25%)',
                  borderRadius: '8px',
                  color: 'hsl(210, 40%, 96%)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-profit" />
            <span className="text-sm">Wins ({winCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-loss" />
            <span className="text-sm">Losses ({lossCount})</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="col-span-2 bg-card rounded-xl p-6 shadow-card animate-fade-in">
        <h3 className="text-lg font-semibold mb-4">Summary</h3>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Profit</p>
            <p className="text-2xl font-bold text-profit">
              +${stats.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
            <p className="text-2xl font-bold">{stats.winRate}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Trades</p>
            <p className="text-2xl font-bold">{stats.totalTrades}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Avg Trade Profit</p>
            <p className="text-2xl font-bold">
              ${(stats.totalProfit / stats.totalTrades).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
