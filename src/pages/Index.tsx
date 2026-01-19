import { useState } from 'react';
import { Sidebar } from '@/components/trading/Sidebar';
import { Header } from '@/components/trading/Header';
import { DashboardTab } from '@/components/trading/DashboardTab';
import { StrategiesTab } from '@/components/trading/StrategiesTab';
import { ExchangesTab } from '@/components/trading/ExchangesTab';
import { TradesTab } from '@/components/trading/TradesTab';
import { SettingsTab } from '@/components/trading/SettingsTab';
import { ReportsTab } from '@/components/trading/ReportsTab';
import { useBotState } from '@/hooks/useBotState';
import type { TabType } from '@/types/trading';

const tabTitles: Record<TabType, string> = {
  dashboard: 'Trading Dashboard',
  strategies: 'Trading Strategies',
  exchanges: 'Exchange Connections',
  trades: 'Trade History',
  settings: 'Bot Settings',
  reports: 'Performance Reports',
};

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const {
    isRunning,
    markets,
    trades,
    strategies,
    exchanges,
    stats,
    config,
    toggleBot,
    toggleStrategy,
    connectExchange,
    disconnectExchange,
    updateConfig,
  } = useBotState();

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab stats={stats} trades={trades} />;
      case 'strategies':
        return <StrategiesTab strategies={strategies} onToggle={toggleStrategy} />;
      case 'exchanges':
        return (
          <ExchangesTab
            exchanges={exchanges}
            onConnect={connectExchange}
            onDisconnect={disconnectExchange}
          />
        );
      case 'trades':
        return <TradesTab trades={trades} />;
      case 'settings':
        return <SettingsTab config={config} onUpdate={updateConfig} />;
      case 'reports':
        return <ReportsTab stats={stats} trades={trades} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isRunning={isRunning}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={tabTitles[activeTab]}
          markets={markets}
          isRunning={isRunning}
          onToggleBot={toggleBot}
        />
        
        <div className="flex-1 overflow-auto p-6">
          {renderTab()}
        </div>
      </main>
    </div>
  );
};

export default Index;
