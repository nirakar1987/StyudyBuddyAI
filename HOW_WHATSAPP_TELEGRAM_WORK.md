# Automatic Parent Notifications (Telegram)

Parents get activity updates **automatically** when the student completes a quiz or a practice problem. No manual share buttons – link once, then messages are sent by the app.

---

## Where to set it up

1. Log in as a **student**.
2. Go to **Dashboard** (or tap **Parent** in the bottom nav on mobile).
3. Tap the green bar **“Send activity to parent”** or the **Parent** quick action.
4. You’re on **Parent Notifications**. Use the **Telegram** section only (manual WhatsApp/Telegram share options have been removed).

---

## How automatic Telegram works

Once the parent is linked via the bot, they get a Telegram message **automatically** when the student finishes a quiz or a practice problem. No button to tap after each activity.

### One-time setup (you need)

- A Telegram bot (from [@BotFather](https://t.me/BotFather)).
- In **Supabase**: add `TELEGRAM_BOT_TOKEN` in Edge Function secrets; deploy **notify-parent** and **telegram-webhook**; set the webhook to your `telegram-webhook` function URL.
- In **Supabase**: run the migration that adds `parent_link_codes` and `parent_telegram_chat_id` on `profiles` (see `supabase/migrations/parent_and_telegram_schema.sql` or `PARENT_NOTIFICATIONS_SETUP.md`).

### In the app

1. On **Parent Notifications**, in the **Telegram** section, tap **Generate 6-digit code**.
2. Parent opens your bot in Telegram (link on the same page), taps **Start**.
3. Parent sends **one message:** `/start` then a **space** then the 6-digit code, e.g. `/start 482917`.
4. Back in the app, tap **“I’ve connected – refresh”**. You should see “Parent linked” (or “Telegram connected!”).
5. From then on, when the student **completes a quiz** or **answers a practice problem**, the parent gets a Telegram message automatically.

### If Telegram never sends

- Check Supabase Edge Function logs for **notify-parent** and **telegram-webhook**.
- Confirm the webhook is set: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/telegram-webhook`.
- Confirm the secret `TELEGRAM_BOT_TOKEN` is set in Supabase.
- Make sure the parent sent `/start CODE` in **one** message (with a space).

---

## Summary

| What                | How                                        |
|---------------------|--------------------------------------------|
| Parent notifications | **Automatic** via Telegram only            |
| When parent gets it | After each quiz completion or practice     |
| Manual share        | Removed (no “Share to WhatsApp” / “Copy for Telegram” buttons) |
