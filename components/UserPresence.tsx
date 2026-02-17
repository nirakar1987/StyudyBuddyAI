import React from 'react';
import { User } from '@supabase/supabase-js';
import { UsersIcon } from './icons/UsersIcon';
import { ChatBubbleOvalLeftEllipsisIcon } from './icons/ChatBubbleOvalLeftEllipsisIcon';
import { OnlineUser } from '../types';

interface UserPresenceProps {
    user: User | null;
    onlineUsers: OnlineUser[];
    startGlobalChat: (partner: OnlineUser) => void;
}

const UserPresence: React.FC<UserPresenceProps> = ({ user, onlineUsers, startGlobalChat }) => {
    const otherUsers = onlineUsers.filter(u => u.id !== user?.id);

    return (
        <div className="p-4 bg-[var(--color-surface)] rounded-lg">
            <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3 text-center flex items-center justify-center gap-2">
                <UsersIcon className="w-6 h-6" />
                Online Now ({onlineUsers.length})
            </h2>
            <div className="max-h-48 overflow-y-auto pr-2 text-left space-y-3">
                {otherUsers.length > 0 ? (
                    otherUsers.map(onlineUser => (
                        <div key={onlineUser.id} className="flex items-center justify-between gap-3 animate-fade-in" style={{ animationDuration: '300ms' }}>
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="relative flex-shrink-0">
                                    <img src={onlineUser.avatar_url || 'https://api.dicebear.com/9.x/micah/svg?seed=student'} alt={onlineUser.name} className="w-10 h-10 rounded-full object-cover bg-[var(--color-surface-lighter)]" />
                                    <span
                                        className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-[var(--color-surface)] bg-green-500 animate-online-pulse"
                                        title="Online"
                                    />
                                </div>
                                <span className="font-semibold truncate text-[var(--color-text-primary)]">
                                    {onlineUser.name}
                                </span>
                            </div>
                            <button
                                onClick={() => startGlobalChat(onlineUser)}
                                className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors flex-shrink-0"
                                title={`Chat with ${onlineUser.name}`}
                            >
                                <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-sm text-[var(--color-text-muted)] py-4">It's quiet right now... no one else is online.</p>
                )}
            </div>
        </div>
    );
};

export default UserPresence;
