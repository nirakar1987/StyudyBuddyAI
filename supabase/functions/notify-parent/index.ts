// Supabase Edge Function: send parent a Telegram message when student completes an activity.
// Set TELEGRAM_BOT_TOKEN in Supabase secrets. Requires profiles.parent_telegram_chat_id.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TELEGRAM_API = 'https://api.telegram.org/bot';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface NotifyBody {
  userId: string;
  eventType: string;
  summary: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!token) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN not set' }), { status: 500, headers: corsHeaders });
  }

  let body: NotifyBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: corsHeaders });
  }

  const { userId, eventType, summary } = body;
  if (!userId || !summary) {
    return new Response(JSON.stringify({ error: 'userId and summary required' }), { status: 400, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('parent_telegram_chat_id, full_name')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error(`Profile lookup failed for user ${userId}:`, profileError);
  }

  console.log(`notify-parent: userId=${userId}, parentChatId=${profile?.parent_telegram_chat_id || 'none'}, fullName=${profile?.full_name || 'unknown'}`);

  const adminChatId = Deno.env.get('ADMIN_TELEGRAM_CHAT_ID');
  const parentChatId = profile?.parent_telegram_chat_id;

  if (!parentChatId && !adminChatId) {
    console.warn(`No Telegram Chat ID found for user ${userId} (Parent) or Admin.`);
    return new Response(JSON.stringify({ ok: false, reason: 'no recipients' }), { status: 200, headers: corsHeaders });
  }

  const titleEmoji = eventType === 'quiz_complete' ? '📝' : eventType === 'practice_complete' ? '💡' : '📚';
  const text = `${titleEmoji} <b>ACTIVITY ALERT</b>\n\n${summary}`;

  const sendPromises = [];

  // 1. Send to linked parent
  if (parentChatId) {
    console.log(`Sending to parent chatId: ${parentChatId}`);
    sendPromises.push(sendTelegram(token, Number(parentChatId), text));
  }

  // 2. Send to global admin monitor
  if (adminChatId) {
    console.log(`Sending to admin chatId: ${adminChatId}`);
    const adminText = `🚨 <b>GLOBAL MONITOR</b> 🚨\nStudent: <b>${profile?.full_name || 'Anonymous'}</b>\n\n${text}`;
    sendPromises.push(sendTelegram(token, Number(adminChatId), adminText));
  }

  const results = await Promise.all(sendPromises);

  return new Response(JSON.stringify({ ok: true, sent: results.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

async function sendTelegram(token: string, chatId: number, text: string, parseMode: string = 'HTML'): Promise<void> {
  const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: parseMode
    }),
  });

  if (!resp.ok) {
    const errorData = await resp.json();
    console.error('Telegram Send Error:', errorData);
    // If HTML parsing fails, fallback to plain text (strip tags)
    if (parseMode === 'HTML') {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `⚠️ (Format Error - Plain Text Fallback)\n\n${text.replace(/<[^>]*>/g, '')}`
        }),
      });
    }
  }
}
