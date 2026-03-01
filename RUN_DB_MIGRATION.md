# How to Run the Parent / Telegram DB Migration

This adds the tables and columns needed for automatic parent notifications (Telegram) and parent accounts.

---

## Option 1: Supabase Dashboard (recommended)

1. **Open your project**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard) and open project **exyefpzjknrgyyunsxyb** (or your StudyBuddy project).

2. **Open the SQL Editor**
   - In the left sidebar, click **SQL Editor**.

3. **New query**
   - Click **New query** (or “+ New query”).

4. **Paste the migration**
   - Open the file `supabase/migrations/parent_and_telegram_schema.sql` from this repo.
   - Copy its **entire** contents and paste into the SQL Editor.

5. **Run it**
   - Click **Run** (or press Ctrl+Enter / Cmd+Enter).
   - You should see “Success. No rows returned” (or a short message). That’s normal for `CREATE TABLE` / `ALTER TABLE`.

6. **Optional: allow parent accounts**
   - If parent sign-up fails because `grade` or `subject` is required, run this in a **new** query and run it again:
   ```sql
   ALTER TABLE profiles ALTER COLUMN grade DROP NOT NULL;
   ALTER TABLE profiles ALTER COLUMN subject DROP NOT NULL;
   ```

Done. The migration has added:

- **profiles:** `parent_telegram_chat_id`, `parent_phone`, `role`
- **parent_link_codes** (for Telegram bot linking)
- **parent_children** (parent ↔ student links)
- **parent_invite_codes** (invite codes for parents)
- RLS policies so students and parents can only access the right data

---

## Option 2: Supabase CLI (local)

If you use the Supabase CLI and have your project linked:

```bash
# From the project root (where supabase folder is)
npx supabase db push
```

That applies all migrations in `supabase/migrations/`. If this project was not set up with `supabase init`, use **Option 1** instead.

---

## Check that it worked

In Supabase Dashboard:

1. Go to **Table Editor**.
2. You should see:
   - **profiles** – columns `parent_telegram_chat_id`, `parent_phone`, `role`
   - **parent_link_codes**
   - **parent_children**
   - **parent_invite_codes**

If those exist, the migration ran successfully.
