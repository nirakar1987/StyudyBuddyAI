import React, { useState } from 'react';
import { AppContextType, AppState } from '../types';
import { upsertParentProfile, linkParentToStudent, getStudentIdByParentInviteCode, consumeParentInviteCode } from '../services/databaseService';
import { useSoundEffects } from '../hooks/useSoundEffects';

const ParentProfileSetupView: React.FC<{ context: AppContextType; onParentReady: () => void }> = ({ context, onParentReady }) => {
  const { user, setAppState } = context;
  const { playHoverSound } = useSoundEffects();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fullName.trim()) {
      setError('Please enter your name.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await upsertParentProfile({
        id: user.id,
        full_name: fullName.trim(),
        parent_phone: phone.replace(/\D/g, '').slice(0, 15) || null,
      });
      if (inviteCode.trim()) {
        const studentId = await getStudentIdByParentInviteCode(inviteCode.trim());
        if (studentId) {
          await linkParentToStudent(user.id, studentId);
          await consumeParentInviteCode(inviteCode.trim());
        }
      }
      onParentReady();
    } catch (err: any) {
      setError(err.message || 'Could not save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center p-4 overflow-hidden z-[100]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-black text-white text-center mb-2">Parent account</h1>
        <p className="text-slate-400 text-center mb-8">Set up your profile and link to your child if you have an invite code.</p>
        <form onSubmit={handleSubmit} className="space-y-6 p-6 rounded-2xl bg-white/5 border border-white/10">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-1">Your name *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:border-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-1">Phone (optional, for WhatsApp)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 919876543210"
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-1">Child&apos;s invite code (optional)</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="6-digit code from StudyBuddy app"
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:border-emerald-500 font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">Ask your child to open StudyBuddy → Parent → Generate invite code.</p>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAppState(AppState.ROLE_SELECT)}
              onMouseEnter={playHoverSound}
              className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-400 font-bold hover:bg-slate-800"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              onMouseEnter={playHoverSound}
              className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ParentProfileSetupView;
