import React, { useState } from 'react';
import { AppContextType, AppState } from '../types';
import { getProfile } from '../services/databaseService';
import { createParentLinkCode } from '../services/databaseService';
import { getWhatsAppShareUrl, copyToClipboard } from '../services/parentNotificationService';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { useSoundEffects } from '../hooks/useSoundEffects';

const TELEGRAM_BOT_USERNAME = 'StudyBuddyParentBot'; // Replace with your bot's @username after creating via BotFather

const ParentNotificationsView: React.FC<{ context: AppContextType }> = ({ context }) => {
  const { user, studentProfile, setStudentProfile, setAppState } = context;
  const { playHoverSound } = useSoundEffects();
  const [parentPhone, setParentPhone] = useState(studentProfile?.parent_phone ?? '');
  const [savingPhone, setSavingPhone] = useState(false);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const hasTelegram = !!studentProfile?.parent_telegram_chat_id;

  const handleSavePhone = async () => {
    if (!user || !studentProfile) return;
    setSavingPhone(true);
    try {
      const cleaned = parentPhone.replace(/\D/g, '').slice(0, 15) || null;
      await setStudentProfile({
        ...studentProfile,
        parent_phone: cleaned || undefined,
      });
      setToast('Parent number saved. Use "Share to WhatsApp" after activities to send updates.');
    } catch (e) {
      setToast('Failed to save.');
    } finally {
      setSavingPhone(false);
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

      <p className="text-slate-400 mb-6">
        Parents can get activity updates via WhatsApp (share after each session) or Telegram (automatic when linked).
      </p>

      {toast && (
        <div className="mb-4 p-3 rounded-lg bg-slate-700/50 text-slate-200 text-sm">
          {toast}
        </div>
      )}

      {/* WhatsApp: parent phone for quick share */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-600/50 mb-6">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <span>📲</span> WhatsApp (share after quiz/practice)
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          Add parent&apos;s number with country code (e.g. 919876543210). When you tap &quot;Share to WhatsApp&quot; after a quiz or practice, it will open WhatsApp to send the update.
        </p>
        <div className="flex gap-3 flex-wrap">
          <input
            type="tel"
            value={parentPhone}
            onChange={(e) => setParentPhone(e.target.value)}
            placeholder="e.g. 919876543210"
            className="flex-1 min-w-[200px] p-3 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:border-amber-500"
          />
          <button
            onClick={handleSavePhone}
            disabled={savingPhone}
            onMouseEnter={playHoverSound}
            className="px-4 py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-500 disabled:opacity-50"
          >
            {savingPhone ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Telegram: link parent for automatic updates */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-600/50">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <span>✈️</span> Telegram (automatic updates)
        </h3>
        {hasTelegram ? (
          <div className="flex items-center gap-2 text-green-400">
            <span>✅ Parent linked. They will get a message when you complete a quiz or practice.</span>
          </div>
        ) : (
          <>
            <p className="text-slate-400 text-sm mb-4">
              Parent opens Telegram, finds <strong className="text-slate-300">@{TELEGRAM_BOT_USERNAME}</strong>, taps Start, then sends: <code className="bg-slate-700 px-2 py-1 rounded">/start CODE</code> (use the code below).
            </p>
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
                <p className="text-slate-500 text-sm">
                  Tell your parent: In Telegram, open @{TELEGRAM_BOT_USERNAME} and send: /start {linkCode}
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

      <p className="text-slate-500 text-xs mt-6">
        After each quiz or practice you can also use &quot;Share to WhatsApp&quot; or &quot;Copy for Telegram&quot; on the results screen to send an update manually.
      </p>
    </div>
  );
};

export default ParentNotificationsView;
