-- ============================================================
-- StudyBuddy: Chat messages – full history visible after refresh
-- Run in Supabase Dashboard → SQL Editor if chat history is empty after refresh
-- ============================================================

-- Create table if not present (adjust columns to match your app)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender_payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if you already have conflicting ones (uncomment if needed):
-- DROP POLICY IF EXISTS "Users can read chat messages in their channels" ON chat_messages;
-- DROP POLICY IF EXISTS "Users can insert own chat messages" ON chat_messages;

-- Allow authenticated users to read all messages in community chat or in a DM they're part of
CREATE POLICY "Users can read chat messages in their channels"
ON chat_messages FOR SELECT
TO authenticated
USING (
  channel_id = 'community-chat'
  OR (channel_id LIKE 'dm-%' AND position(auth.uid()::text in channel_id) > 0)
);

-- Allow authenticated users to send messages
CREATE POLICY "Users can insert own chat messages"
ON chat_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Optional: enable Realtime for instant delivery (or enable in Dashboard → Database → Replication)
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
