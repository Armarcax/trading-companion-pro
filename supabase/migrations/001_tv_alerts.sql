-- TradingView alerts table
CREATE TABLE IF NOT EXISTS tv_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  ticker TEXT NOT NULL,
  price DECIMAL,
  strategy TEXT,
  comment TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow edge functions to insert
ALTER TABLE tv_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can insert" ON tv_alerts FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Authenticated can read" ON tv_alerts FOR SELECT TO authenticated USING (true);
