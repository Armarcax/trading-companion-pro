// System Status Indicator - HAYQ Project
// Real-time status display for trading system

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { 
  Activity, 
  Pause, 
  AlertTriangle, 
  Power, 
  Wifi, 
  WifiOff,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type SystemMode = 'signal' | 'demo' | 'live';
export type SystemState = 'active' | 'paused' | 'kill_switch' | 'error';
export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface SystemStatusProps {
  mode: SystemMode;
  state: SystemState;
  connection: ConnectionState;
  riskLevel: RiskLevel;
  dailyPnL?: number;
  currentDrawdown?: number;
  className?: string;
}

const modeConfig: Record<SystemMode, { label: string; color: string; icon: typeof Activity }> = {
  signal: { label: 'Signal Only', color: 'bg-blue-500', icon: Activity },
  demo: { label: 'Demo Mode', color: 'bg-yellow-500', icon: Activity },
  live: { label: 'Live Trading', color: 'bg-profit', icon: TrendingUp },
};

const stateConfig: Record<SystemState, { label: string; color: string; icon: typeof Activity }> = {
  active: { label: 'Active', color: 'text-profit', icon: Activity },
  paused: { label: 'Paused', color: 'text-warning', icon: Pause },
  kill_switch: { label: 'EMERGENCY STOP', color: 'text-loss', icon: ShieldAlert },
  error: { label: 'Error', color: 'text-loss', icon: AlertTriangle },
};

const connectionConfig: Record<ConnectionState, { label: string; color: string; icon: typeof Wifi }> = {
  connected: { label: 'Connected', color: 'text-profit', icon: Wifi },
  connecting: { label: 'Connecting...', color: 'text-warning', icon: Wifi },
  disconnected: { label: 'Disconnected', color: 'text-muted-foreground', icon: WifiOff },
  error: { label: 'Connection Error', color: 'text-loss', icon: WifiOff },
};

const riskConfig: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low Risk', color: 'text-profit', bgColor: 'bg-profit/10' },
  medium: { label: 'Medium Risk', color: 'text-warning', bgColor: 'bg-warning/10' },
  high: { label: 'High Risk', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  critical: { label: 'Critical', color: 'text-loss', bgColor: 'bg-loss/10' },
};

export function SystemStatus({
  mode,
  state,
  connection,
  riskLevel,
  dailyPnL,
  currentDrawdown,
  className,
}: SystemStatusProps) {
  const { t } = useTranslation();
  const modeInfo = modeConfig[mode];
  const stateInfo = stateConfig[state];
  const connInfo = connectionConfig[connection];
  const riskInfo = riskConfig[riskLevel];

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        {/* Mode Badge */}
        <Tooltip>
          <TooltipTrigger>
            <Badge 
              variant="outline" 
              className={cn("gap-1.5 px-2.5 py-1", modeInfo.color, "text-white border-0")}
            >
              <modeInfo.icon className="h-3 w-3" />
              {modeInfo.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('status.modeDescription.' + mode)}</p>
          </TooltipContent>
        </Tooltip>

        {/* State Indicator */}
        <Tooltip>
          <TooltipTrigger>
            <div className={cn("flex items-center gap-1.5 text-sm font-medium", stateInfo.color)}>
              <stateInfo.icon className={cn(
                "h-4 w-4",
                state === 'active' && "animate-pulse"
              )} />
              <span className="hidden sm:inline">{stateInfo.label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>System: {stateInfo.label}</p>
          </TooltipContent>
        </Tooltip>

        {/* Connection Status */}
        <Tooltip>
          <TooltipTrigger>
            <div className={cn("flex items-center gap-1", connInfo.color)}>
              <connInfo.icon className={cn(
                "h-4 w-4",
                connection === 'connecting' && "animate-pulse"
              )} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{connInfo.label}</p>
          </TooltipContent>
        </Tooltip>

        {/* Risk Level */}
        <Tooltip>
          <TooltipTrigger>
            <Badge 
              variant="outline" 
              className={cn("gap-1.5 px-2 py-0.5", riskInfo.bgColor, riskInfo.color, "border-0")}
            >
              {riskLevel === 'low' || riskLevel === 'medium' ? (
                <ShieldCheck className="h-3 w-3" />
              ) : (
                <ShieldAlert className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">{riskInfo.label}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{riskInfo.label}</p>
              {dailyPnL !== undefined && (
                <p className={cn("text-sm", dailyPnL >= 0 ? "text-profit" : "text-loss")}>
                  Daily P&L: {dailyPnL >= 0 ? '+' : ''}{(dailyPnL * 100).toFixed(2)}%
                </p>
              )}
              {currentDrawdown !== undefined && currentDrawdown > 0 && (
                <p className="text-sm text-loss">
                  Drawdown: {(currentDrawdown * 100).toFixed(2)}%
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Daily P&L (compact) */}
        {dailyPnL !== undefined && (
          <div className={cn(
            "hidden lg:flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded",
            dailyPnL >= 0 ? "text-profit bg-profit/10" : "text-loss bg-loss/10"
          )}>
            {dailyPnL >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {dailyPnL >= 0 ? '+' : ''}{(dailyPnL * 100).toFixed(2)}%
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// Compact version for header
export function CompactStatus({
  mode,
  state,
  connection,
  riskLevel,
}: Pick<SystemStatusProps, 'mode' | 'state' | 'connection' | 'riskLevel'>) {
  const stateInfo = stateConfig[state];
  const connInfo = connectionConfig[connection];
  const riskInfo = riskConfig[riskLevel];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5">
        {/* Pulsing dot for state */}
        <Tooltip>
          <TooltipTrigger>
            <div className={cn(
              "h-2.5 w-2.5 rounded-full",
              state === 'active' && "bg-profit animate-pulse",
              state === 'paused' && "bg-warning",
              state === 'kill_switch' && "bg-loss animate-pulse",
              state === 'error' && "bg-loss"
            )} />
          </TooltipTrigger>
          <TooltipContent>
            <p>{stateInfo.label}</p>
          </TooltipContent>
        </Tooltip>

        {/* Mode letter */}
        <Tooltip>
          <TooltipTrigger>
            <span className={cn(
              "text-xs font-bold px-1.5 py-0.5 rounded",
              mode === 'signal' && "bg-blue-500/20 text-blue-500",
              mode === 'demo' && "bg-yellow-500/20 text-yellow-500",
              mode === 'live' && "bg-profit/20 text-profit"
            )}>
              {mode[0].toUpperCase()}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{modeConfig[mode].label}</p>
          </TooltipContent>
        </Tooltip>

        {/* Connection icon */}
        <connInfo.icon className={cn("h-3.5 w-3.5", connInfo.color)} />
      </div>
    </TooltipProvider>
  );
}
