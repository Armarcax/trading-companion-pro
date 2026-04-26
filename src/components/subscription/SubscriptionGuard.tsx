// SubscriptionGuard.tsx — wraps features that need Pro/Premium

import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import PricingModal from './PricingModal';

interface SubscriptionGuardProps {
  userId: string;
  userEmail: string;
  requiredTier: 'pro' | 'hayq_premium';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function SubscriptionGuard({
  userId, userEmail, requiredTier, children, fallback,
}: SubscriptionGuardProps) {
  const { tier, isLoading } = useSubscription(userId);
  const [showPricing, setShowPricing] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

  const hasAccess =
    tier === 'hayq_premium' ||
    (requiredTier === 'pro' && (tier === 'pro' || tier === 'hayq_premium'));

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px', color: 'var(--color-text-secondary)',
      }}>
        Loading...
      </div>
    );
  }

  if (hasAccess) return <>{children}</>;

  return (
    <>
      {fallback ?? (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '48px 24px', gap: '16px',
          border: '1px dashed var(--color-border-tertiary)',
          borderRadius: '12px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px' }}>🔒</div>
          <div style={{ fontWeight: 500 }}>Pro Feature</div>
          <div style={{
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
            maxWidth: '280px',
          }}>
            This feature requires a Pro or HAYQ Premium subscription.
          </div>
          <button
            onClick={() => setShowPricing(true)}
            style={{
              padding: '10px 24px',
              background: '#1D9E75', color: '#fff',
              border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 500,
            }}
          >
            Upgrade Plan
          </button>
        </div>
      )}
      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        currentTier={tier}
        userId={userId}
        userEmail={userEmail}
        supabaseUrl={supabaseUrl}
        anonKey={anonKey}
      />
    </>
  );
}