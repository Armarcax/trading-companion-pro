// Telegram Notification Edge Function - HAYQ Pro
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

interface TelegramRequest {
  action: 'send' | 'test';
  botToken: string;
  chatId: string;
  text: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const { action, botToken, chatId, text }: TelegramRequest = await req.json();
    const msg = action === 'test'
      ? `🤖 <b>HAYQ Trading Pro</b>\n✅ Telegram կապն աշխատում է!\nBot connected.`
      : text;

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' }),
    });
    const data = await res.json() as { ok: boolean; description?: string };
    if (!data.ok) throw new Error(data.description ?? 'Telegram error');
    return new Response(JSON.stringify({ success: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Unknown' }), {
      status: 400, headers: cors,
    });
  }
});
