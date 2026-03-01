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
  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return new Response(null, { status: 200 });
  }
  const chatId = update.message?.chat?.id;
  const text = (update.message?.text || '').trim();

  if (chatId == null) {
    return new Response('no chat id', { status: 200 });
  }

  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is missing');
    return new Response('config error', { status: 200 });
  }

  const adminChatId = Deno.env.get('ADMIN_TELEGRAM_CHAT_ID');

  // Helper command to find Chat ID for setup (WORKS WITHOUT DB)
  if (text === '/myid') {
    await sendTelegram(token, chatId, `🆔 Your Telegram Chat ID is: ${chatId}\n\nAdd this to Supabase Secrets as ADMIN_TELEGRAM_CHAT_ID.`);
    return new Response('ok', { status: 200 });
  }

  // Database-dependent commands
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !serviceKey) {
      if (text.startsWith('/')) {
        await sendTelegram(token, chatId, '⚠️ Bot is being updated. Please add SUPABASE_SERVICE_ROLE_KEY to Supabase Secrets.');
      }
      return new Response('missing db keys', { status: 200 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Admin Command: /stats
    if (text === '/stats' && String(chatId) === adminChatId) {
      const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
      const { count: quizCount } = await supabase.from('quiz_history').select('*', { count: 'exact', head: true });

      const statsMsg = `📊 StudyBuddy Global Stats\n\n` +
        `👨‍🎓 Total Students: ${studentCount || 0}\n` +
        `📝 Quizzes Completed: ${quizCount || 0}\n\n` +
        `Monitoring is ACTIVE.`;

      await sendTelegram(token, chatId, statsMsg);
      return new Response('ok', { status: 200 });
    }

    // Admin Command: /insights (AI powered)
    if (text === '/insights' && String(chatId) === adminChatId) {
      await sendTelegram(token, chatId, '🤖 Analyzing recent student data with Gemini AI...');

      const { data: history } = await supabase
        .from('quiz_history')
        .select('subject, score, total_questions, topics, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!history || history.length === 0) {
        await sendTelegram(token, chatId, '❌ No quiz history found to analyze.');
        return new Response('ok', { status: 200 });
      }

      const geminiKey = Deno.env.get('GEMINI_API_KEY');
      if (!geminiKey) {
        await sendTelegram(token, chatId, '⚠️ GEMINI_API_KEY is not set in secrets.');
        return new Response('ok', { status: 200 });
      }

      const summaryData = history.map(h => ({
        subject: h.subject,
        percentage: Math.round((h.score / h.total_questions) * 100) + '%',
        topics: h.topics,
        date: h.created_at.split('T')[0]
      }));

      const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert Educational Data Analyst and AI Assistant. 
                     Analyze this student performance data: ${JSON.stringify(summaryData)}.
                     
                     STRICT FORMATTING RULES (CHATGPT STYLE):
                     1. Use clear, BOLD headers for each section.
                     2. Use bullet points for all observations.
                     3. Use BOLD text for key metrics, subjects, or critical warnings.
                     4. Keep it professional, structured, and concise. 
                     5. NO conversational filler (e.g., skip "Here is the report" or "Hope this helps").
                     6. Use Standard Markdown (*bold*, - bullets).
                     
                     SECTIONS TO INCLUDE:
                     * PERFORMANCE TRENDS: Summarize how students are doing overall.
                     * TOP PRIORITY TOPICS: Identify specific topics needing immediate attention.
                     * STRATEGIC RECOMMENDATION: Provide one high-impact teaching strategy.`
            }]
          }]
        })
      });

      const aiData = await aiResponse.json();

      if (!aiResponse.ok) {
        console.error('Gemini Error:', aiData);
        await sendTelegram(token, chatId, `⚠️ *AI Service Error*\n\nStatus: ${aiResponse.status}\nMessage: ${aiData.error?.message || 'Unknown error'}`);
        return new Response('ok', { status: 200 });
      }

      const insightText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!insightText) {
        await sendTelegram(token, chatId, '🤖 Gemini returned empty results.');
        return new Response('ok', { status: 200 });
      }

      await sendTelegram(token, chatId, `🚀 *STUDYBUDDY AI INSIGHTS*\n\n${insightText}`);
      return new Response('ok', { status: 200 });
    }

    // Original Linking Logic: /start <CODE>
    if (text.startsWith('/start')) {
      const code = text.replace(/\/start\s*/i, '').trim();
      if (!code) {
        await sendTelegram(token, chatId, '👋 *Welcome to StudyBuddy!*\n\nTo link your student\'s account:\n1. Open the app\n2. Go to *Profile* → *Parent Notifications*\n3. Enter the 6-digit code here.');
        return new Response('ok', { status: 200 });
      }

      const { data: row } = await supabase
        .from('parent_link_codes')
        .select('user_id, expires_at')
        .eq('code', code)
        .single();

      if (!row || new Date(row.expires_at) < new Date()) {
        await sendTelegram(token, chatId, '❌ *Invalid or Expired Code*\nPlease generate a new code in the app.');
        return new Response('ok', { status: 200 });
      }

      const { error } = await supabase
        .from('profiles')
        .update({ parent_telegram_chat_id: String(chatId) })
        .eq('id', row.user_id);

      if (error) {
        await sendTelegram(token, chatId, '❌ *Connection Error*\nPlease try again later.');
        return new Response('ok', { status: 200 });
      }

      await supabase.from('parent_link_codes').delete().eq('code', code);
      await sendTelegram(token, chatId, '✅ *Success!*\nYou are now linked. You will receive real-time updates on your student\'s progress.');
      return new Response('ok', { status: 200 });
    }
  } catch (err) {
    console.error('Runtime error:', err);
  }

  return new Response('ok', { status: 200 });
});

async function sendTelegram(token: string, chatId: number, text: string, parseMode: string = 'Markdown'): Promise<void> {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  });
}
