import React, { useState, useEffect } from 'react';
import { AppState, AppContextType } from '../types';
import { UsersIcon } from './icons/UsersIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';

interface MultiplayerChallengeViewProps {
    context: AppContextType;
}

const MultiplayerChallengeView: React.FC<MultiplayerChallengeViewProps> = ({ context }) => {
    const { user, studentProfile, setAppState } = context;
    const [leaderboard, setLeaderboard] = useState([
        { rank: 1, name: "Aarav Sharma", score: 2450, badge: "Master" },
        { rank: 2, name: "Priya Patel", score: 2310, badge: "Expert" },
        { rank: 3, name: "Rohan Gupta", score: 2180, badge: "Expert" },
        { rank: 4, name: "Sneha K.", score: 1950, badge: "Advanced" },
        { rank: 5, name: "You", score: studentProfile?.score || 0, badge: "Rising Star" },
    ]);

    useEffect(() => {
        // Simulate real-time updates
        const interval = setInterval(() => {
            setLeaderboard(prev => {
                const newBoard = [...prev];
                // Randomly update scores
                newBoard[0].score += Math.floor(Math.random() * 10);
                newBoard[1].score += Math.floor(Math.random() * 15);
                return newBoard.sort((a, b) => b.score - a.score).map((p, i) => ({ ...p, rank: i + 1 }));
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);

    // Filter out current user from online users list
    const availableOpponents = context.onlineUsers.filter(u => u.id !== user?.id);

    const handleChallengeClick = () => {
        setIsChallengeModalOpen(true);
    };

    const handleSelectOpponent = (opponent: any) => {
        setIsChallengeModalOpen(false);
        context.startGlobalChat(opponent);
    };

    return (
        <div className="flex flex-col h-full animate-fade-in pb-4 relative">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-indigo-400 flex items-center gap-2">
                    <TrophyIcon className="w-8 h-8" /> Class Leaderboard
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleChallengeClick}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold text-white flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                    >
                        <UsersIcon className="w-5 h-5" /> Challenge a Friend
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 bg-slate-900/50 rounded-2xl border border-slate-700">
                <table className="w-full text-left">
                    <thead className="bg-slate-800 text-slate-400 uppercase text-xs font-bold sticky top-0">
                        <tr>
                            <th className="p-4 w-16 text-center">Rank</th>
                            <th className="p-4">Student</th>
                            <th className="p-4">Badge</th>
                            <th className="p-4 text-right">Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {leaderboard.map((player) => (
                            <tr key={player.name} className={`hover:bg-slate-800/50 transition-colors ${player.name === 'You' ? 'bg-indigo-900/20 border-l-4 border-indigo-500' : ''}`}>
                                <td className="p-4 text-center font-bold text-slate-300">
                                    {player.rank === 1 && <span className="text-yellow-400 text-lg">🥇</span>}
                                    {player.rank === 2 && <span className="text-slate-300 text-lg">🥈</span>}
                                    {player.rank === 3 && <span className="text-amber-600 text-lg">🥉</span>}
                                    {player.rank > 3 && `#${player.rank}`}
                                </td>
                                <td className="p-4 font-semibold text-white">{player.name}</td>
                                <td className="p-4 text-sm text-slate-400">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${player.badge === 'Master' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700' :
                                        player.badge === 'Expert' ? 'bg-purple-900/50 text-purple-400 border border-purple-700' :
                                            'bg-slate-700 text-slate-300'
                                        }`}>
                                        {player.badge}
                                    </span>
                                </td>
                                <td className="p-4 text-right font-mono font-bold text-cyan-400">{player.score}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex justify-start">
                <button
                    onClick={() => setAppState(AppState.DASHBOARD)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-700 font-semibold"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" /> Back to Dashboard
                </button>
            </div>

            {/* Challenge Modal */}
            {isChallengeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-800 border border-indigo-500/30 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-indigo-500/20 flex justify-between items-center bg-indigo-500/10">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <UsersIcon className="w-6 h-6 text-indigo-400" />
                                Select Opponent
                            </h3>
                            <button
                                onClick={() => setIsChallengeModalOpen(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {availableOpponents.length > 0 ? (
                                <div className="space-y-2 p-2">
                                    {availableOpponents.map(opponent => (
                                        <button
                                            key={opponent.id}
                                            onClick={() => handleSelectOpponent(opponent)}
                                            className="w-full flex items-center gap-4 p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700 hover:border-indigo-500/50 border border-transparent transition-all group"
                                        >
                                            <div className="relative">
                                                <img
                                                    src={opponent.avatar_url || 'https://api.dicebear.com/9.x/micah/svg?seed=student'}
                                                    alt={opponent.name}
                                                    className="w-12 h-12 rounded-full object-cover bg-slate-600"
                                                />
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full"></div>
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-white group-hover:text-indigo-300 transition-colors">{opponent.name}</p>
                                                <p className="text-xs text-indigo-400">Online & Ready</p>
                                            </div>
                                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="px-3 py-1 bg-indigo-600 rounded-lg text-xs font-bold text-white">Challenge!</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-slate-400">
                                    <p className="mb-2">😔 No friends online right now.</p>
                                    <p className="text-sm opacity-70">Invite your classmates to join!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultiplayerChallengeView;
