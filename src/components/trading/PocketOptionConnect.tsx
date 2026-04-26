// Pocket Option Connect - HAYQ Pro
// Auth: sessionToken + uid from 42["auth",...] WS frame

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, TrendingDown, RefreshCw, Clock, CheckCircle2, ChevronDown, ChevronUp, Zap, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  poGetBalance, poGetActiveOrders, poPlaceOrder,
  type POCredentials, type POBalance, type POOrder, type POAsset, type PODuration,
} from '@/lib/pocketOptionService';
import { toast } from 'sonner';

const ASSETS: { label: string; value: POAsset; group: string }[] = [
  { group: 'Forex OTC',  label: 'EUR/USD', value: 'EURUSD_otc' },
  { group: 'Forex OTC',  label: 'GBP/USD', value: 'GBPUSD_otc' },
  { group: 'Forex OTC',  label: 'USD/JPY', value: 'USDJPY_otc' },
  { group: 'Forex OTC',  label: 'AUD/USD', value: 'AUDUSD_otc' },
  { group: 'Forex OTC',  label: 'EUR/JPY', value: 'EURJPY_otc' },
  { group: 'Crypto OTC', label: 'BTC/USD', value: 'BTCUSD_otc' },
  { group: 'Crypto OTC', label: 'ETH/USD', value: 'ETHUSD_otc' },
  { group: 'Crypto OTC', label: 'XRP/USD', value: 'XRPUSD_otc' },
  { group: 'Metals OTC', label: 'XAU/USD', value: 'XAUUSD_otc' },
  { group: 'Metals OTC', label: 'XAG/USD', value: 'XAGUSD_otc' },
  { group: 'Stocks OTC', label: 'AAPL',    value: '#AAPL_otc'  },
  { group: 'Stocks OTC', label: 'TSLA',    value: '#TSLA_otc'  },
];

const DURATIONS: { label: string; value: PODuration }[] = [
  { label: '5s', value: 5 }, { label: '15s', value: 15 }, { label: '30s', value: 30 },
  { label: '1m', value: 60 }, { label: '2m', value: 120 }, { label: '5m', value: 300 },
];

function Countdown({ expireTime }: { expireTime: string }) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Math.floor((new Date(expireTime).getTime() - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expireTime]);
  return (
    <span className={cn('font-mono text-xs tabular-nums', left <= 5 ? 'text-red-500 animate-pulse' : 'text-muted-foreground')}>
      {left}s
    </span>
  );
}

