// Supabase Edge Function: Telegram bot webhook. Parent sends /start <CODE> to link their Telegram to student.
// Set TELEGRAM_BOT_TOKEN in Supabase secrets. Set webhook: https://<project>.supabase.co/functions/v1/telegram-webhook
// Requires table: parent_link_codes (code text primary key, user_id uuid, expires_at timestamptz)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!token) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN not set' }), { status: 500 });
  }
  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return new Response(null, { status: 200 });
  }
  const chatId = update.message?.chat?.id;
  const text = (update.message?.text || '').trim();
  if (chatId == null || !text.startsWith('/start')) {
    return new Response(null, { status: 200 });
  }

  const code = text.replace(/\/start\s*/i, '').trim();
  if (!code) {
    await sendTelegram(token, chatId, '👋 Hi! To get StudyBuddy activity updates, enter the 6-digit code from your child\'s app: Profile → Parent notifications → Connect Telegram.');
    return new Response(null, { status: 200 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: row } = await supabase
    .from('parent_link_codes')
    .select('user_id, expires_at')
    .eq('code', code)
    .single();

  if (!row || new Date(row.expires_at) < new Date()) {
    await sendTelegram(token, chatId, '❌ Invalid or expired code. Please get a new code from the StudyBuddy app.');
    return new Response(null, { status: 200 });
  }

  const { error } = await supabase
    .from('profiles')
    .update({ parent_telegram_chat_id: String(chatId) })
    .eq('id', row.user_id);

  if (error) {
    await sendTelegram(token, chatId, '❌ Something went wrong. Please try again.');
    return new Response(null, { status: 200 });
  }

  await supabase.from('parent_link_codes').delete().eq('code', code);
  await sendTelegram(token, chatId, '✅ You\'re linked! You\'ll receive activity updates when your child completes quizzes or practice.');
  return new Response(null, { status: 200 });
});

async function sendTelegram(token: string, chatId: number, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}
