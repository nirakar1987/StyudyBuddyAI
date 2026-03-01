import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AppContextType } from '../types';
import { supabase } from '../services/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SendIcon } from './icons/SendIcon';
import { UsersIcon } from './icons/UsersIcon';
import { getMessages, insertMessage, ChatMessageRow, ChatMessageInsert } from '../services/databaseService';

// Updated state type for chat messages in the component
interface ChatMessage {
    id: string;
    sender: {
        id: string;
        name: string;
        avatar_url?: string;
    };
    content: string;
    timestamp: string;
}

// Helper to convert a database row to the component's state shape
const dbRowToChatMessage = (row: ChatMessageRow): ChatMessage => ({
    id: row.id,
    content: row.content,
    timestamp: row.created_at,
    sender: {
        id: row.sender_id,
        // Safely handle cases where sender_payload or its name property might be missing.
        name: row.sender_payload?.name || 'Unknown User',
        avatar_url: row.sender_payload?.avatar_url,
    },
});

const GlobalChatView: React.FC<{ context: AppContextType }> = ({ context }) => {
    const { user, studentProfile, chatPartner, onlineUsers } = context;
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Create a map of online users for quick lookups to display real-time names.
    const onlineUsersMap = useMemo(() =>
        new Map(onlineUsers.map(u => [u.id, u])),
        [onlineUsers]);

    const isDM = !!chatPartner;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    // Memoize channelId to keep it stable across re-renders
    const channelId = useMemo(() => {
        if (!user) return '';
        return isDM
            ? `dm-${[user.id, chatPartner.id].sort().join('-')}`
            : 'community-chat';
    }, [user, isDM, chatPartner]);

    // Load full history when channel is ready; then subscribe to realtime (WhatsApp-like).
    const setupChat = useCallback(async () => {
        if (!supabase || !user || !channelId) {
            setIsLoadingHistory(false);
            return;
        }
        if (!studentProfile) {
            setIsLoadingHistory(false);
            return;
        }

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        setIsLoadingHistory(true);
        setError(null);

        try {
            const historyRows = await getMessages(channelId);
            setMessages(historyRows.map(dbRowToChatMessage));
        } catch (err) {
            setError('Failed to load chat history.');
            setMessages([]);
        } finally {
            setIsLoadingHistory(false);
        }

        const handleNewMessage = (payload: any) => {
            const newChatMessage = dbRowToChatMessage(payload.new as ChatMessageRow);
            setMessages(prev => {
                if (prev.some(m => m.id === newChatMessage.id)) return prev;
                // Replace optimistic (temp) message from current user with same content
                const fromMe = newChatMessage.sender.id === user?.id;
                if (fromMe) {
                    const withoutTemp = prev.filter(m => !(m.id.startsWith('temp-') && m.sender.id === user?.id && m.content === newChatMessage.content));
                    if (withoutTemp.length < prev.length) return [...withoutTemp, newChatMessage];
                }
                return [...prev, newChatMessage];
            });
        };

        const channel = supabase.channel(`realtime-chat:${channelId}`);

        channel.on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `channel_id=eq.${channelId}`
        }, handleNewMessage);

        channel.subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                console.log(`Successfully subscribed to channel: ${channelId}`);
                setError(null); // Clear previous errors on successful subscription
            }
            if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
                console.error('Realtime subscription error:', err);
                setError('Connection to chat lost. Please try again.');
            }
        });

        channelRef.current = channel;

    }, [channelId, user?.id, studentProfile]);

    useEffect(() => {
        setupChat();
        return () => {
            if (channelRef.current) {
                supabase?.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [setupChat]);

    // Polling fallback: fetch new messages every 3s so chat works even if Realtime is off (WhatsApp-like)
    useEffect(() => {
        if (!channelId || isLoadingHistory || error) return;
        const poll = async () => {
            try {
                const rows = await getMessages(channelId);
                setMessages(prev => {
                    const byId = new Map(prev.map(m => [m.id, m]));
                    rows.forEach(row => {
                        const msg = dbRowToChatMessage(row);
                        if (!byId.has(msg.id)) byId.set(msg.id, msg);
                    });
                    return Array.from(byId.values()).sort(
                        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    );
                });
            } catch (_) { /* ignore poll errors */ }
        };
        const t = setInterval(poll, 2000);
        return () => clearInterval(t);
    }, [channelId, isLoadingHistory, error]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = messageInput.trim();
        if (!content || !user || !studentProfile || !channelId) return;

        const messagePayload: ChatMessageInsert = {
            channel_id: channelId,
            sender_id: user.id,
            content,
            sender_payload: {
                name: studentProfile.name,
                avatar_url: studentProfile.avatar_url,
            },
        };

        const tempId = `temp-${Date.now()}`;
        const optimisticMsg: ChatMessage = {
            id: tempId,
            content,
            timestamp: new Date().toISOString(),
            sender: {
                id: user.id,
                name: studentProfile.name,
                avatar_url: studentProfile.avatar_url,
            },
        };

        setMessageInput('');
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            const inserted = await insertMessage(messagePayload);
            if (inserted) {
                setMessages(prev => prev.map(m => m.id === tempId ? dbRowToChatMessage(inserted) : m));
            }
        } catch (err) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setMessageInput(content);
            setError('Failed to send message.');
        }
    };

    return (
        <div className={`flex flex-col md:flex-row h-full max-h-[75vh] animate-fade-in ${isDM ? '' : 'gap-4'}`}>
            {!isDM && (
                <div className="flex-shrink-0 md:w-1/3 lg:w-1/4 bg-[var(--color-surface-light)]/50 rounded-lg p-4 flex flex-col">
                    <h3 className="text-lg font-bold text-[var(--color-primary)] border-b border-[var(--color-border)] pb-2 mb-2 flex items-center gap-2">
                        <UsersIcon className="w-6 h-6" /> Online ({onlineUsers.length})
                    </h3>
                    <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                        {onlineUsers.map(u => (
                            <div key={u.id} className="flex items-center gap-3">
                                <div className="relative flex-shrink-0">
                                    <img src={u.avatar_url || 'https://api.dicebear.com/9.x/micah/svg?seed=student'} alt={u.name} className="w-10 h-10 rounded-full object-cover bg-[var(--color-surface-lighter)]" />
                                    <span
                                        className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-[var(--color-surface-light)] bg-green-500"
                                        title="Online"
                                    />
                                </div>
                                <span className="font-semibold text-[var(--color-text-secondary)] truncate">{u.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className={`flex-grow flex flex-col rounded-lg ${isDM ? 'bg-transparent' : 'bg-[var(--color-surface-light)]/50'}`}>
                <h2 className="text-2xl font-bold text-[var(--color-primary)] p-4 border-b border-[var(--color-border)]">
                    {isDM ? `Chat with ${chatPartner.name}` : 'Community Chat'}
                </h2>
                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    {isLoadingHistory && (
                        <div className="flex-grow flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-[var(--color-surface-lighter)] border-t-[var(--color-primary)] rounded-full animate-spin"></div>
                        </div>
                    )}
                    {!isLoadingHistory && error && (
                        <div className="flex-grow flex items-center justify-center text-center h-full">
                            <div>
                                <p className="text-[var(--color-danger)]">{error}</p>
                                <button onClick={setupChat} className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold">
                                    Retry
                                </button>
                            </div>
                        </div>
                    )}
                    {!isLoadingHistory && !error && messages.length === 0 && (
                        <div className="flex-grow flex items-center justify-center text-center text-[var(--color-text-muted)] h-full">
                            <p>{isDM ? 'No messages yet. Say hello!' : 'Welcome to the community chat! Be the first to start a conversation.'}</p>
                        </div>
                    )}
                    {!error && messages.map((msg) => {
                        const isMe = msg.sender.id === user?.id;
                        // Use the real-time presence data for the most up-to-date sender info,
                        // but fall back to the data saved with the message.
                        const sender = onlineUsersMap.get(msg.sender.id) || msg.sender;
                        return (
                            <div key={msg.id} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                <img src={sender.avatar_url || 'https://api.dicebear.com/9.x/micah/svg?seed=student'} alt={sender.name} className="w-10 h-10 rounded-full object-cover bg-[var(--color-surface-lighter)]" />
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-3 rounded-lg max-w-md ${isMe ? 'bg-[var(--color-primary-action)] text-white rounded-br-none' : 'bg-[var(--color-surface-light)] text-[var(--color-text-primary)] rounded-bl-none'}`}>
                                        {!isMe && <p className="text-sm font-bold text-[var(--color-primary)] mb-1">{sender.name}</p>}
                                        <p className="text-base break-words">{msg.content}</p>
                                    </div>
                                    <span className="text-xs text-[var(--color-text-muted)] mt-1">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--color-border)] flex items-center gap-2">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-grow bg-[var(--color-surface-light)] border border-[var(--color-surface-lighter)] rounded-lg p-3 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
                        disabled={!!error || isLoadingHistory}
                    />
                    <button type="submit" disabled={!messageInput.trim() || !!error || isLoadingHistory} className="p-3 bg-[var(--color-secondary-action)] hover:bg-violet-700 rounded-full disabled:bg-[var(--color-surface-lighter)] text-white">
                        <SendIcon className="w-6 h-6" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GlobalChatView;