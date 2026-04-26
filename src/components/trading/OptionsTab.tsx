import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PocketOptionConnect } from './PocketOptionConnect';

interface OptionsTabProps {
  currentPrice: number;
  symbol: string;
}

export function OptionsTab({ currentPrice, symbol }: OptionsTabProps) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="live">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="live">🟢 Live — Pocket Option</TabsTrigger>
          <TabsTrigger value="info">📚 Ինտեգրացիա</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-4">
          <PocketOptionConnect />
        </TabsContent>

        <TabsContent value="info" className="mt-4">
          <div className="space-y-4">
            {[
              { name: 'Pocket Option', type: 'Binary', color: 'text-purple-500 border-purple-500', status: 'WebSocket API', note: 'sessionToken + uid' },
              { name: 'Binance',       type: 'Spot / Futures', color: 'text-yellow-500 border-yellow-500', status: 'REST + WS', note: 'API Key + Secret' },
              { name: 'Bybit',         type: 'Spot / Perps',   color: 'text-orange-500 border-orange-500', status: 'REST V5 + WS', note: 'API Key + Secret' },
              { name: 'TradingView',   type: 'Signals',        color: 'text-teal-500 border-teal-500',     status: 'Webhook', note: '/api/webhook/tv' },
              { name: 'Telegram',      type: 'Notifications',  color: 'text-blue-500 border-blue-500',     status: 'Bot API', note: 'Token + Chat ID' },
              { name: 'Deribit',       type: 'Options',        color: 'text-indigo-500 border-indigo-500', status: 'REST + WS', note: 'Client ID + Secret' },
            ].map(p => (
              <div key={p.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border">
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.type} · {p.note}</p>
                </div>
                <Badge variant="outline" className={p.color}>{p.status}</Badge>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
