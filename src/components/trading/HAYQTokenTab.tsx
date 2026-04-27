import { useState, useEffect } from 'react';
import { HAYQ_CONTRACTS } from '@/lib/hayqContracts';

interface TokenStats {
  price: number;
  totalSupply: number;
  stakedAmount: number;
  holders: number;
}

export function HAYQTokenTab() {
  const [stats, setStats] = useState<TokenStats>({
    price: 0,
    totalSupply: 0,
    stakedAmount: 0,
    holders: 0,
  });
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTokenStats();
  }, []);

  const fetchTokenStats = async () => {
    setLoading(true);
    try {
      const eth = (window as any).ethereum;
      if (!eth) return;

      const totalSupplyCall = async () => {
        const sig = '0x18160ddd';
        const res = await eth.request({
          method: 'eth_call',
          params: [{ to: HAYQ_CONTRACTS.HAYQ_TOKEN, data: sig }, 'latest'],
        });
        return Number(BigInt(res)) / 1e18;
      };

      const totalSupply = await totalSupplyCall();
      setStats(prev => ({ ...prev, totalSupply }));
    } catch (e) {
      console.error('Token stats error:', e);
    } finally {
      setLoading(false);
    }
  };

  const checkWalletBalance = async () => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      const addr = accounts[0];
      const sig = '0x70a08231';
      const padded = addr.slice(2).padStart(64, '0');
      const res = await eth.request({
        method: 'eth_call',
        params: [{ to: HAYQ_CONTRACTS.HAYQ_TOKEN, data: sig + padded }, 'latest'],
      });
      setWalletBalance(Number(BigInt(res)) / 1e18);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">HAYQ Token</h2>
          <p className="text-sm text-muted-foreground">
            Sepolia Testnet ·{' '}
            
              href={`https://sepolia.etherscan.io/address/${HAYQ_CONTRACTS.HAYQ_TOKEN}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {HAYQ_CONTRACTS.HAYQ_TOKEN.slice(0, 8)}...
            </a>
          </p>
        </div>
        <button
          onClick={fetchTokenStats}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Թարմացնել
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Supply', value: loading ? '...' : `${stats.totalSupply.toLocaleString()} HAYQ` },
          { label: 'Token Address', value: `${HAYQ_CONTRACTS.HAYQ_TOKEN.slice(0, 6)}...` },
          { label: 'Staking', value: HAYQ_CONTRACTS.STAKING.slice(0, 6) + '...' },
          { label: 'Network', value: 'Sepolia' },
        ].map(item => (
          <div
            key={item.label}
            className="border rounded-xl p-4 bg-card"
          >
            <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
            <div className="font-semibold text-sm">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Contracts */}
      <div className="border rounded-xl p-4 bg-card space-y-3">
        <div className="font-medium text-sm mb-2">Contract Addresses</div>
        {Object.entries(HAYQ_CONTRACTS).map(([key, addr]) => (
          <div key={key} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{key}</span>
            
              href={`https://sepolia.etherscan.io/address/${addr}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-primary hover:underline"
            >
              {addr.slice(0, 8)}...{addr.slice(-6)}
            </a>
          </div>
        ))}
      </div>

      {/* Wallet Check */}
      <div className="border rounded-xl p-4 bg-card">
        <div className="font-medium text-sm mb-3">Wallet Balance</div>
        {walletBalance !== null ? (
          <div className="text-2xl font-bold text-primary">
            {walletBalance.toFixed(4)} HAYQ
            {walletBalance >= 100 && (
              <span className="ml-2 text-sm text-green-500">Premium ✅</span>
            )}
          </div>
        ) : (
          <button
            onClick={checkWalletBalance}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
          >
            Connect MetaMask
          </button>
        )}
      </div>
    </div>
  );
}