import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  icon: ReactNode;
  iconColor: 'profit' | 'primary' | 'pink' | 'blue';
  className?: string;
}

const iconColorClasses = {
  profit: 'bg-profit/15 text-profit',
  primary: 'bg-primary/15 text-primary',
  pink: 'bg-pink-500/15 text-pink-500',
  blue: 'bg-blue-500/15 text-blue-500',
};

export function StatsCard({ title, value, change, icon, iconColor, className }: StatsCardProps) {
  return (
    <div className={cn(
      "bg-card rounded-xl p-5 shadow-card animate-fade-in",
      className
    )}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          iconColorClasses[iconColor]
        )}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      {change && (
        <div className="text-sm text-muted-foreground">{change}</div>
      )}
    </div>
  );
}
