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
import { OptionsTab } from '@/components/trading/OptionsTab';
import { TelegramTab } from '@/components/trading/TelegramTab';
import { HAYQTokenTab } from '@/components/trading/HAYQTokenTab'; // ← ՆՈՐ
import { useBotState, type FeedSource } from '@/hooks/useBotState';
import type { TabType } from '@/types/trading';

const Index = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const {
    isRunning, tradingMode, feedSource, setTradingMode, setFeedSource,
    markets, trades, strategies, exchanges, stats, config, riskConfig,
    riskState, currentSignal, wsConnected, telegramConfig,
    toggleBot, toggleStrategy, updateStrategyWeight,
    connectExchange, disconnectExchange,
    updateConfig, updateRiskConfig, updateTelegramConfig,
    candles,
  } = useBotState();

  const currentPrice = candles[candles.length - 1]?.close
    ?? markets.find(m => m.symbol === config.symbol)?.price ?? 0;

  const tabTitles: Record<TabType, string> = {
    dashboard: t('nav.dashboard'),
    strategies: t('nav.strategies'),
    options: t('nav.options', { defaultValue: 'Օпционнер' }),
    exchanges: t('nav.exchanges'),
    trades: t('nav.trades'),
    settings: t('nav.settings'),
    reports: t('nav.reports'),
    telegram: 'Telegram',
    hayq: 'HAYQ Token', // ← ՆՈՐ
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <DashboardTab stats={stats} trades={trades} />
            {isRunning && currentSignal && <SignalsPanel signal={currentSignal} />}
          </div>
        );
      case 'strategies':
        return <StrategiesTab strategies={strategies} onToggle={toggleStrategy} onWeightChange={updateStrategyWeight} />;
      case 'options':
        return <OptionsTab currentPrice={currentPrice} symbol={config.symbol} />;
      case 'exchanges':
        return <ExchangesTab exchanges={exchanges} onConnect={connectExchange} onDisconnect={disconnectExchange} />;
      case 'trades':
        return <TradesTab trades={trades} />;
      case 'settings':
        return (
          <div className="space-y-6">
            <SettingsTab config={config} onUpdate={updateConfig} />
            <RiskManagementTab config={riskConfig} state={riskState} onUpdate={updateRiskConfig} />
          </div>
        );
      case 'reports':
        return <ReportsTab stats={stats} trades={trades} />;
      case 'telegram':
        return <TelegramTab config={telegramConfig} onUpdate={updateTelegramConfig} />;
      case 'hayq': // ← ՆՈՐ
        return <HAYQTokenTab />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isRunning={isRunning} wsConnected={wsConnected} />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          title={tabTitles[activeTab]}
          markets={markets}
          isRunning={isRunning}
          tradingMode={tradingMode}
          feedSource={feedSource}
          wsConnected={wsConnected}
          onToggleBot={toggleBot}
          onModeChange={setTradingMode}
          onFeedChange={(f: FeedSource) => setFeedSource(f)}
        />
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {renderTab()}
        </div>
      </main>
    </div>
  );
};

export default Index;