export function PocketOptionConnect() {
  const [sessionToken, setSessionToken] = useState('');
  const [uid, setUid] = useState('');
  const [isDemo, setIsDemo] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [balance, setBalance] = useState<POBalance | null>(null);
  const [asset, setAsset] = useState<POAsset>('EURUSD_otc');
  const [duration, setDuration] = useState<PODuration>(60);
  const [amount, setAmount] = useState(1);
  const [trading, setTrading] = useState<'call' | 'put' | null>(null);
  const [orders, setOrders] = useState<POOrder[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const creds: POCredentials = { sessionToken, uid };

  useEffect(() => {
    if (!balance) return;
    const poll = async () => {
      try { setOrders(await poGetActiveOrders(creds, isDemo)); } catch { /**/ }
    };
    poll();
    pollRef.current = setInterval(poll, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [balance, isDemo]);

  const handleConnect = async () => {
    if (!sessionToken.trim() || !uid.trim()) { toast.error('sessionToken և uid պարտադիր են'); return; }
    setConnecting(true);
    try {
      const bal = await poGetBalance(creds, isDemo);
      setBalance(bal);
      toast.success(`✅ Կապակցված! Մնացորդ: ${bal.balance.toFixed(2)} ${bal.currency}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Կապն ձախողվեց');
    } finally { setConnecting(false); }
  };

  const handleTrade = async (dir: 'call' | 'put') => {
    if (!balance) { toast.error('Նախ կապակցվեք'); return; }
    if (amount > balance.balance) { toast.error(`Գումարն անցնում է մնացորդը ($${balance.balance.toFixed(2)})`); return; }
    setTrading(dir);
    try {
      await poPlaceOrder(creds, asset, amount, dir, duration, isDemo);
      toast.success(`📊 ${dir.toUpperCase()} ${asset.replace('_otc', '')} $${amount} — ${duration}վ`);
      const bal = await poGetBalance(creds, isDemo);
      setBalance(bal);
      setOrders(await poGetActiveOrders(creds, isDemo));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Հրամանն ձախողվեց');
    } finally { setTrading(null); }
  };

  const grouped = ASSETS.reduce((acc, a) => {
    acc[a.group] = acc[a.group] ?? [];
    acc[a.group].push(a);
    return acc;
  }, {} as Record<string, typeof ASSETS>);

  return (
    <div className="space-y-4 max-w-xl">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-purple-500/15 text-purple-500 flex items-center justify-center text-[10px] font-bold">PO</div>
              Pocket Option
            </CardTitle>
            {balance
              ? <Badge className="bg-green-500/15 text-green-600 border-green-500/30 gap-1 text-xs">
                  <CheckCircle2 className="h-3 w-3" />{balance.is_demo ? 'Practice' : 'Real'} կապ
                </Badge>
              : <Badge variant="outline" className="text-muted-foreground text-xs">Անջատված</Badge>
            }
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button size="sm" variant={isDemo ? 'default' : 'outline'} className="flex-1 h-8" onClick={() => setIsDemo(true)}>Practice</Button>
            <Button size="sm" variant={!isDemo ? 'destructive' : 'outline'} className="flex-1 h-8" onClick={() => setIsDemo(false)}>Real ⚠️</Button>
          </div>
          {!isDemo && <Alert variant="destructive" className="py-2"><AlertDescription className="text-xs">Իրական գումար — բոլոր հրամաններն իրականում կատարվելու են</AlertDescription></Alert>}

          {!balance && (
            <form autoComplete="off" onSubmit={e => { e.preventDefault(); handleConnect(); }} className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground">sessionToken</label>
                <Input name="po-token" autoComplete="off" placeholder="5fc31b94c4057d098c107ccaa84b01e4"
                  value={sessionToken} onChange={e => setSessionToken(e.target.value.trim())} className="h-8 text-xs font-mono mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">uid</label>
                <Input name="po-uid" autoComplete="off" placeholder="119914854"
                  value={uid} onChange={e => setUid(e.target.value.trim())} className="h-8 text-xs font-mono mt-1" />
              </div>
              <button type="button" onClick={() => setShowHelp(p => !p)}
                className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Info className="h-3 w-3" />Ինչպես ստանալ այս արժեքները
                {showHelp ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {showHelp && (
                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground border space-y-1">
                  <p className="font-medium text-foreground">Քայլ առ քայլ.</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Բացեք <strong>pocketoption.com</strong> ու մուտք գործեք</li>
                    <li>Սեղմեք <kbd className="bg-muted px-1 rounded">F12</kbd> → <strong>Network</strong> tab</li>
                    <li>Filter-ում ընտրեք <strong>WS</strong> (WebSocket)</li>
                    <li>Կտտացրեք <code>socket.io</code> կապը</li>
                    <li><strong>Messages</strong> tab-ում փնտրեք.<br/>
                      <code className="text-foreground bg-muted px-1 rounded break-all">42["auth",&lbrace;"sessionToken":"...","uid":"..."&rbrace;]</code>
                    </li>
                    <li>Պատճենեք <code>sessionToken</code> և <code>uid</code> արժեքները</li>
                  </ol>
                </div>
              )}
              <Button type="submit" className="w-full h-9" disabled={connecting || !sessionToken || !uid}>
                {connecting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Կապակցվում…</> : 'Կապակցել Pocket Option-ին'}
              </Button>
            </form>
          )}

          {balance && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
              <div>
                <p className="text-xs text-muted-foreground">{balance.is_demo ? 'Practice' : 'Real'} · {balance.currency}</p>
                <p className="text-2xl font-bold tabular-nums">{balance.balance.toFixed(2)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={async () => {
                  const bal = await poGetBalance(creds, isDemo); setBalance(bal);
                }}><RefreshCw className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setBalance(null); setOrders([]); }}>
                  Անջատել
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {balance && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />Արագ Թրեյդ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{group}</p>
                <div className="flex flex-wrap gap-1">
                  {items.map(a => (
                    <button key={a.value} onClick={() => setAsset(a.value)}
                      className={cn('text-xs px-2 py-1 rounded border transition-colors',
                        asset === a.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <p className="text-xs text-muted-foreground mb-1">Ժամկետ</p>
              <div className="flex gap-1 flex-wrap">
                {DURATIONS.map(d => (
                  <button key={d.value} onClick={() => setDuration(d.value)}
                    className={cn('px-2 py-1 text-xs rounded border transition-colors',
                      duration === d.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Գումար (max ${balance.balance.toFixed(2)})</p>
              <div className="flex gap-2 items-center flex-wrap">
                <Input type="number" min={1} step={1} max={balance.balance} value={amount}
                  onChange={e => setAmount(Math.max(1, Number(e.target.value)))} className="h-8 w-24 text-sm" />
                {[1, 5, 10, 25, 50].map(v => (
                  <button key={v} onClick={() => setAmount(v)}
                    className={cn('text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors', amount === v && 'bg-muted')}>
                    ${v}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button className="h-14 bg-green-600 hover:bg-green-700 text-white flex-col gap-0.5" disabled={!!trading} onClick={() => handleTrade('call')}>
                {trading === 'call' ? <Loader2 className="h-5 w-5 animate-spin" /> : <><TrendingUp className="h-5 w-5" /><span className="text-sm font-semibold">CALL ↑</span></>}
              </Button>
              <Button className="h-14 bg-red-600 hover:bg-red-700 text-white flex-col gap-0.5" disabled={!!trading} onClick={() => handleTrade('put')}>
                {trading === 'put' ? <Loader2 className="h-5 w-5 animate-spin" /> : <><TrendingDown className="h-5 w-5" /><span className="text-sm font-semibold">PUT ↓</span></>}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">Պայմ. ~85% · {isDemo ? '🟡 Practice' : '🔴 Real'}</p>
          </CardContent>
        </Card>
      )}

      {orders.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />Ակտիվ հրամաններ ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orders.map((o, i) => (
                <div key={o.order_id ?? i} className="flex items-center justify-between p-2.5 rounded-lg border text-sm">
                  <div className="flex items-center gap-2">
                    {o.direction === 'call' ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                    <div>
                      <p className="font-medium text-xs">{o.asset?.replace('_otc', ' OTC')}</p>
                      <p className="text-[10px] text-muted-foreground">${o.amount} · {o.direction?.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {o.expire_time ? <Countdown expireTime={o.expire_time} /> : <span className="text-xs text-muted-foreground">{o.status}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
