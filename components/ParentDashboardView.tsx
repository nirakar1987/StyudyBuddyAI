import React, { useState, useEffect } from 'react';
import { AppContextType, AppState, ParentProfile, LinkedChild } from '../types';
import { getLinkedChildren, linkParentToStudent, getStudentIdByParentInviteCode, consumeParentInviteCode } from '../services/databaseService';
import { getQuizHistory } from '../services/databaseService';
import { QuizAttempt } from '../types';
import { useSoundEffects } from '../hooks/useSoundEffects';

const ParentDashboardView: React.FC<{
  context: AppContextType;
  parentProfile: ParentProfile;
  onParentProfileUpdate: (p: Partial<ParentProfile>) => void;
  onLogout: () => void;
}> = ({ context, parentProfile, onParentProfileUpdate, onLogout }) => {
  const { setAppState } = context;
  const { playHoverSound } = useSoundEffects();
  const [children, setChildren] = useState<LinkedChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<'home' | 'children' | 'activity' | 'notifications'>('home');
  const [selectedChild, setSelectedChild] = useState<LinkedChild | null>(null);
  const [childActivity, setChildActivity] = useState<QuizAttempt[]>([]);
  const [addCode, setAddCode] = useState('');
  const [addCodeError, setAddCodeError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!context.user) return;
      setLoading(true);
      try {
        const list = await getLinkedChildren(context.user.id);
        if (!cancelled) setChildren(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [context.user]);

  useEffect(() => {
    if (menu !== 'activity' || !selectedChild) return;
    let cancelled = false;
    (async () => {
      try {
        const history = await getQuizHistory(selectedChild.user_id);
        if (!cancelled) setChildActivity(history);
      } catch {
        if (!cancelled) setChildActivity([]);
      }
    })();
    return () => { cancelled = true; };
  }, [menu, selectedChild]);

  const handleAddChild = async () => {
    if (!context.user || !addCode.trim()) return;
    setAddCodeError(null);
    try {
      const studentId = await getStudentIdByParentInviteCode(addCode.trim());
      if (!studentId) {
        setAddCodeError('Invalid or expired code.');
        return;
      }
      await linkParentToStudent(context.user.id, studentId);
      await consumeParentInviteCode(addCode.trim());
      const list = await getLinkedChildren(context.user.id);
      setChildren(list);
      setAddCode('');
    } catch (e: any) {
      setAddCodeError(e.message || 'Could not link.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <header className="p-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👨‍👩‍👧</span>
          <div>
            <h1 className="text-xl font-bold text-white">Parent Dashboard</h1>
            <p className="text-sm text-slate-400">{parentProfile.full_name}</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2">
          <button onClick={() => { playHoverSound(); setMenu('home'); }} className={`px-4 py-2 rounded-xl font-semibold text-sm ${menu === 'home' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>Home</button>
          <button onClick={() => { playHoverSound(); setMenu('children'); setSelectedChild(null); }} className={`px-4 py-2 rounded-xl font-semibold text-sm ${menu === 'children' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>My Children</button>
          <button onClick={() => { playHoverSound(); setMenu('activity'); }} className={`px-4 py-2 rounded-xl font-semibold text-sm ${menu === 'activity' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>Activity</button>
          <button onClick={() => { playHoverSound(); setMenu('notifications'); }} className={`px-4 py-2 rounded-xl font-semibold text-sm ${menu === 'notifications' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>WhatsApp / Telegram</button>
          <button onClick={() => { playHoverSound(); onLogout(); }} className="px-4 py-2 rounded-xl bg-red-900/40 text-red-300 font-semibold text-sm hover:bg-red-800/50">Logout</button>
        </nav>
      </header>

      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {menu === 'home' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="p-6 rounded-2xl bg-emerald-900/20 border border-emerald-500/30">
              <h2 className="text-lg font-bold text-white mb-2">Welcome, {parentProfile.full_name}</h2>
              <p className="text-slate-300 text-sm">Use the menu above to view your linked children, their activity, and set up WhatsApp or Telegram notifications.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setMenu('children')} onMouseEnter={playHoverSound} className="p-6 rounded-2xl bg-slate-800/50 border border-slate-600/50 hover:border-emerald-500/50 text-left">
                <span className="text-3xl block mb-2">👶</span>
                <span className="font-bold text-white">My Children</span>
                <p className="text-xs text-slate-400 mt-1">{children.length} linked</p>
              </button>
              <button onClick={() => setMenu('notifications')} onMouseEnter={playHoverSound} className="p-6 rounded-2xl bg-slate-800/50 border border-slate-600/50 hover:border-emerald-500/50 text-left">
                <span className="text-3xl block mb-2">📱</span>
                <span className="font-bold text-white">Notifications</span>
                <p className="text-xs text-slate-400 mt-1">WhatsApp & Telegram</p>
              </button>
            </div>
          </div>
        )}

        {menu === 'children' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-white">My Children</h2>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-600/50">
              <label className="block text-sm font-bold text-slate-300 mb-2">Add child with invite code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={addCode}
                  onChange={(e) => { setAddCode(e.target.value); setAddCodeError(null); }}
                  placeholder="6-digit code"
                  className="flex-1 p-3 rounded-lg bg-slate-800 border border-slate-600 text-white font-mono"
                />
                <button onClick={handleAddChild} onMouseEnter={playHoverSound} className="px-4 py-3 rounded-lg bg-emerald-600 text-white font-bold">Add</button>
              </div>
              {addCodeError && <p className="text-red-400 text-sm mt-2">{addCodeError}</p>}
              <p className="text-xs text-slate-500 mt-2">Your child generates this in StudyBuddy → Parent → Invite parent (code).</p>
            </div>
            {loading ? <p className="text-slate-400">Loading...</p> : children.length === 0 ? (
              <p className="text-slate-400">No children linked yet. Add one with the code above.</p>
            ) : (
              <div className="space-y-3">
                {children.map((c) => (
                  <div
                    key={c.user_id}
                    onClick={() => { setSelectedChild(c); setMenu('activity'); }}
                    onMouseEnter={playHoverSound}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-600/50 hover:border-emerald-500/50 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-white">{c.name}</span>
                      <p className="text-sm text-slate-400">Grade {c.grade} · {c.subject}</p>
                    </div>
                    <div className="text-right text-sm">
                      <span className="text-emerald-400 font-bold">{c.score ?? 0} pts</span>
                      <p className="text-slate-500">Streak {c.streak ?? 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {menu === 'activity' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {selectedChild ? (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-xl font-bold text-white">Activity – {selectedChild.name}</h2>
                  <button onClick={() => setSelectedChild(null)} onMouseEnter={playHoverSound} className="text-sm text-slate-400 hover:text-white">← Back to list</button>
                </div>
                {childActivity.length === 0 ? (
                  <p className="text-slate-400">No quiz history yet.</p>
                ) : (
                  <div className="space-y-3">
                    {childActivity.slice(0, 20).map((q) => (
                      <div key={q.id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-600/50">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-white">{q.subject} – Grade {q.grade}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${q.score >= 80 ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {q.score}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{new Date(q.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Activity</h2>
                <p className="text-slate-400">Select a child from &quot;My Children&quot; to see their quiz activity.</p>
              </div>
            )}
          </div>
        )}

        {menu === 'notifications' && (
          <div className="max-w-xl mx-auto">
            <ParentNotificationSettingsView
              parentProfile={parentProfile}
              onUpdate={onParentProfileUpdate}
              playHoverSound={playHoverSound}
            />
          </div>
        )}
      </main>
    </div>
  );
};

const ParentNotificationSettingsView: React.FC<{
  parentProfile: ParentProfile;
  onUpdate: (p: Partial<ParentProfile>) => void;
  playHoverSound: () => void;
}> = ({ parentProfile, onUpdate, playHoverSound }) => {
  const [phone, setPhone] = useState(parentProfile.parent_phone ?? '');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setToast(null);
    try {
      onUpdate({ parent_phone: phone.replace(/\D/g, '').slice(0, 15) || null });
      setToast('Saved. You can use WhatsApp share links with this number.');
    } catch {
      setToast('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Notification settings</h2>
      <p className="text-slate-400 text-sm">Set your phone number to receive activity updates via WhatsApp. For Telegram, link using the bot (see student app Parent screen for bot name).</p>
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-600/50">
        <label className="block text-sm font-bold text-slate-300 mb-2">Your WhatsApp number (with country code)</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="919876543210"
          className="w-full p-3 rounded-lg bg-slate-800 border border-slate-600 text-white mb-2"
        />
        <button onClick={handleSave} disabled={saving} onMouseEnter={playHoverSound} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold text-sm">Save</button>
      </div>
      {toast && <p className="text-sm text-slate-300">{toast}</p>}
    </div>
  );
};

export default ParentDashboardView;
