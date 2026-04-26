import { useState } from 'react';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';

function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL ?? '';
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
  return url.startsWith('https://') && !url.includes('YOUR_') && !url.includes('your_') && key.length > 20;
}

export function SetupBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (isSupabaseConfigured() || dismissed) return null;
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center gap-3 text-sm shrink-0">
      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
      <span className="text-amber-700 dark:text-amber-400 flex-1 text-xs">
        <strong>Demo ռեժիմ</strong> — Supabase կարգավորված չէ։ Բոտն աշխատում է mock data-ով։
        Իրական բորսաներ կապելու համար ավելացրեք{' '}
        <code className="bg-amber-500/20 px-1 rounded">VITE_SUPABASE_URL</code> .env ֆայլում։
      </span>
      <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer"
        className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 shrink-0 text-xs">
        Supabase <ExternalLink className="h-3 w-3" />
      </a>
      <button onClick={() => setDismissed(true)} className="text-amber-500 hover:text-amber-700 shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
