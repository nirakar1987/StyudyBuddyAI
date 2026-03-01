# Parent Notifications (WhatsApp & Telegram) – Setup

Parents can get activity updates when the student completes a quiz or practice session.

## WhatsApp (no backend)

- Student goes to **Dashboard → Parent** (or **Parent notifications**).
- Saves parent’s phone with country code (e.g. `919876543210`).
- After each quiz, **Share to WhatsApp** opens WhatsApp with a pre-filled message (to that number if set, or to “choose contact” otherwise).

No API keys or backend needed for this flow.

---

## Telegram (automatic updates)

To send automatic Telegram messages to the parent when the student completes a quiz or practice:

### 1. Create a Telegram bot

- In Telegram, open [@BotFather](https://t.me/BotFather).
- Send `/newbot`, choose a name (e.g. “StudyBuddy Parent”).
- Copy the **bot token** (e.g. `123456:ABC-DEF...`).

### 2. Supabase: secrets and Edge Functions

In Supabase Dashboard → Project Settings → Edge Functions → Secrets, add:

- `TELEGRAM_BOT_TOKEN` = your bot token

Deploy the Edge Functions (from project root):

```bash
supabase functions deploy notify-parent
supabase functions deploy telegram-webhook
```

Set the Telegram webhook (replace `YOUR_PROJECT_REF` and `YOUR_ANON_OR_SERVICE_KEY` if required by your setup):

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://YOUR_PROJECT_REF.supabase.co/functions/v1/telegram-webhook"
```

### 3. Database

**Profiles table** – add columns (if not present):

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS parent_telegram_chat_id TEXT,
  ADD COLUMN IF NOT EXISTS parent_phone TEXT;
```

**Link codes table** (for parent linking their Telegram to the student):

```sql
CREATE TABLE IF NOT EXISTS parent_link_codes (
  code TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Optional: RLS so only the app (service role) can read/write
ALTER TABLE parent_link_codes ENABLE ROW LEVEL SECURITY;
-- Add policies as needed for your app (e.g. allow authenticated users to insert/select their own rows).
```

### 4. Bot username in the app

In `components/ParentNotificationsView.tsx`, set `TELEGRAM_BOT_USERNAME` to your bot’s username (e.g. `StudyBuddyParentBot`), without `@`.

### 5. Flow

- Student: **Dashboard → Parent** → **Generate 6-digit code**.
- Parent: In Telegram, opens your bot, sends `/start <CODE>`.
- Bot (webhook) links their `chat_id` to the student’s profile.
- When the student completes a quiz or practice, the app calls the `notify-parent` Edge Function, which sends a Telegram message to that `chat_id`.

---

## Summary

| Feature              | WhatsApp                    | Telegram (auto)                    |
|----------------------|----------------------------|------------------------------------|
| Setup                | Parent phone in app        | Bot + Supabase secrets + DB        |
| When parent gets it  | When student taps “Share to WhatsApp” | Automatically after quiz/practice |
| Backend required     | No                         | Yes (Edge Functions + bot token)   |
