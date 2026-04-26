// Options Engine - HAYQ Pro (Binary options support)

export type OptionType = 'CALL' | 'PUT';
export type OptionStyle = 'binary' | 'vanilla';
export type OptionExchange = 'pocket_option' | 'binance_options' | 'deribit';

export interface OptionContract {
  id: string; exchange: OptionExchange; style: OptionStyle; type: OptionType;
  symbol: string; strikePrice: number; expiryMs: number; premium: number;
  payout: number; quantity: number; entryPrice: number; entryTime: Date;
  status: 'open' | 'won' | 'lost' | 'expired'; pnl: number; expiresAt: Date;
}

export interface BinaryOptionConfig {
  defaultExpiry: number; maxSimultaneousPositions: number;
  maxRiskPerTrade: number; payoutRate: number; lossRate: number;
}

export const defaultBinaryConfig: BinaryOptionConfig = {
  defaultExpiry: 60000, maxSimultaneousPositions: 5,
  maxRiskPerTrade: 0.03, payoutRate: 0.85, lossRate: 0,
};

export function blackScholes(S: number, K: number, T: number, r: number, sigma: number, type: OptionType) {
  if (T <= 0) {
    const i = type === 'CALL' ? Math.max(S-K,0) : Math.max(K-S,0);
    return { price: i, delta: i > 0 ? (type === 'CALL' ? 1 : -1) : 0, gamma: 0, theta: 0, vega: 0 };
  }
  const d1 = (Math.log(S/K) + (r+0.5*sigma*sigma)*T) / (sigma*Math.sqrt(T));
  const d2 = d1 - sigma*Math.sqrt(T);
  const N = (x: number) => {
    const a = Math.abs(x), t = 1/(1+0.2316419*a);
    const p = t*(0.31938153+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
    const n = 1 - (1/Math.sqrt(2*Math.PI))*Math.exp(-0.5*a*a)*p;
    return x >= 0 ? n : 1-n;
  };
  const nP = (x: number) => Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI);
  const price = type === 'CALL' ? S*N(d1)-K*Math.exp(-r*T)*N(d2) : K*Math.exp(-r*T)*N(-d2)-S*N(-d1);
  const delta = type === 'CALL' ? N(d1) : N(d1)-1;
  const gamma = nP(d1)/(S*sigma*Math.sqrt(T));
  const theta = (-(S*nP(d1)*sigma)/(2*Math.sqrt(T))-r*K*Math.exp(-r*T)*(type==='CALL'?N(d2):N(-d2)))/365;
  const vega = S*nP(d1)*Math.sqrt(T)/100;
  return { price: Math.max(price,0), delta, gamma, theta, vega };
}
