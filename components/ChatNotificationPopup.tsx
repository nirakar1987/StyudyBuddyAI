import React, { useEffect } from 'react';
import { OnlineUser } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { ChatBubbleOvalLeftEllipsisIcon } from './icons/ChatBubbleOvalLeftEllipsisIcon';

interface ChatNotificationPopupProps {
    sender: OnlineUser;
    message: string;
    onAccept: () => void;
    onDismiss: () => void;
}

const ChatNotificationPopup: React.FC<ChatNotificationPopupProps> = ({ sender, message, onAccept, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, 10000); // Auto-dismiss after 10 seconds

        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div
            className="fixed bottom-5 right-5 w-full max-w-sm bg-[var(--color-surface)] rounded-xl shadow-2xl border border-[var(--color-border)] z-50 animate-fade-in"
            role="alert"
            aria-live="assertive"
        >
            <div className="p-4">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 relative">
                        <img
                            className="h-12 w-12 rounded-full object-cover"
                            src={sender.avatar_url || 'https://api.dicebear.com/9.x/micah/svg?seed=student'}
                            alt={`${sender.name}'s avatar`}
                        />
                        <span className="absolute -bottom-1 -right-1 bg-fuchsia-500 p-1 rounded-full border-2 border-[var(--color-surface)]">
                            <ChatBubbleOvalLeftEllipsisIcon className="w-4 h-4 text-white" />
                        </span>
                    </div>
                    <div className="w-0 flex-1">
                        <p className="text-base font-bold text-[var(--color-text-primary)]">{sender.name}</p>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)] line-clamp-2">
                            {message}
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <button
                            type="button"
                            className="inline-flex rounded-md p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-light)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] focus:ring-offset-[var(--color-surface)]"
                            onClick={onDismiss}
                            aria-label="Dismiss notification"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                <div className="mt-4 flex gap-3">
                    <button
                        type="button"
                        className="flex-1 w-full rounded-md border border-transparent bg-[var(--color-primary-action)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-hover)] focus:outline-none"
                        onClick={onAccept}
                    >
                        View Message
                    </button>
                    <button
                        type="button"
                        className="flex-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-light)] px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-lighter)] focus:outline-none"
                        onClick={onDismiss}
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatNotificationPopup;
