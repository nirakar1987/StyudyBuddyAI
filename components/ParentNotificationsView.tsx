import React, { useState } from 'react';
import { AppContextType, AppState } from '../types';
import { getProfile, createParentInviteCode } from '../services/databaseService';
import { createParentLinkCode } from '../services/databaseService';
import { copyToClipboard } from '../services/parentNotificationService';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { useSoundEffects } from '../hooks/useSoundEffects';

// Your bot from BotFather – use env to override: VITE_TELEGRAM_BOT_USERNAME (no @)
const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'StudyBuddyParentbot';
const TELEGRAM_BOT_LINK = `https://t.me/${TELEGRAM_BOT_USERNAME}`;

const ParentNotificationsView: React.FC<{ context: AppContextType }> = ({ context }) => {
  const { user, studentProfile, setStudentProfile, setAppState } = context;
  const { playHoverSound } = useSoundEffects();
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteCodeLoading, setInviteCodeLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const hasTelegram = !!studentProfile?.parent_telegram_chat_id;

  const handleGenerateInviteCode = async () => {
    if (!user) return;
    setInviteCodeLoading(true);
    setInviteCode(null);
    try {
      const code = await createParentInviteCode(user.id);
      setInviteCode(code);
      setToast('Share this code with your parent. They sign up as Parent and enter it to link.');
    } catch (e) {
      setToast('Could not generate code. Check if parent_invite_codes table exists.');
    } finally {
      setInviteCodeLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!user) return;
    setCodeLoading(true);
    setLinkCode(null);
    try {
      const code = await createParentLinkCode(user.id);
      setLinkCode(code);
    } catch (e) {
      setToast('Could not generate code. Check if parent_link_codes table exists.');
    } finally {
      setCodeLoading(false);
    }
  };

  const handleRefreshLinked = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const profile = await getProfile(user.id);
      if (profile) setStudentProfile(profile);
      setToast(profile?.parent_telegram_chat_id ? 'Telegram connected!' : 'Not linked yet. Ask parent to send the code to the bot.');
    } catch (e) {
      setToast('Could not refresh.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in pb-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-amber-400 flex items-center gap-2">
          <span className="text-4xl">📱</span> Parent Notifications
        </h2>
        <button
          onClick={() => setAppState(AppState.DASHBOARD)}
          onMouseEnter={playHoverSound}
          className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-300 font-semibold"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5" /> Back
        </button>
      </div>

      <p className="text-slate-400 mb-4">
        Parents get activity updates <strong>automatically via Telegram</strong> when you complete a quiz or practice. No buttons to tap – just link once below.
      </p>

      <div className="mb-6 p-4 rounded-xl bg-amber-900/20 border border-amber-600/40">
        <h3 className="text-sm font-bold text-amber-300 mb-2">📌 Automatic setup (one-time)</h3>
        <p className="text-slate-300 text-sm">
          Generate a 6-digit code below → parent sends <code className="bg-slate-700 px-1 rounded">/start CODE</code> to the bot in Telegram → tap &quot;I&apos;ve connected – refresh&quot;. After that, when you finish a quiz or practice, the parent gets a Telegram message automatically.
        </p>
      </div>

      {toast && (
        <div className="mb-4 p-3 rounded-lg bg-slate-700/50 text-slate-200 text-sm">
          {toast}
        </div>
      )}

      {/* Telegram: link parent for automatic updates */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-cyan-500/30">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <span>✈️</span> Telegram (automatic updates)
        </h3>
        {hasTelegram ? (
          <div className="flex items-center gap-2 text-green-400">
            <span>✅ Parent linked. They will get a message when you complete a quiz or practice.</span>
          </div>
        ) : (
          <>
            <div className="bg-slate-900/60 rounded-xl p-4 mb-4 border border-cyan-500/20">
              <p className="text-cyan-200 font-semibold mb-2">Parent should follow these steps:</p>
              <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm">
                <li>Open Telegram and tap the link below (or search for <strong className="text-white">@{TELEGRAM_BOT_USERNAME}</strong>)</li>
                <li>Tap <strong className="text-white">Start</strong> in the chat</li>
                <li>Send <strong className="text-white">one message only</strong>: type <code className="bg-slate-700 px-2 py-1 rounded text-amber-300 font-mono">/start</code> then a space, then the 6-digit code. Example: <code className="bg-slate-700 px-2 py-1 rounded text-amber-300 font-mono">/start 482917</code> (replace 482917 with your code)</li>
              </ol>
              <a
                href={TELEGRAM_BOT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm"
              >
                Open @{TELEGRAM_BOT_USERNAME} in Telegram →
              </a>
            </div>
            {!linkCode ? (
              <button
                onClick={handleGenerateCode}
                disabled={codeLoading}
                onMouseEnter={playHoverSound}
                className="px-4 py-3 rounded-lg bg-cyan-600 text-white font-bold hover:bg-cyan-500 disabled:opacity-50"
              >
                {codeLoading ? 'Generating...' : 'Generate 6-digit code'}
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-400 text-sm font-semibold">Your code (give this to parent):</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-mono font-bold text-amber-400 bg-slate-900 px-4 py-2 rounded-lg">
                    {linkCode}
                  </span>
                  <button
                    onClick={() => copyToClipboard(linkCode).then((ok) => setToast(ok ? 'Code copied!' : 'Copy failed'))}
                    onMouseEnter={playHoverSound}
                    className="text-sm text-slate-400 hover:text-white"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-slate-400 text-sm">
                  In Telegram, parent sends <strong>one message</strong>: <code className="bg-slate-700 px-2 py-1 rounded text-amber-300 font-mono">/start {linkCode}</code> (slash start, space, then the code)
                </p>
                <button
                  onClick={handleRefreshLinked}
                  disabled={refreshing}
                  onMouseEnter={playHoverSound}
                  className="px-4 py-2 rounded-lg border border-slate-500 text-slate-300 hover:border-cyan-500 hover:text-cyan-400 text-sm font-semibold"
                >
                  {refreshing ? 'Checking...' : "I've connected – refresh"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Invite parent to create account (parent logs in with own email/password and enters this code) */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-600/50 mt-6">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <span>👨‍👩‍👧</span> Invite parent to create account
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          Generate a code. Your parent signs up in the app as &quot;Parent&quot;, then enters this code to link to your profile. They get their own login and can see your activity.
        </p>
        {!inviteCode ? (
          <button
            onClick={handleGenerateInviteCode}
            disabled={inviteCodeLoading}
            onMouseEnter={playHoverSound}
            className="px-4 py-3 rounded-lg bg-violet-600 text-white font-bold hover:bg-violet-500 disabled:opacity-50 text-sm"
          >
            {inviteCodeLoading ? 'Generating...' : 'Generate invite code'}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold text-violet-400 bg-slate-900 px-4 py-2 rounded-lg">{inviteCode}</span>
            <button onClick={() => copyToClipboard(inviteCode).then((ok) => setToast(ok ? 'Code copied!' : 'Copy failed'))} onMouseEnter={playHoverSound} className="text-sm text-slate-400 hover:text-white">Copy</button>
          </div>
        )}
      </div>

      <p className="text-slate-500 text-xs mt-6">
        Notifications are sent automatically when you complete a quiz or a practice problem. No manual sharing.
      </p>
    </div>
  );
};

export default ParentNotificationsView;
