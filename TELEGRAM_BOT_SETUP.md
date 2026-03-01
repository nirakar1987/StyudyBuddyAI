# Get Your Telegram Bot Working (Step-by-Step)

You created the bot in BotFather. Now do these **3 things** so it actually works.

---

## Step 1: Add the bot token in Supabase

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and open your **StudyBuddy** project.
2. Click the **gear icon** (Project Settings) in the left sidebar.
3. Click **Edge Functions** in the left menu.
4. Find **Secrets** (or **Function Secrets**).
5. Click **Add secret** or **New secret**.
6. **Name:** `TELEGRAM_BOT_TOKEN`  
   **Value:** paste your bot token from BotFather (e.g. `8793306861:AAH4bCedSjPc0ujMeg_0Z4v6Rn5IFziTOnw`).
7. Save.

---

## Step 2: Deploy the Telegram function in Supabase

Your bot needs a **webhook** – a URL that receives messages. That URL is a Supabase Edge Function. You have to deploy it once.

1. Install Supabase CLI if you don’t have it:
   ```bash
   npm install -g supabase
   ```
2. Open a terminal in your project folder (where `supabase/functions` is):
   ```bash
   cd C:\Linux_Application\StudyBuddy
   ```
3. Log in and link your project (your Project ID is `exyefpzjknrgyyunsxyb`):
   ```bash
   supabase login
   supabase link --project-ref exyefpzjknrgyyunsxyb
   ```
4. Deploy the Telegram webhook function:
   ```bash
   supabase functions deploy telegram-webhook
   supabase functions deploy notify-parent
   ```
5. When it says “Deployed successfully”, note the function URL. It will look like:
   `https://YOUR_PROJECT_REF.supabase.co/functions/v1/telegram-webhook`

---

## Step 3: Tell Telegram to use your webhook

Your webhook URL is:
```
https://exyefpzjknrgyyunsxyb.supabase.co/functions/v1/telegram-webhook
```

Telegram must send all messages there. Do this **once** (replace `YOUR_BOT_TOKEN` with your real token from BotFather):

**In PowerShell (Windows):**
```powershell
$token = "YOUR_BOT_TOKEN"
Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook?url=https://exyefpzjknrgyyunsxyb.supabase.co/functions/v1/telegram-webhook"
```

**Or in browser:**  
Open this URL (replace `YOUR_BOT_TOKEN` with your token):
```
https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://exyefpzjknrgyyunsxyb.supabase.co/functions/v1/telegram-webhook
```

You should see: `{"ok":true,"result":true}`.

---

## Step 4: Database (one-time)

In Supabase: **SQL Editor** → New query → paste and run the contents of  
`supabase/migrations/parent_and_telegram_schema.sql`  
(from your project).  
This creates the `parent_link_codes` table and the `parent_telegram_chat_id` column on `profiles`.

---

## Test

1. In your app (student): **Dashboard** → **Send activity to parent** → **Generate 6-digit code** (e.g. 482917).
2. In **Telegram**: open your bot (e.g. @StudyBuddyParentbot) → tap **Start**.
3. Send **one message only**: type <code>/start</code> then a **space** then the 6-digit code.  
   Example: <code>/start 482917</code>  
   (Do not send "/start" and "482917" as two separate messages.)
4. Bot should reply: **"✅ You're linked! You'll receive activity updates..."**

If you get that message, the bot is working. Then in the app click **“I've connected – refresh”** and complete a quiz; the parent should get a Telegram message.

---

## Quick checklist

| Done? | What |
|-------|------|
| ☐ | Token added in Supabase → Edge Functions → Secrets as `TELEGRAM_BOT_TOKEN` |
| ☐ | `supabase functions deploy telegram-webhook` and `notify-parent` run successfully |
| ☐ | `setWebhook` called with your webhook URL (Step 3) |
| ☐ | Migration SQL run in Supabase (parent_link_codes, parent_telegram_chat_id) |

If something fails, say which step (1, 2, 3, or 4) and the exact error or what you see.
