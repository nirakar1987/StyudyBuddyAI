// Supabase Edge Function: send parent a Telegram message when student completes an activity.
// Set TELEGRAM_BOT_TOKEN in Supabase secrets. Requires profiles.parent_telegram_chat_id.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TELEGRAM_API = 'https://api.telegram.org/bot';

interface NotifyBody {
  userId: string;
  eventType: string;
  summary: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!token) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN not set' }), { status: 500 });
  }
  let body: NotifyBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }
  const { userId, eventType, summary } = body;
  if (!userId || !summary) {
    return new Response(JSON.stringify({ error: 'userId and summary required' }), { status: 400 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('parent_telegram_chat_id, full_name')
    .eq('id', userId)
    .single();

  if (profileError || !profile?.parent_telegram_chat_id) {
    return new Response(JSON.stringify({ ok: false, reason: 'parent not linked' }), { status: 200 });
  }

  const chatId = profile.parent_telegram_chat_id;
  const title = eventType === 'quiz_complete' ? '📝 Quiz completed' : eventType === 'practice_complete' ? '💡 Practice done' : '📚 Activity';
  const text = `${title}\n\n${summary}`;

  const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  const result = await res.json();
  if (!result.ok) {
    console.error('Telegram send error:', result);
    return new Response(JSON.stringify({ error: result.description }), { status: 502 });
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
