
import { User } from '@supabase/supabase-js';

export enum AppState {
  LANDING_PAGE,
  AUTH,
  PROFILE_SETUP,
  DASHBOARD,
  LESSON,
  UPLOAD,
  QUIZ,
  QUIZ_RESULTS,
  PROGRESS_REPORT,
  ORAL_QUIZ,
  PRACTICE_SESSION,
  QUIZ_HISTORY,
  QUIZ_ATTEMPT_DETAILS,
  AVATAR_CUSTOMIZATION,
  SOLVE_ISSUE,
  VIDEO_GENERATION,
  GLOBAL_CHAT,
  DB_CHECK,
  WHITEBOARD,
  STUDY_PLAN,
  ANALYTICS,
  CHAPTER_QA,
  TIME_TRAVEL,
  PODCASTIFY,
  MULTIPLAYER_CHALLENGE,
  MATH_MASTERY,
  BOOK_QUIZ,
  FLASHCARDS,
}

export enum AvatarState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
}

export interface StudentProfile {
  id?: string;
  name: string;
  grade: number;
  subject: string;
  topic_performance: Record<string, 'weak' | 'strong' | 'neutral'>;
  score?: number;
  streak?: number;
  completed_modules?: string[];
  theme?: string;
  avatar_style?: string;
  avatar_url?: string;
}

export enum QuestionType {
  MCQ = 'Multiple Choice',
  SHORT_ANSWER = 'Short Answer',
  FILL_IN_THE_BLANK = 'Fill in the Blank',
  TRUE_FALSE = 'True/False',
}

export interface GeneratedQuestion {
  questionText: string;
  questionType: QuestionType;
  options?: string[];
  correctAnswer: string;
  hint?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface GeneratedQuiz {
  questions: GeneratedQuestion[];
  topics: string[];
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  created_at: string;
  subject: string;
  grade: number;
  score: number;
  total_questions: number;
  questions: GeneratedQuestion[];
  user_answers: Record<number, string>;
  topics: string[];
  evaluation_results?: boolean[];
}

export type ChatPart = { text: string } | { inlineData: { mimeType: string; data: string } };

export interface ChatMessage {
  role: 'user' | 'model';
  parts: ChatPart[];
  groundingMetadata?: any;
}

export interface LearningModule {
  id: string;
  title: string;
  subject: string;
  description: string;
  requiredTopics: string[];
  grades?: number[];
}

export interface PracticeProblem {
  question: string;
  topic: string;
}

export interface ProblemFeedback {
  isCorrect: boolean;
  feedbackText: string;
}

export interface OnlineUser {
  id: string;
  name: string;
  avatar_url?: string;
}

export interface VideoData {
  youtubeId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
}


export interface QuizSource {
  type: 'upload' | 'book' | 'topic' | 'mixed';
  data: any; // File[] for upload, string for book/topic
}

export interface AppContextType {
  appState: AppState;
  user: User | null;
  studentProfile: StudentProfile | null;
  generatedQuiz: GeneratedQuiz | null;
  quizSource: QuizSource | null;
  avatarState: AvatarState;
  chatHistory: ChatMessage[];
  score: number;
  streak: number;
  progressReport: string;
  userAnswers: Record<number, string>;
  quizScore: { score: number; total: number } | null;
  quizResults: boolean[] | null;
  lastUploadedFiles: File[];
  quizCustomization: { numQuestions: number; difficulty: string; duration: number; numOptions: number; };
  learningModules: LearningModule[];
  completedModules: string[];
  lastModuleCompleted: string | null;
  practiceProblem: PracticeProblem | null;
  userPracticeAnswer: string;
  problemFeedback: ProblemFeedback | null;
  quizHistory: QuizAttempt[] | null;
  selectedQuizAttempt: QuizAttempt | null;
  theme: string;
  isSubmitting: boolean;
  submissionError: string | null;
  onlineUsers: OnlineUser[];
  chatPartner: OnlineUser | null;
  setAppState: (state: AppState) => void;
  setStudentProfile: (profile: StudentProfile | null | ((prev: StudentProfile | null) => StudentProfile | null)) => Promise<void>;
  setGeneratedQuiz: (quiz: GeneratedQuiz | null) => void;
  setAvatarState: (state: AvatarState) => void;
  setChatHistory: (history: ChatMessage[] | ((prevHistory: ChatMessage[]) => ChatMessage[])) => void;
  setScore: (score: number | ((prevScore: number) => number)) => Promise<void>;
  setStreak: (streak: number | ((prevStreak: number) => number)) => void;
  setProgressReport: (report: string) => void;
  setUserAnswers: (answers: Record<number, string> | ((prevAnswers: Record<number, string>) => Record<number, string>)) => void;
  setQuizScore: (score: { score: number; total: number } | null) => void;
  setQuizResults: (results: boolean[] | null) => void;
  setQuizSource: (source: QuizSource | null) => void;
  setLastUploadedFiles: (files: File[] | ((prev: File[]) => File[])) => void;
  setQuizCustomization: (customization: { numQuestions: number; difficulty: string; duration: number; numOptions: number; } | ((prev: { numQuestions: number; difficulty: string; duration: number; numOptions: number; }) => { numQuestions: number; difficulty: string; duration: number; numOptions: number; })) => void;
  setPracticeProblem: (problem: PracticeProblem | null) => void;
  setUserPracticeAnswer: (answer: string | ((prev: string) => string)) => void;
  setProblemFeedback: (feedback: ProblemFeedback | null) => void;
  setQuizHistory: (history: QuizAttempt[] | null) => void;
  setSelectedQuizAttempt: (attempt: QuizAttempt | null) => void;
  setTheme: (theme: string) => Promise<void>;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setSubmissionError: (error: string | null) => void;
  startApp: () => void;
  startLesson: () => void;
  startPracticeSession: () => void;
  startSolveIssue: () => void;
  startVideoGeneration: () => void;
  startGlobalChat: (partner?: OnlineUser) => void;
  onQuestionsGenerated: (quiz: GeneratedQuiz, sourceFiles: File[]) => void;
  generateReport: () => void;
  handleSubmitQuiz: () => void;
  regenerateQuiz: () => void;
  logout: () => Promise<void>;
}
