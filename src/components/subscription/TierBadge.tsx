// TierBadge.tsx — shows current plan badge in UI

import type { PlanTier } from '@/lib/subscriptionService';

const CONFIG: Record<PlanTier, { label: string; bg: string; color: string }> = {
  free:          { label: 'Free',         bg: '#3a3a3a', color: '#aaa' },
  pro:           { label: 'Pro',          bg: '#0F6E56', color: '#fff' },
  hayq_premium:  { label: 'HAYQ Premium', bg: '#534AB7', color: '#fff' },
};

export default function TierBadge({ tier }: { tier: PlanTier }) {
  const { label, bg, color } = CONFIG[tier];
  return (
    <span style={{
      padding: '2px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: 600,
      background: bg, color,
      letterSpacing: '0.5px',
    }}>
      {label}
    </span>
  );
}