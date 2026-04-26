// HayqTokenConnect.tsx — wallet connect + HAYQ token verify UI

import { useState } from 'react';
import { checkHayqTokenBalance, HAYQ_REQUIRED_BALANCE } from '@/lib/hayqTokenService';
import { explorerUrl, HAYQ_CONTRACTS } from '@/lib/hayqContracts';

interface HayqTokenConnectProps {
  userId: string;
  supabaseUrl: string;
  anonKey: string;
  onSuccess?: () => void;
}

export default function HayqTokenConnect({
  userId, supabaseUrl, anonKey, onSuccess,
}: HayqTokenConnectProps) {
  const [status, setStatus] = useState
    'idle' | 'checking' | 'success' | 'insufficient' | 'error'
  >('idle');
  const [info, setInfo] = useState<{
    address?: string;
    walletBalance?: number;
    stakedBalance?: number;
    totalBalance?: number;
    error?: string;
  }>({});

  const handleConnect = async () => {
    setStatus('checking');
    const result = await checkHayqTokenBalance();

    if (result.error) {
      setStatus('error');
      setInfo({ error: result.error });
      return;
    }

    setInfo({
      address: result.address,
      walletBalance: result.walletBalance,
      stakedBalance: result.stakedBalance,
      totalBalance: result.totalBalance,
    });

    if (result.hasEnough) {
      // Save to Supabase
      await fetch(
        `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            wallet_address: result.address,
            hayq_token_balance: result.totalBalance,
            hayq_token_verified: true,
            tier: 'hayq_premium',
            last_token_check: new Date().toISOString(),
          }),
        }
      );
      setStatus('success');
      onSuccess?.();
    } else {
      setStatus('insufficient');
    }
  };

  return (
    <div style={{
      background: 'var(--color-background-secondary)',
      border: '1px solid #7F77DD',
      borderRadius: '12px', padding: '24px',
      maxWidth: '420px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>
          🪙 HAYQ Token Gate
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Hold ≥{HAYQ_REQUIRED_BALANCE} HAYQ → Free Premium access
        </div>
      </div>

      {/* Contract info */}
      <div style={{
        background: 'var(--color-background-primary)',
        borderRadius: '8px', padding: '12px',
        marginBottom: '16px', fontSize: '12px',
      }}>
        <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
          Contract (Sepolia)
        </div>
        
          href={explorerUrl(HAYQ_CONTRACTS.HAYQ_TOKEN)}
          target="_blank" rel="noopener noreferrer"
          style={{ color: '#7F77DD', wordBreak: 'break-all' }}
        >
          {HAYQ_CONTRACTS.HAYQ_TOKEN}
        </a>
      </div>

      {/* Status messages */}
      {status === 'success' && (
        <div style={{
          background: 'rgba(29,158,117,0.1)', border: '1px solid #1D9E75',
          borderRadius: '8px', padding: '12px', marginBottom: '16px',
          fontSize: '13px',
        }}>
          ✅ Verified! HAYQ Premium activated.<br />
          Wallet: {info.address?.slice(0,6)}...{info.address?.slice(-4)}<br />
          Balance: {info.walletBalance?.toFixed(2)} HAYQ
          {(info.stakedBalance ?? 0) > 0 &&
            ` + ${info.stakedBalance?.toFixed(2)} staked`}
        </div>
      )}

      {status === 'insufficient' && (
        <div style={{
          background: 'rgba(255,165,0,0.1)', border: '1px solid orange',
          borderRadius: '8px', padding: '12px', marginBottom: '16px',
          fontSize: '13px',
        }}>
          ⚠️ Insufficient balance<br />
          Your total: {info.totalBalance?.toFixed(2)} HAYQ<br />
          Need: {(HAYQ_REQUIRED_BALANCE - (info.totalBalance ?? 0)).toFixed(2)} more HAYQ<br />
          
            href={explorerUrl(HAYQ_CONTRACTS.HAYQ_TOKEN)}
            target="_blank" rel="noopener noreferrer"
            style={{ color: '#7F77DD' }}
          >
            Get HAYQ tokens →
          </a>
        </div>
      )}

      {status === 'error' && (
        <div style={{
          background: 'rgba(255,0,0,0.08)', border: '1px solid red',
          borderRadius: '8px', padding: '12px', marginBottom: '16px',
          fontSize: '13px', color: '#ff6b6b',
        }}>
          ❌ {info.error}
        </div>
      )}

      {/* Button */}
      {status !== 'success' && (
        <button
          onClick={handleConnect}
          disabled={status === 'checking'}
          style={{
            width: '100%', padding: '12px',
            background: status === 'checking' ? '#534AB7' : '#7F77DD',
            border: 'none', borderRadius: '8px',
            cursor: status === 'checking' ? 'default' : 'pointer',
            color: '#fff', fontWeight: 600, fontSize: '14px',
          }}
        >
          {status === 'checking'
            ? 'Checking wallet...'
            : status === 'insufficient'
            ? 'Recheck Balance'
            : 'Connect MetaMask & Verify'}
        </button>
      )}

      {/* Staking note */}
      <div style={{
        marginTop: '12px', fontSize: '11px',
        color: 'var(--color-text-secondary)', textAlign: 'center',
      }}>
        Wallet + Staked balance count toward requirement.<br />
        Staking contract:{' '}
        
          href={explorerUrl(HAYQ_CONTRACTS.STAKING)}
          target="_blank" rel="noopener noreferrer"
          style={{ color: '#7F77DD' }}
        >
          View on Etherscan
        </a>
      </div>
    </div>
  );
}