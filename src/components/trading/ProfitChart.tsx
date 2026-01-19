import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ProfitChartProps {
  initialBalance?: number;
}

export function ProfitChart({ initialBalance = 12000 }: ProfitChartProps) {
  const data = useMemo(() => {
    const days = 30;
    let currentValue = initialBalance;
    const chartData = [];

    for (let i = 0; i < days; i++) {
      const r = Math.random();
      let change;

      if (r < 0.60) {
        change = Math.random() * 0.02 + 0.001;
      } else if (r < 0.85) {
        change = -(Math.random() * 0.015 + 0.001);
      } else if (r < 0.95) {
        change = Math.random() * 0.05 + 0.02;
      } else {
        change = -(Math.random() * 0.03 + 0.02);
      }

      currentValue += currentValue * change;
      chartData.push({
        day: `Day ${i + 1}`,
        value: parseFloat(currentValue.toFixed(2)),
      });
    }

    return chartData;
  }, [initialBalance]);

  return (
    <div className="bg-card rounded-xl p-6 shadow-card h-full animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Profit Chart (30 Days)</h3>
        <div className="flex gap-2">
          {['1W', '1M', '3M', '1Y'].map((period, i) => (
            <button
              key={period}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                i === 1
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(17, 95%, 57%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(17, 95%, 57%)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(217, 33%, 17%)',
                border: '1px solid hsl(217, 33%, 25%)',
                borderRadius: '8px',
                color: 'hsl(210, 40%, 96%)',
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(17, 95%, 57%)"
              strokeWidth={2}
              fill="url(#profitGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
