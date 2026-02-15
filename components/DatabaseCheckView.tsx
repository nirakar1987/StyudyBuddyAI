
import React, { useState, useEffect } from 'react';
import { AppContextType, AppState } from '../types';
import { supabase, supabaseUrl } from '../services/supabaseClient';
import { CheckIcon } from './icons/CheckIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { GlobeAltIcon } from './icons/GlobeAltIcon';

interface DatabaseCheckViewProps {
    context: AppContextType;
}

interface DiagnosticStep {
    id: string;
    label: string;
    status: 'pending' | 'loading' | 'success' | 'error';
    message?: string;
}

const DatabaseCheckView: React.FC<DatabaseCheckViewProps> = ({ context }) => {
    const [steps, setSteps] = useState<DiagnosticStep[]>([
        { id: 'network', label: 'Server Connectivity', status: 'pending' },
        { id: 'auth', label: 'API Key Verification', status: 'pending' },
        { id: 'profiles', label: 'Table: profiles', status: 'pending' },
        { id: 'quiz_history', label: 'Table: quiz_history', status: 'pending' },
        { id: 'chat_messages', label: 'Table: chat_messages', status: 'pending' },
    ]);
    const [isChecking, setIsChecking] = useState(false);
    const [log, setLog] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setLog(prev => [...prev.slice(-3), `> ${msg}`]);
    };

    const runChecks = async () => {
        if (!supabase) {
            addLog("Error: Supabase client is null.");
            return;
        }

        setIsChecking(true);
        setLog(["Starting connection audit..."]);
        
        // Reset all steps to loading
        setSteps(prev => prev.map(s => ({ ...s, status: 'loading', message: undefined })));

        // 1. Network / Server Check
        try {
            const resp = await fetch(`${supabaseUrl}/rest/v1/`, { method: 'GET' });
            if (resp.status === 401 || resp.ok) {
                setSteps(prev => prev.map(s => s.id === 'network' ? { ...s, status: 'success' } : s));
                addLog("Server reached successfully.");
            } else {
                throw new Error(`Server status: ${resp.status}`);
            }
        } catch (e: any) {
            setSteps(prev => prev.map(s => s.id === 'network' ? { ...s, status: 'error', message: 'Could not reach Supabase. Is the project paused?' } : s));
            addLog(`Network failed: ${e.message}`);
            setIsChecking(false);
            return;
        }

        // 2. Auth / Key Check
        try {
            // A simple query to see if the key is accepted
            const { error } = await supabase.from('profiles').select('count').limit(1);
            // 42P01 means table doesn't exist, but the key was accepted (auth passed)
            // 401/PGRST301 means the key is invalid
            if (error && (error.code === '401' || error.code === 'PGRST301')) {
                setSteps(prev => prev.map(s => s.id === 'auth' ? { ...s, status: 'error', message: 'Invalid API Key' } : s));
                addLog("Auth failed: Invalid API Key.");
                setIsChecking(false);
                return;
            } else {
                setSteps(prev => prev.map(s => s.id === 'auth' ? { ...s, status: 'success' } : s));
                addLog("Auth verified.");
            }
        } catch (e: any) {
            setSteps(prev => prev.map(s => s.id === 'auth' ? { ...s, status: 'error', message: e.message } : s));
            setIsChecking(false);
            return;
        }

        // 3. Table Checks (The tables you created via SQL)
        const tables = ['profiles', 'quiz_history', 'chat_messages'];
        for (const tableName of tables) {
            addLog(`Verifying ${tableName}...`);
            const { error } = await supabase.from(tableName).select('count', { count: 'exact', head: true });
            
            if (error && error.code === '42P01') {
                setSteps(prev => prev.map(s => s.id === tableName ? { ...s, status: 'error', message: 'Table not found' } : s));
                addLog(`${tableName} is missing.`);
            } else {
                setSteps(prev => prev.map(s => s.id === tableName ? { ...s, status: 'success' } : s));
                addLog(`${tableName} is ready.`);
            }
        }

        setIsChecking(false);
    };

    useEffect(() => {
        runChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const allTablesOk = steps.filter(s => ['profiles', 'quiz_history', 'chat_messages'].includes(s.id)).every(s => s.status === 'success');
    const criticalOk = steps.find(s => s.id === 'network')?.status === 'success' && steps.find(s => s.id === 'auth')?.status === 'success';

    return (
        <div className="flex flex-col h-full animate-fade-in max-w-xl mx-auto py-6">
            <div className="text-center mb-8">
                <div className="inline-block p-3 bg-[var(--color-primary)]/10 rounded-full mb-4">
                    <GlobeAltIcon className="w-10 h-10 text-[var(--color-primary)]" />
                </div>
                <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">Database Setup Check</h2>
                <p className="text-[var(--color-text-muted)] mt-2">Checking project: <span className="text-[var(--color-primary)] font-mono">exyefpzjknrgyyunsxyb</span></p>
            </div>

            <div className="bg-[var(--color-surface-light)]/30 rounded-2xl p-6 border border-[var(--color-border)] shadow-xl mb-6">
                <div className="space-y-3">
                    {steps.map((step) => (
                        <div key={step.id} className="flex items-center justify-between p-3 bg-[var(--color-surface)]/50 rounded-lg border border-[var(--color-border)]/50">
                            <div className="flex flex-col">
                                <span className={`text-sm font-bold ${step.status === 'error' ? 'text-red-400' : 'text-[var(--color-text-secondary)]'}`}>{step.label}</span>
                                {step.message && <span className="text-[10px] text-red-500 font-medium">{step.message}</span>}
                            </div>
                            <div className="flex-shrink-0">
                                {step.status === 'loading' ? (
                                    <div className="w-5 h-5 border-2 border-[var(--color-surface-lighter)] border-t-[var(--color-primary)] rounded-full animate-spin"></div>
                                ) : step.status === 'success' ? (
                                    <CheckIcon className="w-5 h-5 text-green-500" />
                                ) : step.status === 'error' ? (
                                    <XMarkIcon className="w-5 h-5 text-red-500" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full border border-dashed border-[var(--color-border)]"></div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 p-3 bg-black/40 rounded-lg font-mono text-[10px] text-cyan-500/80">
                    {log.map((line, i) => <p key={i}>{line}</p>)}
                </div>
            </div>

            {allTablesOk && criticalOk ? (
                <div className="animate-fade-in">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6 text-center">
                        <p className="text-green-400 font-bold text-sm">Perfect! Your database is fully connected and the tables are ready.</p>
                    </div>
                    <button 
                        onClick={() => context.setAppState(AppState.AUTH)}
                        className="w-full group flex items-center justify-center gap-3 px-8 py-4 bg-[var(--color-success)] hover:bg-green-500 text-slate-900 rounded-xl font-black text-xl shadow-lg transition-all active:scale-95"
                    >
                        Go to Login
                        <ArrowRightIcon className="w-6 h-6" />
                    </button>
                </div>
            ) : !isChecking && (
                <div className="space-y-4">
                    {!criticalOk && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                            <p className="text-red-400 text-xs font-medium">Cannot reach the Supabase server. Please check your internet or wait a moment for the server to wake up.</p>
                        </div>
                    )}
                    {criticalOk && !allTablesOk && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                            <p className="text-amber-400 text-xs font-medium">Connection is good, but the SQL tables aren't found. Make sure you ran the SQL query in the Supabase Editor.</p>
                        </div>
                    )}
                    <button 
                        onClick={runChecks}
                        className="w-full px-6 py-4 bg-[var(--color-surface-light)] hover:bg-[var(--color-surface-lighter)] text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-[var(--color-border)]"
                    >
                        <ArrowPathIcon className="w-5 h-5" />
                        Run Diagnostic Again
                    </button>
                    <button 
                        onClick={() => context.setAppState(AppState.AUTH)}
                        className="w-full text-[var(--color-text-muted)] hover:text-white text-sm underline"
                    >
                        Return to Login
                    </button>
                </div>
            )}
        </div>
    );
};

export default DatabaseCheckView;
