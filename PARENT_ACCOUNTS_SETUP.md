# Parent Accounts – Database Setup

Parents can sign up with their own email/password, link to their child via invite code, and use the Parent Dashboard (menu: My Children, Activity, WhatsApp/Telegram).

## 1. Profiles table – add role

```sql
-- Add role column (default 'student' for existing rows)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- Parent rows use role='parent' and need nullable grade/subject. If your columns are NOT NULL, run:
-- ALTER TABLE profiles ALTER COLUMN grade DROP NOT NULL;
-- ALTER TABLE profiles ALTER COLUMN subject DROP NOT NULL;
```

## 2. Parent–child linking and invite codes

```sql
-- Parent can have multiple linked children
CREATE TABLE IF NOT EXISTS parent_children (
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, student_id)
);

-- Invite codes: student generates code, parent enters when signing up
CREATE TABLE IF NOT EXISTS parent_invite_codes (
  code TEXT PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Optional: RLS so only the student can create/delete their own invite codes
ALTER TABLE parent_invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_children ENABLE ROW LEVEL SECURITY;
```

## 3. RLS policies (so parents can read linked children’s data)

**Profiles:** parents may read profiles of linked children (for “My Children” list).

```sql
-- Policy: parent can read profile of linked students
CREATE POLICY "Parents can read linked children profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR id IN (
      SELECT student_id FROM parent_children WHERE parent_id = auth.uid()
    )
  );
```

**quiz_history:** parents may read quiz history of linked children (for Activity tab).

```sql
-- Policy: parent can read quiz_history for linked children
CREATE POLICY "Parents can read linked children quiz history"
  ON quiz_history FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT student_id FROM parent_children WHERE parent_id = auth.uid()
    )
  );
```

**parent_children:** parent can insert/select their own links; student can insert (when generating invite) via app (service role or allow insert for invite flow).

```sql
-- Parents can manage their own links (insert when they add child, select their rows)
CREATE POLICY "Parents manage own links"
  ON parent_children FOR ALL
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- Allow authenticated users to insert (parent adds child); restrict delete to parent_id = auth.uid() if needed
```

**parent_invite_codes:** students create codes (insert where student_id = auth.uid()); parents or service consume (delete). Easiest: allow authenticated insert/select/delete and validate in app, or use service role for consume.

```sql
CREATE POLICY "Users can create invite codes for themselves"
  ON parent_invite_codes FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Users can read own codes"
  ON parent_invite_codes FOR SELECT
  USING (student_id = auth.uid());

-- Consume: parent enters code; app needs to delete after link. Use Edge Function with service role, or allow delete for authenticated and validate in app.
CREATE POLICY "Any authenticated can delete by code (app validates)"
  ON parent_invite_codes FOR DELETE
  USING (true);
```

## 4. Flow summary

1. **Student:** Dashboard → Parent → “Generate invite code” → share code with parent.
2. **Parent:** Sign up (email/password or Google) → “Create your profile” → choose **Parent** → enter name, optional phone, optional **invite code** → Continue.
3. **Parent:** After login, sees Parent Dashboard: My Children, Activity, WhatsApp/Telegram, Logout.
4. **Parent:** My Children → “Add child” with code (if they didn’t enter it at signup).
5. **Parent:** Activity → select a child → see quiz history (if RLS allows).
6. **Parent:** WhatsApp / Telegram → set phone and (if you use the bot) link Telegram.
