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

## Technical flow: quiz submit → Telegram

1. **Student submits quiz**  
   In the app, `App.tsx` → `handleSubmitQuiz()` runs when the student finishes the quiz.

2. **Build message**  
   The app builds a short summary with `buildActivityMessage('quiz_complete', { studentName, subject, grade, score, total, topics })` from `services/parentNotificationService.ts`.

3. **Call Edge Function**  
   The app calls `notifyParentViaTelegram(user.id, 'quiz_complete', summary)`, which invokes the Supabase Edge Function **notify-parent** with body: `{ userId, eventType: 'quiz_complete', summary }`.  
   `userId` = the **student’s** Supabase auth id.

4. **Edge Function (notify-parent)**  
   - Reads `TELEGRAM_BOT_TOKEN` from Supabase secrets.  
   - Uses the **service role** to load the student’s profile: `profiles.parent_telegram_chat_id` (and name) for that `userId`.  
   - If `parent_telegram_chat_id` is set (parent linked via the bot), it sends the message to Telegram’s `sendMessage` API for that chat id.  
   - Optional: if `ADMIN_TELEGRAM_CHAT_ID` is set in secrets, a copy is sent to the admin.

5. **Parent receives**  
   The parent gets a Telegram message from your bot with the quiz result (student name, subject, score, topics).

**Requirement:** The student’s profile must have `parent_telegram_chat_id` set. That happens when the parent sends `/start CODE` to your bot and the **telegram-webhook** Edge Function runs, which looks up the code in `parent_link_codes`, finds the student’s `user_id`, and updates `profiles.parent_telegram_chat_id` for that user.

---

## Summary

| What                | How                                        |
|---------------------|--------------------------------------------|
| Parent notifications | **Automatic** via Telegram only            |
| When parent gets it | After each quiz completion or practice     |
| Manual share        | Removed (no “Share to WhatsApp” / “Copy for Telegram” buttons) |
