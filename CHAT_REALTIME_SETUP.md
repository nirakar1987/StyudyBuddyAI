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

## Tables and RLS

- **chat_messages** – `id`, `channel_id`, `sender_id`, `content`, `sender_payload` (jsonb), `created_at`.
- RLS must allow **SELECT** and **INSERT** for authenticated users (e.g. allow SELECT for messages in channels the user is in; allow INSERT for own messages).
