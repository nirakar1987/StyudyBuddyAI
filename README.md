<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1zqEcQNHamyMeo-sY9bZyCueFixd1g2at

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env and add your keys:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and set:
   - **GEMINI_API_KEY** – your Gemini API key
   - **SUPABASE_URL** – use the **API** URL from Supabase → Project Settings → API: `https://YOUR_PROJECT_REF.supabase.co` (not the dashboard URL like `supabase.com/dashboard/project/...`; wrong URL causes 404 after Google login)
   - **SUPABASE_ANON_KEY** – from Supabase → Project Settings → API (anon public key)
3. Run the app:
   ```bash
   npm run dev
   ```

## Supabase setup (auth, parent, Telegram)

1. **Redirect URLs (Google login):** In Supabase → **Authentication → URL Configuration**, set **Site URL** to your app (e.g. `https://studybuddyclasses.vercel.app`) and add the same URL under **Redirect URLs** so Google sign-in returns to your app instead of 404.
2. In Supabase **SQL Editor**, run the migration:  
   `supabase/migrations/parent_and_telegram_schema.sql`
3. For Telegram auto-notifications: in Supabase **Project Settings → Edge Functions → Secrets**, add **TELEGRAM_BOT_TOKEN** (your bot token from BotFather). Then deploy:
   ```bash
   npx supabase functions deploy telegram-webhook
   npx supabase functions deploy notify-parent
   ```
   Set the webhook URL as in `PARENT_NOTIFICATIONS_SETUP.md`.  
   **See [HOW_WHATSAPP_TELEGRAM_WORK.md](HOW_WHATSAPP_TELEGRAM_WORK.md)** for step-by-step: where to tap so WhatsApp and Telegram actually work in the app.
