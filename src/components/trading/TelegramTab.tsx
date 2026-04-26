// Telegram Integration Tab - HAYQ Pro
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, CheckCircle2, XCircle, Loader2, ExternalLink, Bot } from 'lucide-react';
import type { TelegramConfig } from '@/lib/telegramService';
import { telegramTest } from '@/lib/telegramService';
import { toast } from 'sonner';

interface Props { config: TelegramConfig; onUpdate: (u: Partial<TelegramConfig>) => void; }

export function TelegramTab({ config, onUpdate }: Props) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const handleTest = async () => {
    if (!config.botToken || !config.chatId) { toast.error('Մուտքագրեք Bot Token և Chat ID'); return; }
    setTesting(true); setTestResult(null);
    try {
      const ok = await telegramTest(config);
      setTestResult(ok);
      toast[ok ? 'success' : 'error'](ok ? '✅ Telegram կապն աշխատում է' : '❌ Telegram կապն ձախողվեց');
    } catch { setTestResult(false); toast.error('Telegram test failed'); }
    finally { setTesting(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-5 w-5 text-blue-500" />
            Telegram ծանուցումներ
            {config.enabled
              ? <Badge className="bg-green-500/15 text-green-600 border-green-500/30 ml-auto"><CheckCircle2 className="h-3 w-3 mr-1" />Ակտիվ</Badge>
              : <Badge variant="outline" className="text-muted-foreground ml-auto">Անջատված</Badge>
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Setup instructions */}
          <Alert className="border-blue-500/30 bg-blue-500/5">
            <AlertDescription className="text-xs space-y-1">
              <p className="font-medium text-foreground">Ինչպես ստեղծել Telegram Bot-ն.</p>
              <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
                <li>Telegram-ում գտեք <strong>@BotFather</strong></li>
                <li>Ուղարկեք <code className="bg-muted px-1 rounded">/newbot</code></li>
                <li>Անուն տվեք բոտին, ստացեք Token</li>
                <li>Chat ID-ի համար բացեք <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">@userinfobot <ExternalLink className="h-2.5 w-2.5" /></a></li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Bot token */}
          <form autoComplete="off" onSubmit={e => e.preventDefault()} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Bot Token</label>
              <Input name="tg-token" autoComplete="off" placeholder="1234567890:AABBccDDeeFF..." value={config.botToken}
                onChange={e => onUpdate({ botToken: e.target.value.trim() })} className="h-9 text-xs font-mono mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Chat ID</label>
              <Input name="tg-chatid" autoComplete="off" placeholder="123456789 կամ -100123456789 (group)" value={config.chatId}
                onChange={e => onUpdate({ chatId: e.target.value.trim() })} className="h-9 text-xs font-mono mt-1" />
            </div>

            {/* Test button */}
            <div className="flex gap-2 items-center">
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={handleTest}
                disabled={testing || !config.botToken || !config.chatId}>
                {testing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
                Փորձնական ուղարկել
              </Button>
              {testResult !== null && (
                testResult
                  ? <span className="text-xs text-green-500 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Հաջողված</span>
                  : <span className="text-xs text-red-500 flex items-center gap-1"><XCircle className="h-3.5 w-3.5" />Ձախողված</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Notification settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Ծանուցման կարգավորումներ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'enabled',      label: 'Ծանուցումները ընդհ. ակտիվ',  desc: 'Բոլոր Telegram ծանուցումները' },
            { key: 'signalAlerts', label: 'Ազդանշանի ծանուցումներ',      desc: 'BUY/SELL ազդանշան ստանալուն' },
            { key: 'tradeAlerts',  label: 'Գործ. ծանուցումներ',          desc: 'Գործ. բացում/փակում' },
            { key: 'riskAlerts',   label: 'Ռիսկի ծանուցումներ',          desc: 'Kill switch, drawdown, etc.' },
            { key: 'dailySummary', label: 'Օրական ամփոփ',                desc: 'Ամեն օր P&L ամփոփ' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch checked={!!config[key as keyof TelegramConfig]}
                onCheckedChange={v => onUpdate({ [key]: v })} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Message preview */}
      <Card className="border-dashed">
        <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Ծանուցման օրինակ</CardTitle></CardHeader>
        <CardContent>
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 text-xs font-mono space-y-0.5">
            <p>🟢 <strong>HAYQ Signal</strong></p>
            <p><strong>Ուղղություն:</strong> BUY</p>
            <p><strong>Զույգ:</strong> BTCUSDT</p>
            <p><strong>Գին:</strong> $67,350</p>
            <p><strong>Վստահություն:</strong> 78.4%</p>
            <p><strong>Գնահ.:</strong> 14.5</p>
            <p>⏰ 14:32:05</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
