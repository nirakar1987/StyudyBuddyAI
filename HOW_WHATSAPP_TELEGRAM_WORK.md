# How WhatsApp and Telegram Work in StudyBuddy

Quick reference so you can see both features working.

---

## Where to open the settings

1. Log in as a **student**.
2. Go to **Dashboard** (home after login).
3. At the top you’ll see a green bar: **“Send activity to parent”** → tap it.  
   Or use the **Parent** card in Quick Actions.
4. You’re on **Parent Notifications**. Here you set up WhatsApp and/or Telegram.

---

## WhatsApp (manual share)

**How it works:** You share the result yourself after each quiz. No backend setup.

**Steps:**

1. On **Parent Notifications**, in the **WhatsApp** section, enter the parent’s number with country code (e.g. `919876543210`), tap **Save**.
2. Do a quiz (Upload → generate → take quiz).
3. On the **Quiz Results** screen, scroll down to **“Share & Save Results”**.
4. Under **“Send to parent (WhatsApp or Telegram)”** tap **Share to WhatsApp**.  
   WhatsApp (app or web) opens with the result message; you send it to the saved number (or choose a contact if no number was saved).

**If you don’t see the button:** Make sure you’re on the **Quiz Results** screen (after submitting the quiz), not on the dashboard. The WhatsApp/Telegram buttons are only on the results page.

---

## Telegram (automatic updates)

**How it works:** Once the parent is linked via the bot, they get a Telegram message **automatically** when you finish a quiz or a practice problem. No tap needed after each activity.

**What you need first (one-time):**

- A Telegram bot (from [@BotFather](https://t.me/BotFather)).
- In **Supabase**: `TELEGRAM_BOT_TOKEN` in Edge Function secrets; deploy **notify-parent** and **telegram-webhook**; set the webhook to your `telegram-webhook` function URL.
- In **Supabase**: run the migration that adds `parent_link_codes` and `parent_telegram_chat_id` on `profiles` (see `supabase/migrations/parent_and_telegram_schema.sql` or `PARENT_NOTIFICATIONS_SETUP.md`).

**Steps in the app:**

1. On **Parent Notifications**, in the **Telegram** section, tap **Generate 6-digit code**.
2. Parent opens your bot in Telegram (link shown on the same page), taps **Start**.
3. Parent sends **one message:** `/start` then a **space** then the 6-digit code, e.g. `/start 482917`.
4. Back in the app, tap **“I’ve connected – refresh”**. You should see “Parent linked” (or “Telegram connected!”).
5. From now on, when you **complete a quiz** or **answer a practice problem**, the parent gets a Telegram message automatically.

**If Telegram never sends:**

- Check Supabase Edge Function logs for **notify-parent** and **telegram-webhook**.
- Confirm the webhook is set: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/telegram-webhook`.
- Confirm the secret `TELEGRAM_BOT_TOKEN` is set in Supabase.
- Make sure the parent sent `/start CODE` in **one** message (with a space).

---

## Summary

| Feature   | When parent gets it                         | Where you see it in the app                    |
|----------|---------------------------------------------|-----------------------------------------------|
| WhatsApp | When you tap **Share to WhatsApp**          | Quiz Results → Share & Save Results            |
| Telegram | Automatically after each quiz/practice      | No extra tap; parent receives in Telegram     |

If nothing seems to work: (1) Confirm you’re on **Quiz Results** for WhatsApp. (2) For Telegram, confirm bot + webhook + DB and that the parent linked with `/start CODE` and you tapped refresh.
