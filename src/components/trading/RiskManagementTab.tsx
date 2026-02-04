// Risk Management Tab - HAYQ Project

import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, AlertTriangle, TrendingDown, Clock } from 'lucide-react';
import type { RiskConfig } from '@/lib/riskManagement';
import type { RiskState } from '@/lib/riskManagement';

interface RiskManagementTabProps {
  config: RiskConfig;
  state: RiskState;
  onUpdate: (updates: Partial<RiskConfig>) => void;
}

export function RiskManagementTab({ config, state, onUpdate }: RiskManagementTabProps) {
  const { t } = useTranslation();
  
  const exposurePercent = (state.currentExposure / config.maxExposure) * 100;
  const lossProgress = (state.consecutiveLosses / config.maxConsecutiveLosses) * 100;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Risk Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-card animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="h-5 w-5 text-profit" />
            <span className="text-sm text-muted-foreground">{t('risk.capitalProtection')}</span>
          </div>
          <div className="text-2xl font-bold text-profit">
            {((1 - config.maxRiskPerTrade) * 100).toFixed(0)}%
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-card animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="h-5 w-5 text-loss" />
            <span className="text-sm text-muted-foreground">{t('risk.consecutiveLosses')}</span>
          </div>
          <div className="text-2xl font-bold">
            {state.consecutiveLosses} / {config.maxConsecutiveLosses}
          </div>
          <Progress value={lossProgress} className="mt-2 h-2" />
        </div>

        <div className="bg-card rounded-xl p-4 shadow-card animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-muted-foreground">{t('risk.currentExposure')}</span>
          </div>
          <div className="text-2xl font-bold">
            {(state.currentExposure * 100).toFixed(1)}%
          </div>
          <Progress value={exposurePercent} className="mt-2 h-2" />
        </div>

        <div className="bg-card rounded-xl p-4 shadow-card animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-muted-foreground">{t('risk.dailyPnL')}</span>
          </div>
          <div className={`text-2xl font-bold ${state.dailyPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
            ${state.dailyPnL.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Risk Parameters */}
      <div className="bg-card rounded-xl p-6 shadow-card animate-fade-in">
        <h3 className="text-lg font-semibold mb-4">{t('risk.title')}</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxRisk">{t('risk.maxRiskPerTrade')}</Label>
            <Input
              id="maxRisk"
              type="number"
              step="0.1"
              value={(config.maxRiskPerTrade * 100).toFixed(1)}
              onChange={(e) => onUpdate({ maxRiskPerTrade: parseFloat(e.target.value) / 100 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxExposure">{t('risk.maxExposure')}</Label>
            <Input
              id="maxExposure"
              type="number"
              step="1"
              value={(config.maxExposure * 100).toFixed(0)}
              onChange={(e) => onUpdate({ maxExposure: parseFloat(e.target.value) / 100 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxLosses">{t('risk.maxConsecutiveLosses')}</Label>
            <Input
              id="maxLosses"
              type="number"
              value={config.maxConsecutiveLosses}
              onChange={(e) => onUpdate({ maxConsecutiveLosses: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cooldown">{t('risk.cooldownMinutes')}</Label>
            <Input
              id="cooldown"
              type="number"
              value={config.cooldownMinutes}
              onChange={(e) => onUpdate({ cooldownMinutes: parseInt(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* Adaptive Stops */}
      <div className="bg-card rounded-xl p-6 shadow-card animate-fade-in">
        <h3 className="text-lg font-semibold mb-4">Adaptive Stop Loss / Take Profit</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="adaptiveSL" className="text-base">{t('risk.adaptiveSL')}</Label>
              <p className="text-sm text-muted-foreground">
                Use ATR-based dynamic stop loss
              </p>
            </div>
            <Switch
              id="adaptiveSL"
              checked={config.adaptiveSL}
              onCheckedChange={(checked) => onUpdate({ adaptiveSL: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="adaptiveTP" className="text-base">{t('risk.adaptiveTP')}</Label>
              <p className="text-sm text-muted-foreground">
                Use ATR-based dynamic take profit
              </p>
            </div>
            <Switch
              id="adaptiveTP"
              checked={config.adaptiveTP}
              onCheckedChange={(checked) => onUpdate({ adaptiveTP: checked })}
            />
          </div>

          {config.adaptiveSL && (
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="slMult">{t('risk.slMultiplier')}</Label>
                <Input
                  id="slMult"
                  type="number"
                  step="0.1"
                  value={config.slMultiplier}
                  onChange={(e) => onUpdate({ slMultiplier: parseFloat(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tpMult">{t('risk.tpMultiplier')}</Label>
                <Input
                  id="tpMult"
                  type="number"
                  step="0.1"
                  value={config.tpMultiplier}
                  onChange={(e) => onUpdate({ tpMultiplier: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <Button className="gradient-brand border-0 shadow-glow">
        {t('common.save')}
      </Button>
    </div>
  );
}
