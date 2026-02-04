// Main Index Page - HAYQ Project

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from '@/components/trading/Sidebar';
import { Header } from '@/components/trading/Header';
import { DashboardTab } from '@/components/trading/DashboardTab';
import { StrategiesTab } from '@/components/trading/StrategiesTab';
import { ExchangesTab } from '@/components/trading/ExchangesTab';
import { TradesTab } from '@/components/trading/TradesTab';
import { SettingsTab } from '@/components/trading/SettingsTab';
import { ReportsTab } from '@/components/trading/ReportsTab';
import { RiskManagementTab } from '@/components/trading/RiskManagementTab';
import { SignalsPanel } from '@/components/trading/SignalsPanel';
import { useBotState } from '@/hooks/useBotState';
import type { TabType } from '@/types/trading';

const Index = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const {
    isRunning,
    tradingMode,
    setTradingMode,
    markets,
    trades,
    strategies,
    exchanges,
    stats,
    config,
    riskConfig,
    riskState,
    currentSignal,
    toggleBot,
    toggleStrategy,
    updateStrategyWeight,
    connectExchange,
    disconnectExchange,
    updateConfig,
    updateRiskConfig,
  } = useBotState();

  const tabTitles: Record<TabType, string> = {
    dashboard: t('nav.dashboard'),
    strategies: t('nav.strategies'),
    exchanges: t('nav.exchanges'),
    trades: t('nav.trades'),
    settings: t('nav.settings'),
    reports: t('nav.reports'),
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <DashboardTab stats={stats} trades={trades} />
            {isRunning && <SignalsPanel signal={currentSignal} />}
          </div>
        );
      case 'strategies':
        return (
          <StrategiesTab 
            strategies={strategies} 
            onToggle={toggleStrategy}
            onWeightChange={updateStrategyWeight}
          />
        );
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
        return (
          <div className="space-y-6">
            <SettingsTab config={config} onUpdate={updateConfig} />
            <RiskManagementTab 
              config={riskConfig} 
              state={riskState}
              onUpdate={updateRiskConfig}
            />
          </div>
        );
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
          tradingMode={tradingMode}
          onToggleBot={toggleBot}
          onModeChange={setTradingMode}
        />
        
        <div className="flex-1 overflow-auto p-6">
          {renderTab()}
        </div>
      </main>
    </div>
  );
};

export default Index;
