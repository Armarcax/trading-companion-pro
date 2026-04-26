import { useTranslation } from 'react-i18next';
import { LayoutDashboard, TrendingUp, RefreshCw, BarChart2, Settings, FileText, Shield, Layers, Send, Wifi, WifiOff } from 'lucide-react';
import type { TabType } from '@/types/trading';
import { cn } from '@/lib/utils';

const NAV: { tab: TabType; icon: React.ComponentType<{className?: string}>; key: string; badge?: string }[] = [
  { tab: 'dashboard',   icon: LayoutDashboard, key: 'nav.dashboard'   },
  { tab: 'strategies',  icon: TrendingUp,      key: 'nav.strategies'  },
  { tab: 'options',     icon: Layers,          key: 'nav.options',    badge: 'PO' },
  { tab: 'exchanges',   icon: RefreshCw,       key: 'nav.exchanges'   },
  { tab: 'trades',      icon: BarChart2,       key: 'nav.trades'      },
  { tab: 'reports',     icon: FileText,        key: 'nav.reports'     },
  { tab: 'telegram',    icon: Send,            key: 'nav.telegram' },
  { tab: 'settings',    icon: Settings,        key: 'nav.settings'    },
];

interface Props { activeTab: TabType; onTabChange: (t: TabType) => void; isRunning: boolean; wsConnected: boolean; }

export function Sidebar({ activeTab, onTabChange, isRunning, wsConnected }: Props) {
  const { t } = useTranslation();
  return (
    <aside className="w-14 md:w-56 border-r bg-background flex flex-col h-full shrink-0">
      <div className="p-3 border-b flex items-center gap-3 h-14">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors shrink-0',
          isRunning ? 'bg-green-500 text-white animate-pulse' : 'bg-primary text-primary-foreground')}>
          {isRunning ? '●' : 'H'}
        </div>
        <div className="hidden md:block min-w-0">
          <p className="text-sm font-semibold truncate">HAYQ Pro</p>
          <div className="flex items-center gap-1">
            {wsConnected ? <Wifi className="h-2.5 w-2.5 text-green-500" /> : <WifiOff className="h-2.5 w-2.5 text-muted-foreground" />}
            <span className={cn('text-[10px]', wsConnected ? 'text-green-500' : 'text-muted-foreground')}>
              {wsConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ tab, icon: Icon, key, badge }) => (
          <button key={tab} onClick={() => onTabChange(tab)}
            className={cn('w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors',
              activeTab === tab ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden md:block truncate">{t(key, { defaultValue: tab })}</span>
            {badge && <span className="hidden md:block ml-auto text-[9px] bg-purple-500/20 text-purple-500 px-1 rounded shrink-0">{badge}</span>}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t hidden md:block">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Binance · Bybit · Coinbase<br/>Pocket Option · Deribit<br/>TradingView · Telegram
        </p>
      </div>
    </aside>
  );
}
