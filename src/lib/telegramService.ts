// Telegram Notification Service - HAYQ Pro
// Sends alerts: signals, trades, risk events, daily summaries

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  signalAlerts: boolean;
  tradeAlerts: boolean;
  riskAlerts: boolean;
  dailySummary: boolean;
}

export const defaultTelegramConfig: TelegramConfig = {
  botToken: '', chatId: '', enabled: false,
  signalAlerts: true, tradeAlerts: true, riskAlerts: true, dailySummary: true,
};

const BASE = (token: string) => `https://api.telegram.org/bot${token}`;

async function send(token: string, chatId: string, text: string, parseMode = 'HTML'): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(token)}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
    });
    const data = await res.json() as { ok: boolean };
    return data.ok;
  } catch { return false; }
}

export async function telegramTest(config: TelegramConfig): Promise<boolean> {
  return send(config.botToken, config.chatId,
    `🤖 <b>HAYQ Trading Pro</b>\n✅ Կապն աշխատում է!\nBot connected successfully.`);
}

export async function telegramSendSignal(
  config: TelegramConfig,
  direction: 'BUY' | 'SELL',
  symbol: string,
  confidence: number,
  score: number,
  price: number
): Promise<void> {
  if (!config.enabled || !config.signalAlerts) return;
  const emoji = direction === 'BUY' ? '🟢' : '🔴';
  const text = `${emoji} <b>HAYQ Signal</b>
<b>Ուղղություն:</b> ${direction}
<b>Զույգ:</b> ${symbol}
<b>Գին:</b> $${price.toLocaleString()}
<b>Վստահություն:</b> ${(confidence * 100).toFixed(1)}%
<b>Գնահ.:</b> ${score.toFixed(1)}
⏰ ${new Date().toLocaleTimeString()}`;
  await send(config.botToken, config.chatId, text);
}

export async function telegramSendTrade(
  config: TelegramConfig,
  type: 'OPEN' | 'CLOSE',
  direction: 'BUY' | 'SELL',
  symbol: string,
  price: number,
  pnl?: number
): Promise<void> {
  if (!config.enabled || !config.tradeAlerts) return;
  const emoji = type === 'OPEN' ? '📈' : (pnl && pnl > 0 ? '✅' : '❌');
  const pnlText = pnl !== undefined ? `\n<b>P&L:</b> ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}` : '';
  const text = `${emoji} <b>HAYQ Trade ${type}</b>
<b>Տեսակ:</b> ${direction}
<b>Զույգ:</b> ${symbol}
<b>Գին:</b> $${price.toLocaleString()}${pnlText}
⏰ ${new Date().toLocaleTimeString()}`;
  await send(config.botToken, config.chatId, text);
}

export async function telegramSendRiskAlert(
  config: TelegramConfig,
  reason: string,
  level: 'warning' | 'critical'
): Promise<void> {
  if (!config.enabled || !config.riskAlerts) return;
  const emoji = level === 'critical' ? '🚨' : '⚠️';
  const text = `${emoji} <b>HAYQ Risk Alert</b>
<b>Ռիսկ:</b> ${reason}
⏰ ${new Date().toLocaleTimeString()}`;
  await send(config.botToken, config.chatId, text);
}

export async function telegramSendDailySummary(
  config: TelegramConfig,
  stats: { totalTrades: number; wins: number; losses: number; pnl: number; winRate: number; balance: number }
): Promise<void> {
  if (!config.enabled || !config.dailySummary) return;
  const emoji = stats.pnl >= 0 ? '📊✅' : '📊❌';
  const text = `${emoji} <b>HAYQ Օրական ամփոփ</b>
<b>Գործ.:</b> ${stats.totalTrades} (${stats.wins}✅ ${stats.losses}❌)
<b>Win Rate:</b> ${(stats.winRate * 100).toFixed(1)}%
<b>P&L:</b> ${stats.pnl >= 0 ? '+' : ''}$${stats.pnl.toFixed(2)}
<b>Մնաց.:</b> $${stats.balance.toFixed(2)}
📅 ${new Date().toLocaleDateString('hy-AM')}`;
  await send(config.botToken, config.chatId, text);
}
