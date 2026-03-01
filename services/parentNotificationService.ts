import { supabase } from './supabaseClient';
import type { ParentNotificationEventType } from '../types';

const EDGE_FUNCTION_NOTIFY_PARENT = 'notify-parent';

export interface QuizActivityPayload {
  studentName: string;
  subject: string;
  grade: number;
  score: number;
  total: number;
  topics?: string[];
}

export interface PracticeActivityPayload {
  studentName: string;
  subject: string;
  topic: string;
  correct: boolean;
}

/**
 * Builds a short, parent-friendly message for sharing (WhatsApp/Telegram copy).
 */
export function buildActivityMessage(
  eventType: ParentNotificationEventType,
  payload: QuizActivityPayload | PracticeActivityPayload
): string {
  const lines: string[] = ['📚 StudyBuddy – Activity update'];
  if (eventType === 'quiz_complete' && 'total' in payload) {
    const p = payload as QuizActivityPayload;
    const pct = p.total ? Math.round((p.score / p.total) * 100) : 0;
    lines.push(`${p.studentName} completed a quiz: ${p.subject} (Grade ${p.grade}).`);
    lines.push(`Score: ${p.score}/${p.total} (${pct}%).`);
    if (p.topics?.length) lines.push(`Topics: ${p.topics.slice(0, 3).join(', ')}.`);
  } else if (eventType === 'practice_complete' && 'topic' in payload) {
    const p = payload as PracticeActivityPayload;
    lines.push(`${p.studentName} did a practice problem: ${p.subject} – ${p.topic}.`);
    lines.push(p.correct ? '✅ Answer was correct!' : '📝 Reviewed with feedback.');
  } else {
    lines.push(JSON.stringify(payload));
  }
  return lines.join('\n');
}

/**
 * Sends an activity notification to the parent via Telegram (if they linked the bot).
 * Calls Supabase Edge Function; no-op if function missing or parent not linked.
 */
export async function notifyParentViaTelegram(
  userId: string,
  eventType: ParentNotificationEventType,
  summary: string
): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.functions.invoke(EDGE_FUNCTION_NOTIFY_PARENT, {
      body: { userId, eventType, summary },
    });
    if (error) {
      console.warn('Parent Telegram notify failed (may be unlinked):', error.message);
    }
  } catch (e) {
    console.warn('Parent Telegram notify error:', e);
  }
}

/**
 * Returns WhatsApp share URL. If parentPhone is set (e.g. 919876543210), opens chat with that number.
 */
export function getWhatsAppShareUrl(message: string, parentPhone?: string | null): string {
  const encoded = encodeURIComponent(message);
  if (parentPhone) {
    const num = parentPhone.replace(/\D/g, '');
    return `https://wa.me/${num}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

/**
 * Copy message to clipboard; returns true if successful.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
