# How StudyBuddy AI Works

## 1. Entry point

- **Landing page** → User clicks **“Begin Your Journey”**.
- If **not logged in** → goes to **Sign In / Sign Up** (email+password or Google).
- If **logged in** → app loads profile and goes to Dashboard or Parent Dashboard.

---

## 2. After login: profile check

On login, the app calls Supabase and checks **profiles**:

| If profile… | Then |
|-------------|------|
| **Student profile** (or no `role` / `role = 'student'`) | Load name, grade, subject, score, streak → show **Student Dashboard**. |
| **Parent profile** (`role = 'parent'`) | Load parent name, phone → show **Parent Dashboard** (My Children, Activity, WhatsApp/Telegram, Logout). |
| **No profile** | Show **“Create your profile”** → choose **Student** or **Parent** → complete setup, then go to Dashboard or Parent Dashboard. |

---

## 3. Student flow

- **Dashboard**: Green bar **“Send activity to parent”** (top), hero with points/streak, **Quick Actions** (Learn, Quiz, **Parent**, Practice, Videos, etc.), Chapter Mastery, Recent Activity.
- **Learn** → AI lesson (Gemini chat).
- **Quiz** → Upload materials or use Book Quiz → AI generates questions → student answers → results; **Share to WhatsApp** / **Copy for Telegram** on results.
- **Parent** → Parent Notifications: set parent phone (WhatsApp), **Telegram** (steps + “Open @StudyBuddyParentbot”), **Invite parent** (6-digit code for parent account).
- **Practice** → AI gives a problem → student answers → feedback; parent can get Telegram notification if linked.
- Quiz attempts and profile (score, streak) are saved to **Supabase** (quiz_history, profiles).

---

## 4. Parent flow

- **Parent Dashboard**: Home, **My Children**, **Activity**, **WhatsApp / Telegram**, Logout.
- **My Children**: List of linked children (from invite code); **Add child** with 6-digit code from student app.
- **Activity**: Select a child → see their **quiz history** (subject, score %, date) from Supabase.
- **WhatsApp / Telegram**: Set parent’s phone for WhatsApp; note about Telegram (bot link is in student app).

---

## 5. How data is stored (Supabase)

| Table / use | Purpose |
|-------------|--------|
| **auth.users** | Login (Supabase Auth). |
| **profiles** | One row per user: student (name, grade, subject, score, streak, theme, parent_phone, parent_telegram_chat_id, role) or parent (full_name, role=parent, parent_phone, parent_telegram_chat_id). |
| **quiz_history** | Each quiz attempt (user_id, subject, score, total, questions, topics, created_at). |
| **parent_link_codes** | 6-digit codes for Telegram: parent sends `/start CODE` to bot → bot links chat_id to student’s profile. |
| **parent_children** | Links parent user id to student user ids (for Parent Dashboard). |
| **parent_invite_codes** | 6-digit codes so parent can link when signing up. |
| **chat_messages** | Global/peer chat (if used). |

---

## 6. Env vars (Vercel / local)

- **GEMINI_API_KEY** – Used by the frontend to call Gemini (quizzes, lessons, practice, etc.).
- **SUPABASE_URL** – Supabase project URL; app uses it for auth and all tables above.
- **SUPABASE_ANON_KEY** – Supabase anon key; app uses it for auth and API calls.

Supabase **Edge Functions** (Telegram bot) use **TELEGRAM_BOT_TOKEN** in **Supabase** project secrets (not in Vercel).

---

## 7. Quick test checklist

1. **Student sign up** → Choose Student → set name, grade, subject → Dashboard with green “Send activity to parent” bar.
2. **Quiz** → Upload or Book Quiz → answer → see results and “Share to WhatsApp” / “Copy for Telegram”.
3. **Parent sign up** (new email) → Choose Parent → name + optional invite code → Parent Dashboard → My Children, Activity, Notifications.
4. **Telegram** (if bot is set up): Student generates 6-digit code → Parent opens @StudyBuddyParentbot → `/start CODE` → after refresh, parent gets automatic activity messages.

If something doesn’t work, check: Supabase tables and RLS (see `supabase/migrations/parent_and_telegram_schema.sql`), env vars in Vercel, and that the Telegram webhook is set if you use the bot.
