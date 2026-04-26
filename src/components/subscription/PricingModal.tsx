// PricingModal.tsx — HAYQ Pro Plan Selector UI

import { useState } from 'react';
import { PLANS, createStripeCheckout } from '@/lib/subscriptionService';
import { checkHayqTokenBalance } from '@/lib/hayqTokenService';
import { explorerUrl, HAYQ_CONTRACTS } from '@/lib/hayqContracts';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: string;
  userId: string;
  userEmail: string;
  supabaseUrl: string;
  anonKey: string;
}

export default function PricingModal({
  isOpen, onClose, currentTier, userId, userEmail,
  supabaseUrl, anonKey,
}: PricingModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [tokenResult, setTokenResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleStripe = async () => {
    setLoading('stripe');
    const result = await createStripeCheckout(
      supabaseUrl, anonKey, userId, userEmail
    );
    if (result?.url) {
      window.location.href = result.url;
    } else {
      alert('Checkout error. Try again.');
    }
    setLoading(null);
  };

  const handleTokenCheck = async () => {
    setLoading('token');
    const result = await checkHayqTokenBalance();
    setTokenResult(result);
    setLoading(null);

    if (result.hasEnough) {
      // Save to Supabase
      await fetch(`${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${userId}`, {
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
        }),
      });
      window.location.reload();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'var(--color-background-primary)',
        borderRadius: '16px', padding: '32px',
        width: '100%', maxWidth: '720px',
        border: '1px solid var(--color-border-tertiary)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 500 }}>
              HAYQ Pro — Choose Plan
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              Current: <strong>{currentTier}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-secondary)', fontSize: '20px',
          }}>✕</button>
        </div>

        {/* Plans grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          {/* Free */}
          <div style={{
            border: '1px solid var(--color-border-tertiary)',
            borderRadius: '12px', padding: '20px',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              FREE
            </div>
            <div style={{ fontSize: '24px', fontWeight: 500, marginBottom: '12px' }}>$0</div>
            <ul style={{ padding: '0 0 0 16px', margin: '0 0 16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {PLANS.free.features.map(f => (
                <li key={f} style={{ marginBottom: '4px' }}>{f}</li>
              ))}
            </ul>
            <button disabled style={{
              width: '100%', padding: '8px',
              background: 'var(--color-background-secondary)',
              border: '1px solid var(--color-border-tertiary)',
              borderRadius: '8px', cursor: 'default', fontSize: '13px',
              color: 'var(--color-text-secondary)',
            }}>
              {currentTier === 'free' ? 'Current Plan' : 'Downgrade'}
            </button>
          </div>

          {/* Pro */}
          <div style={{
            border: '2px solid #1D9E75',
            borderRadius: '12px', padding: '20px', position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
              background: '#1D9E75', color: '#fff', padding: '2px 12px',
              borderRadius: '20px', fontSize: '11px',
            }}>
              MOST POPULAR
            </div>
            <div style={{ fontSize: '12px', color: '#0F6E56', marginBottom: '4px' }}>PRO</div>
            <div style={{ fontSize: '24px', fontWeight: 500, marginBottom: '12px' }}>
              $15<span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>/mo</span>
            </div>
            <ul style={{ padding: '0 0 0 16px', margin: '0 0 16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {PLANS.pro.features.map(f => (
                <li key={f} style={{ marginBottom: '4px' }}>{f}</li>
              ))}
            </ul>
            <button
              onClick={handleStripe}
              disabled={!!loading || currentTier === 'pro'}
              style={{
                width: '100%', padding: '8px',
                background: loading === 'stripe' ? '#0F6E56' : '#1D9E75',
                border: 'none', borderRadius: '8px',
                cursor: loading || currentTier === 'pro' ? 'default' : 'pointer',
                color: '#fff', fontSize: '13px', fontWeight: 500,
              }}
            >
              {loading === 'stripe' ? 'Redirecting...' :
               currentTier === 'pro' ? 'Current Plan' : 'Subscribe with Stripe'}
            </button>
          </div>

          {/* HAYQ Premium */}
          <div style={{
            border: '2px solid #7F77DD',
            borderRadius: '12px', padding: '20px', position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
              background: '#7F77DD', color: '#fff', padding: '2px 12px',
              borderRadius: '20px', fontSize: '11px',
            }}>
              TOKEN HOLDERS
            </div>
            <div style={{ fontSize: '12px', color: '#534AB7', marginBottom: '4px' }}>HAYQ PREMIUM</div>
            <div style={{ fontSize: '24px', fontWeight: 500, marginBottom: '4px' }}>Free</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
              Hold ≥100 HAYQ tokens
            </div>
            <ul style={{ padding: '0 0 0 16px', margin: '0 0 12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {PLANS.hayq_premium.features.map(f => (
                <li key={f} style={{ marginBottom: '4px' }}>{f}</li>
              ))}
            </ul>

            {/* Token check result */}
            {tokenResult && (
              <div style={{
                marginBottom: '12px', padding: '8px',
                background: tokenResult.hasEnough
                  ? 'var(--color-background-success)'
                  : 'var(--color-background-warning)',
                borderRadius: '6px', fontSize: '12px',
              }}>
                {tokenResult.error ? (
                  <span style={{ color: 'var(--color-text-danger)' }}>
                    {tokenResult.error}
                  </span>
                ) : (
                  <span>
                    Wallet: {tokenResult.address?.slice(0,6)}...{tokenResult.address?.slice(-4)}<br/>
                    Balance: {tokenResult.walletBalance?.toFixed(2)} HAYQ
                    {tokenResult.stakedBalance! > 0 && (
                      <> + {tokenResult.stakedBalance?.toFixed(2)} staked</>
                    )}<br/>
                    {tokenResult.hasEnough
                      ? '✅ Unlocked!'
                      : `❌ Need ${100 - (tokenResult.totalBalance ?? 0)} more HAYQ`}
                  </span>
                )}
              </div>
            )}

            <button
              onClick={handleTokenCheck}
              disabled={!!loading || currentTier === 'hayq_premium'}
              style={{
                width: '100%', padding: '8px',
                background: loading === 'token' ? '#534AB7' : '#7F77DD',
                border: 'none', borderRadius: '8px',
                cursor: loading ? 'default' : 'pointer',
                color: '#fff', fontSize: '13px', fontWeight: 500,
                marginBottom: '8px',
              }}
            >
              {loading === 'token' ? 'Checking...' :
               currentTier === 'hayq_premium' ? 'Active' : 'Connect Wallet & Verify'}
            </button>

            
              href={explorerUrl(HAYQ_CONTRACTS.HAYQ_TOKEN)}
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '11px', color: '#7F77DD', display: 'block', textAlign: 'center' }}
            >
              View HAYQ Token on Etherscan ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}