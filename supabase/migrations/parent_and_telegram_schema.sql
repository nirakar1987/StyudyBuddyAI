-- ============================================================
-- StudyBuddy: Parent notifications + Parent accounts
-- Run this in Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. PROFILES: add columns for parent notifications and role
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS parent_telegram_chat_id TEXT,
  ADD COLUMN IF NOT EXISTS parent_phone TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- If your profiles table has NOT NULL on grade/subject, uncomment to allow parent accounts:
-- ALTER TABLE profiles ALTER COLUMN grade DROP NOT NULL;
-- ALTER TABLE profiles ALTER COLUMN subject DROP NOT NULL;

-- 2. PARENT LINK CODES (for Telegram: parent sends /start CODE to bot, we link chat_id to student)
CREATE TABLE IF NOT EXISTS parent_link_codes (
  code TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

-- 3. PARENT CHILDREN (parent account linked to student accounts)
CREATE TABLE IF NOT EXISTS parent_children (
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, student_id)
);

-- 4. PARENT INVITE CODES (student generates code, parent enters when signing up as Parent)
CREATE TABLE IF NOT EXISTS parent_invite_codes (
  code TEXT PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

-- 5. ENABLE RLS ON NEW TABLES
ALTER TABLE parent_link_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_invite_codes ENABLE ROW LEVEL SECURITY;

-- 6. RLS: authenticated users can create/read/delete their own link codes (student generates code)
CREATE POLICY "Users can manage own parent_link_codes"
  ON parent_link_codes FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 7. RLS: parent can manage their own parent_children rows (add/remove linked children)
CREATE POLICY "Parents manage own parent_children"
  ON parent_children FOR ALL
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- 8. RLS: students create invite codes; anyone authenticated can delete (to consume code when parent links)
CREATE POLICY "Users insert own parent_invite_codes"
  ON parent_invite_codes FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Users select own parent_invite_codes"
  ON parent_invite_codes FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Authenticated can delete parent_invite_codes"
  ON parent_invite_codes FOR DELETE
  TO authenticated
  USING (true);

-- 9. RLS: parents can read linked children's profiles (for Parent Dashboard "My Children")
-- Drop first if you re-run this script to avoid duplicate policy
DROP POLICY IF EXISTS "Parents can read linked children profiles" ON profiles;
CREATE POLICY "Parents can read linked children profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR id IN (SELECT student_id FROM parent_children WHERE parent_id = auth.uid())
  );

-- 10. RLS: parents can read linked children's quiz_history (for Activity tab)
DROP POLICY IF EXISTS "Parents can read linked children quiz history" ON quiz_history;
CREATE POLICY "Parents can read linked children quiz history"
  ON quiz_history FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (SELECT student_id FROM parent_children WHERE parent_id = auth.uid())
  );

-- Done. Next: add TELEGRAM_BOT_TOKEN in Supabase → Settings → Edge Functions → Secrets (not in DB).