# Telegram not working – fix checklist

Follow these in order. Telegram will work only when **all** are done.

---

## 1. Bot token in Supabase (Edge Functions)

- Open **Supabase Dashboard** → your project → **Project Settings** (gear) → **Edge Functions**.
- Under **Secrets**, add:
  - **Name:** `TELEGRAM_BOT_TOKEN`
  - **Value:** your bot token from BotFather (e.g. `8793306861:AAH4bCedSjPc0ujMeg_0Z4v6Rn5IFziTOnw`).
- Save.

---

## 2. Deploy Edge Functions

From your project root (where `supabase/` lives):

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy telegram-webhook
npx supabase functions deploy notify-parent
```

Replace `YOUR_PROJECT_REF` with your Supabase project ID (from the dashboard URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`).

---

## 3. Set Telegram webhook

Telegram must send updates to your function URL. Run **one** of these (replace placeholders):

**Option A – PowerShell (Windows):**
```powershell
$token = "YOUR_BOT_TOKEN"
$url = "https://YOUR_PROJECT_REF.supabase.co/functions/v1/telegram-webhook"
Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook?url=$url" -Method Get
```

**Option B – curl (Git Bash / WSL / Mac):**
```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://YOUR_PROJECT_REF.supabase.co/functions/v1/telegram-webhook"
```

**Replace:**
- `YOUR_BOT_TOKEN` = token from BotFather
- `YOUR_PROJECT_REF` = Supabase project ID (e.g. `exyefpzjknrgyyunsxyb`)

You should see: `{"ok":true,"result":true,"description":"Webhook was set"}`.

**Check current webhook:**
```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

---

## 4. Database

In Supabase **SQL Editor**, run the migration so these exist:

- Table **parent_link_codes** (columns: `code`, `user_id`, `expires_at`)
- Table **profiles** has column **parent_telegram_chat_id**

Use: `supabase/migrations/parent_and_telegram_schema.sql` (run its contents in SQL Editor).

---

## 5. Test the flow

1. **Student:** Log in → Dashboard → green bar **“Send activity to parent”** → **Generate 6-digit code**.
2. **Parent (in Telegram):** Open @StudyBuddyParentbot → **Start** → send **one message**: `/start 482917` (slash, start, space, then the real code – not two messages).
3. Bot should reply: “✅ You're linked!…”
4. **Student:** In the app, tap **“I've connected – refresh”** so the app sees the link.
5. **Student:** Complete a quiz or a practice problem; parent should get a Telegram message (if `notify-parent` is deployed and token is set).

---

## 6. If it still doesn’t work

- **No reply from bot when parent sends /start CODE**  
  - Webhook not set or wrong URL → repeat step 3 and check `getWebhookInfo`.  
  - Function not deployed or wrong project → repeat step 2.

- **“Invalid or expired code”**  
  - Code is old (codes expire in 15 minutes) → generate a new code in the app.  
  - Table `parent_link_codes` missing or empty → run migration (step 4).

- **Linked but no activity messages**  
  - `TELEGRAM_BOT_TOKEN` not set in Supabase secrets or `notify-parent` not deployed → step 1 and 2.  
  - In Supabase **Edge Functions** → **Logs**, check for errors when the student finishes a quiz.

- **“TELEGRAM_BOT_TOKEN not set”** in logs  
  - Add the secret in Supabase (step 1), then redeploy the function (step 2).
