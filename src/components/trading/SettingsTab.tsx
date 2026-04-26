import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import type { BotConfig } from '@/types/trading';

interface SettingsTabProps {
  config: BotConfig;
  onUpdate: (updates: Partial<BotConfig>) => void;
}

export function SettingsTab({ config, onUpdate }: SettingsTabProps) {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Trading Settings */}
      <div className="bg-card rounded-xl p-6 shadow-card animate-fade-in">
        <h3 className="text-lg font-semibold mb-4">Trading Settings</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="symbol">Trading Symbol</Label>
            <Input
              id="symbol"
              value={config.symbol}
              onChange={(e) => onUpdate({ symbol: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Trade Quantity</Label>
            <Input
              id="quantity"
              type="number"
              step="0.001"
              value={config.tradeQuantity}
              onChange={(e) => onUpdate({ tradeQuantity: parseFloat(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stopLoss">Stop Loss (%)</Label>
            <Input
              id="stopLoss"
              type="number"
              step="0.1"
              value={(config.stopLossPct * 100).toFixed(1)}
              onChange={(e) => onUpdate({ stopLossPct: parseFloat(e.target.value) / 100 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="takeProfit">Take Profit (%)</Label>
            <Input
              id="takeProfit"
              type="number"
              step="0.1"
              value={(config.takeProfitPct * 100).toFixed(1)}
              onChange={(e) => onUpdate({ takeProfitPct: parseFloat(e.target.value) / 100 })}
            />
          </div>
        </div>
      </div>

      {/* Indicator Settings */}
      <div className="bg-card rounded-xl p-6 shadow-card animate-fade-in">
        <h3 className="text-lg font-semibold mb-4">Indicator Settings</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emaShort">EMA Short Period</Label>
            <Input
              id="emaShort"
              type="number"
              value={config.emaShortPeriod}
              onChange={(e) => onUpdate({ emaShortPeriod: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emaLong">EMA Long Period</Label>
            <Input
              id="emaLong"
              type="number"
              value={config.emaLongPeriod}
              onChange={(e) => onUpdate({ emaLongPeriod: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rsi">RSI Period</Label>
            <Input
              id="rsi"
              type="number"
              value={config.rsiPeriod}
              onChange={(e) => onUpdate({ rsiPeriod: parseInt(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* Mode Settings */}
      <div className="bg-card rounded-xl p-6 shadow-card animate-fade-in">
        <h3 className="text-lg font-semibold mb-4">Mode Settings</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="dryRun" className="text-base">Dry Run Mode</Label>
            <p className="text-sm text-muted-foreground">
              Simulate trades without executing real orders
            </p>
          </div>
          <Switch
            id="dryRun"
            checked={config.dryRun}
            onCheckedChange={(checked) => onUpdate({ dryRun: checked })}
          />
        </div>
      </div>

      <Button className="gradient-brand border-0 shadow-glow">
        Save Settings
      </Button>
    </div>
  );
}
