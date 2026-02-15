import { supabase } from './supabaseClient';
import { StudentProfile, QuizAttempt } from '../types';

// New type for chat message insertion
export interface ChatMessageInsert {
    channel_id: string;
    sender_id: string;
    content: string;
    sender_payload: {
        name: string;
        avatar_url?: string;
    };
}

// New type for a row from the chat_messages table
export interface ChatMessageRow {
    id: string;
    created_at: string;
    channel_id: string;
    sender_id: string;
    content: string;
    sender_payload: {
        name: string;
        avatar_url?: string;
    };
}


/**
 * Fetches a user's profile from the database and parses JSON fields.
 * @param userId - The ID of the user.
 * @returns The user's profile or null if not found.
 */
export async function getProfile(userId: string): Promise<StudentProfile | null> {
  const { data, error } = await supabase!
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = 'exact one row not found'
    console.error('Error getting profile:', JSON.stringify(error, null, 2));
    throw error;
  }

  if (data) {
    // Safely parse JSON fields that might be stored as strings
    return {
      ...data,
      name: data.full_name || '', // Read from the new 'full_name' database column.
      topic_performance: typeof data.topic_performance === 'string' ? JSON.parse(data.topic_performance) : data.topic_performance || {},
      completed_modules: typeof data.completed_modules === 'string' ? JSON.parse(data.completed_modules) : data.completed_modules || [],
    };
  }
  return null;
}

/**
 * Creates or updates a user's profile, stringifying JSON fields for storage.
 * @param profile - The profile data to save.
 */
export async function upsertProfile(profile: StudentProfile & { id: string }) {
  const profileData = {
      id: profile.id,
      full_name: profile.name, // Save the name to the new 'full_name' database column.
      grade: profile.grade,
      subject: profile.subject,
      topic_performance: JSON.stringify(profile.topic_performance || {}),
      score: profile.score ?? 0,
      streak: profile.streak ?? 1,
      completed_modules: JSON.stringify(profile.completed_modules || []),
      theme: profile.theme,
      avatar_style: profile.avatar_style,
      // avatar_url is intentionally omitted as it's not in the DB schema.
      // It is persisted in localStorage instead (see App.tsx).
  };

  const { error } = await supabase!
    .from('profiles')
    .upsert(profileData);
    
  if (error) {
    console.error('Error upserting profile:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Adds a completed quiz attempt, stringifying JSON fields for storage.
 * @param userId - The ID of the user who took the quiz.
 * @param attemptData - The data for the quiz attempt.
 */
export async function addQuizAttempt(userId: string, attemptData: Omit<QuizAttempt, 'id' | 'created_at' | 'user_id' | 'evaluation_results'> & { name: string }) {
  const payload = {
    user_id: userId,
    grade: attemptData.grade,
    subject: attemptData.subject,
    score: attemptData.score,
    total_questions: attemptData.total_questions,
    questions: JSON.stringify(attemptData.questions || []),
    user_answers: JSON.stringify(attemptData.user_answers || {}),
    topics: JSON.stringify(attemptData.topics || []),
  };

  const { error } = await supabase!
    .from('quiz_history')
    .insert(payload);

  if (error) {
    console.error('Error adding quiz attempt:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Fetches quiz history and parses JSON fields from text.
 * @param userId - The ID of the user.
 * @returns A list of the user's past quiz attempts.
 */
export async function getQuizHistory(userId: string): Promise<QuizAttempt[]> {
  const { data, error } = await supabase!
    .from('quiz_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting quiz history:', JSON.stringify(error, null, 2));
    throw error;
  }
  
  if (data) {
    // Safely parse fields that are stored as JSON strings
    return data.map(attempt => ({
      ...attempt,
      questions: typeof attempt.questions === 'string' ? JSON.parse(attempt.questions) : attempt.questions || [],
      user_answers: typeof attempt.user_answers === 'string' ? JSON.parse(attempt.user_answers) : attempt.user_answers || {},
      topics: typeof attempt.topics === 'string' ? JSON.parse(attempt.topics) : attempt.topics || [],
      evaluation_results: typeof attempt.evaluation_results === 'string' ? JSON.parse(attempt.evaluation_results) : attempt.evaluation_results || [],
    }));
  }

  return [];
}

/**
 * Deletes all quiz history for the currently authenticated user.
 * This function now fetches the user internally to ensure the correct user ID is used.
 * 
 * **DATABASE SETUP NOTE:**
 * This requires a Row Level Security (RLS) policy in Supabase that allows
 * users to delete their own records from the `quiz_history` table.
 */
export async function clearQuizHistory(): Promise<void> {
  // Directly fetch the current user to ensure we have the correct, authenticated user ID.
  const { data: { user } } = await supabase!.auth.getUser();

  if (!user) {
    console.error('Clear history failed: User not signed in.');
    throw new Error('You must be signed in to clear your history.');
  }

  const { error } = await supabase!
    .from('quiz_history')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    console.error('Error clearing quiz history:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Fetches historical messages for a given chat channel.
 * @param channelId - The ID of the chat channel.
 * @returns A list of chat messages.
 */
export async function getMessages(channelId: string): Promise<ChatMessageRow[]> {
    const { data, error } = await supabase!
        .from('chat_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching chat messages:', JSON.stringify(error, null, 2));
        throw error;
    }
    
    return data || [];
}

/**
 * Inserts a new message into the chat_messages table.
 * @param message - The message data to insert.
 */
export async function insertMessage(message: ChatMessageInsert) {
    const { error } = await supabase!
        .from('chat_messages')
        .insert(message);
        
    if (error) {
        console.error('Error inserting chat message:', JSON.stringify(error, null, 2));
        throw error;
    }
}