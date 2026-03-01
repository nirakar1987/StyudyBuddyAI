import React, { useState, useEffect } from 'react';
import { AppState, AppContextType, AvatarState, SchoolProject, ProjectMilestone, ProjectType } from '../types';
import { generateProjectOutline } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { CheckIcon } from './icons/CheckIcon';
import { useSoundEffects } from '../hooks/useSoundEffects';

const PROJECT_TYPES: { value: ProjectType; label: string; emoji: string }[] = [
  { value: 'Research', label: 'Research', emoji: '🔬' },
  { value: 'Presentation', label: 'Presentation', emoji: '📊' },
  { value: 'Science', label: 'Science', emoji: '🧪' },
  { value: 'Art', label: 'Art', emoji: '🎨' },
  { value: 'Essay', label: 'Essay', emoji: '📝' },
  { value: 'Other', label: 'Other', emoji: '📁' },
];

const STORAGE_KEY = (userId: string) => `schoolProjects_${userId}`;

function loadProjects(userId: string): SchoolProject[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY(userId));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveProjects(userId: string, projects: SchoolProject[]) {
  localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(projects));
}

const SchoolProjectsView: React.FC<{ context: AppContextType }> = ({ context }) => {
  const { setAppState, setAvatarState, studentProfile, user, setScore } = context;
  const { playHoverSound } = useSoundEffects();
  const [projects, setProjects] = useState<SchoolProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<SchoolProject | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<ProjectType>('Research');
  const [formDueDate, setFormDueDate] = useState('');

  useEffect(() => {
    if (user) setProjects(loadProjects(user.id));
  }, [user]);

  useEffect(() => {
    if (user && projects.length > 0) saveProjects(user.id, projects);
  }, [projects, user]);

  const handleCreate = async () => {
    if (!formTitle.trim() || !studentProfile || !user) return;
    setError(null);
    setIsLoading(true);
    setAvatarState(AvatarState.THINKING);

    try {
      const { outline, milestones } = await generateProjectOutline(
        {
          title: formTitle,
          description: formDescription || formTitle,
          type: formType,
          subject: studentProfile.subject,
        },
        studentProfile
      );

      const newProject: SchoolProject = {
        id: `proj_${Date.now()}`,
        title: formTitle,
        description: formDescription || formTitle,
        type: formType,
        subject: studentProfile.subject,
        dueDate: formDueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        milestones: milestones.map((m, i) => ({
          id: `m_${Date.now()}_${i}`,
          title: m.title,
          description: m.description,
          completed: false,
        })),
        aiOutline: outline,
        createdAt: new Date().toISOString(),
      };

      setProjects(prev => [newProject, ...prev]);
      setSelectedProject(newProject);
      setShowCreate(false);
      setFormTitle('');
      setFormDescription('');
      setFormType('Research');
      setFormDueDate('');
      setScore(prev => prev + 30);
    } catch (err: any) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setIsLoading(false);
      setAvatarState(AvatarState.IDLE);
    }
  };

  const toggleMilestone = (projectId: string, milestoneId: string) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        const updated = p.milestones.map(m =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        const justCompleted = updated.find(m => m.id === milestoneId)?.completed;
        if (justCompleted) setScore(s => s + 15);
        return { ...p, milestones: updated };
      })
    );
    if (selectedProject?.id === projectId) {
      setSelectedProject(prev => {
        if (!prev || prev.id !== projectId) return prev;
        const updated = prev.milestones.map(m =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        return { ...prev, milestones: updated };
      });
    }
  };

  const deleteProject = (id: string) => {
    if (!confirm('Delete this project?')) return;
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProject?.id === id) setSelectedProject(null);
  };

  const formatDate = (d: string) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTypeEmoji = (type: ProjectType) => PROJECT_TYPES.find(t => t.value === type)?.emoji || '📁';

  return (
    <div className="flex flex-col h-full animate-fade-in pb-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-amber-400 flex items-center gap-2">
          <span className="text-4xl">📚</span> School Projects
        </h2>
        <button
          onClick={() => setAppState(AppState.DASHBOARD)}
          onMouseEnter={playHoverSound}
          className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-300 font-semibold"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5" /> Back
        </button>
      </div>

      {selectedProject ? (
        <div className="flex flex-col gap-4 overflow-y-auto pr-2">
          <button
            onClick={() => setSelectedProject(null)}
            onMouseEnter={playHoverSound}
            className="text-sm text-slate-400 hover:text-white self-start"
          >
            ← All Projects
          </button>
          <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-2xl mr-2">{getTypeEmoji(selectedProject.type)}</span>
                <h3 className="text-2xl font-bold text-white">{selectedProject.title}</h3>
                <p className="text-amber-200/80 text-sm mt-1">{selectedProject.type} • Due {formatDate(selectedProject.dueDate)}</p>
              </div>
              <button
                onClick={() => deleteProject(selectedProject.id)}
                onMouseEnter={playHoverSound}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Delete
              </button>
            </div>
            {selectedProject.description && (
              <p className="text-slate-300 mb-4">{selectedProject.description}</p>
            )}
            {selectedProject.aiOutline && (
              <div className="bg-black/20 rounded-xl p-4 mb-6">
                <p className="text-xs font-bold text-amber-400 uppercase mb-2">✨ AI Plan</p>
                <p className="text-slate-200 text-sm">{selectedProject.aiOutline}</p>
              </div>
            )}
            <h4 className="text-lg font-bold text-white mb-3">Milestones</h4>
            <div className="space-y-3">
              {selectedProject.milestones.map(m => (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl border flex items-start gap-4 ${
                    m.completed ? 'bg-green-900/20 border-green-500/30' : 'bg-slate-800/50 border-slate-600/50'
                  }`}
                >
                  <button
                    onClick={() => toggleMilestone(selectedProject.id, m.id)}
                    onMouseEnter={playHoverSound}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
                      m.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-500 hover:border-amber-500'
                    }`}
                  >
                    <CheckIcon className="w-5 h-5" />
                  </button>
                  <div>
                    <h5 className={`font-bold ${m.completed ? 'text-green-400 line-through' : 'text-white'}`}>
                      {m.title}
                    </h5>
                    {m.description && (
                      <p className="text-sm text-slate-400 mt-1">{m.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : showCreate ? (
        <div className="max-w-lg mx-auto w-full space-y-4">
          <div className="text-center mb-6">
            <SparklesIcon className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white">New School Project</h3>
            <p className="text-slate-400">Add your project and get an AI-generated plan with milestones.</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-1">Project Title *</label>
            <input
              type="text"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              placeholder="e.g., Solar System Model, History Essay..."
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-1">Description (optional)</label>
            <textarea
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              placeholder="Brief description of what you need to do..."
              rows={3}
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-1">Project Type</label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setFormType(t.value)}
                  onMouseEnter={playHoverSound}
                  className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all ${
                    formType === t.value
                      ? 'bg-amber-500/30 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-1">Due Date</label>
            <input
              type="date"
              value={formDueDate}
              onChange={e => setFormDueDate(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-600 text-white focus:border-amber-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => { setShowCreate(false); setError(null); }}
              onMouseEnter={playHoverSound}
              className="flex-1 py-3 rounded-lg border border-slate-600 text-slate-400 font-bold hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isLoading || !formTitle.trim()}
              className="flex-1 py-3 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-500 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>✨ Create with AI Plan</>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => setShowCreate(true)}
            onMouseEnter={playHoverSound}
            className="w-full py-6 rounded-2xl border-2 border-dashed border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/70 transition-all flex flex-col items-center gap-2"
          >
            <span className="text-4xl">➕</span>
            <span className="font-bold text-amber-400">Add New Project</span>
            <span className="text-sm text-slate-400">Get AI-generated milestones & plan</span>
          </button>
          {projects.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-lg">No projects yet.</p>
              <p className="text-sm mt-1">Add a school project to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map(p => {
                const done = p.milestones.filter(m => m.completed).length;
                const total = p.milestones.length;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    onMouseEnter={playHoverSound}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-600/50 hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTypeEmoji(p.type)}</span>
                      <div>
                        <h4 className="font-bold text-white">{p.title}</h4>
                        <p className="text-xs text-slate-400">
                          {p.type} • Due {formatDate(p.dueDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-amber-400 font-bold">{done}/{total}</span>
                      <p className="text-xs text-slate-500">milestones</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SchoolProjectsView;
