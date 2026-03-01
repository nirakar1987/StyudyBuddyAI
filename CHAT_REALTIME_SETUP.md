# Chat – Real-time (WhatsApp-style) Setup

The app chat now shows messages in real time using:

1. **Optimistic updates** – Your own messages appear immediately when you send.
2. **Supabase Realtime** – New messages from others appear live when Realtime is enabled.
3. **Polling fallback** – Every 3 seconds the app fetches new messages, so even without Realtime you still see new messages (like WhatsApp).

---

## Enable instant delivery (optional)

For **instant** delivery (no 3-second delay) for other users’ messages:

1. In **Supabase Dashboard** go to **Database** → **Replication**.
2. Find **chat_messages** in the list.
3. Turn **on** replication for **chat_messages** (so it’s in the `supabase_realtime` publication).

After this, the existing Realtime subscription in the app will receive INSERTs on `chat_messages` and new messages will show up immediately. If Realtime is not enabled, the 3-second polling still keeps the chat in sync.

---

## Tables and RLS (required for history after refresh)

- **chat_messages** – `id`, `channel_id`, `sender_id`, `content`, `sender_payload` (jsonb), `created_at`.

**If after refresh you only see new messages (no old history), RLS is likely blocking SELECT.** Run this in Supabase **SQL Editor**:

```sql
-- Allow authenticated users to read all messages in community chat or in a DM they're part of
CREATE POLICY "Users can read chat messages in their channels"
ON chat_messages FOR SELECT
TO authenticated
USING (
  channel_id = 'community-chat'
  OR (channel_id LIKE 'dm-%' AND position(auth.uid()::text in channel_id) > 0)
);

-- Allow authenticated users to send messages (insert)
CREATE POLICY "Users can insert own chat messages"
ON chat_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);
```

If policies already exist with different names, drop them first or adjust the names. After this, **full history** loads on refresh and polling keeps new messages in sync.
