import { cn } from '@/lib/utils';
import type { TabType } from '@/types/trading';
import { 
  LayoutDashboard, 
  Brain, 
  ArrowLeftRight, 
  History, 
  Settings, 
  FileText,
  Circle
} from 'lucide-react';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isRunning: boolean;
}

const navItems: { id: TabType; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'strategies', label: 'Strategies', icon: Brain },
  { id: 'exchanges', label: 'Exchanges', icon: ArrowLeftRight },
  { id: 'trades', label: 'Trade History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'reports', label: 'Reports', icon: FileText },
];

export function Sidebar({ activeTab, onTabChange, isRunning }: SidebarProps) {
  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg gradient-brand flex items-center justify-center font-bold text-sm shadow-glow">
            HQ
          </div>
          <span className="text-lg font-bold gradient-text">HAYQ TRADER</span>
        </div>
        
        {/* Bot Status */}
        <div className="flex items-center gap-2 text-sm text-sidebar-foreground">
          <Circle 
            className={cn(
              "h-2.5 w-2.5 fill-current",
              isRunning ? "text-profit animate-pulse-glow" : "text-loss"
            )} 
          />
          <span>{isRunning ? 'Bot Active' : 'Bot Inactive'}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-3 text-left transition-all duration-200",
                "hover:bg-sidebar-accent",
                isActive 
                  ? "bg-primary/10 text-foreground border-r-2 border-primary" 
                  : "text-sidebar-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground text-center">
          HAYQ Trading Bot v0.1.0
        </p>
      </div>
    </aside>
  );
}
