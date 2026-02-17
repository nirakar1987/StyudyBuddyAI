
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AppState, StudentProfile, GeneratedQuiz, AvatarState, ChatMessage, LearningModule, PracticeProblem, ProblemFeedback, QuizAttempt, QuestionType, OnlineUser } from './types';
import { User } from '@supabase/supabase-js';
import Avatar from './components/Avatar';
import InteractionPanel from './components/InteractionPanel';
import { SparklesIcon } from './components/icons/SparklesIcon';
import GamificationHeader from './components/GamificationHeader';
import { generateProgressReport, analyzeAndGenerateQuestions, evaluateAnswerSemantically } from './services/geminiService';
import { LEARNING_MODULES } from './data/modules';
import LandingPageView from './components/LandingPageView';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { getProfile, upsertProfile, addQuizAttempt } from './services/databaseService';
import UserPresence from './components/UserPresence';
import ChatNotificationPopup from './components/ChatNotificationPopup';
import MobileNav from './components/MobileNav';
import { ChatMessageRow } from './services/databaseService';


// Helper to create a unique ID for the current quiz based on its content
const getQuizId = (quiz: GeneratedQuiz | null): string | null => {
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return null;
  }
  const quizIdentifierString = quiz.questions.map(q => q.questionText).join('|');
  let hash = 5381;
  for (let i = 0; i < quizIdentifierString.length; i++) {
    const char = quizIdentifierString.charCodeAt(i);
    hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
  }
  return String(hash);
};


const App: React.FC = () => {
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.LANDING_PAGE);
  const [avatarState, setAvatarState] = useState<AvatarState>(AvatarState.IDLE);
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [progressReport, setProgressReport] = useState<string>('');
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [quizScore, setQuizScore] = useState<{ score: number; total: number } | null>(null);
  const [quizResults, setQuizResults] = useState<boolean[] | null>(null);
  const [lastUploadedFiles, setLastUploadedFiles] = useState<File[]>([]);
  const [quizCustomization, setQuizCustomization] = useState({ numQuestions: 5, difficulty: 'Medium', duration: 10, numOptions: 4 });
  const [learningModules] = useState<LearningModule[]>(LEARNING_MODULES);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [lastModuleCompleted, setLastModuleCompleted] = useState<string | null>(null);
  const [practiceProblem, setPracticeProblem] = useState<PracticeProblem | null>(null);
  const [userPracticeAnswer, setUserPracticeAnswer] = useState<string>('');
  const [problemFeedback, setProblemFeedback] = useState<ProblemFeedback | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[] | null>(null);
  const [selectedQuizAttempt, setSelectedQuizAttempt] = useState<QuizAttempt | null>(null);
  const [theme, setThemeState] = useState('midnight-bloom');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [chatPartner, setChatPartner] = useState<OnlineUser | null>(null);
  const [chatNotification, setChatNotification] = useState<{ sender: OnlineUser, message: string, channelId: string } | null>(null);


  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(`theme-${theme}`);
    document.body.style.backgroundColor = 'var(--color-background)';
    document.body.style.color = 'var(--color-text-primary)';
  }, [theme]);

  const fetchUserData = useCallback(async (user: User) => {
    try {
      const profile = await getProfile(user.id);
      if (profile) {
        // Load custom avatar from localStorage as a fallback to DB
        const customAvatarUrl = localStorage.getItem(`customAvatarUrl_${user.id}`);
        if (customAvatarUrl) {
          profile.avatar_url = customAvatarUrl;
        }

        setStudentProfile(profile);
        setScore(profile.score || 0);
        setStreak(profile.streak || 1);
        setCompletedModules(profile.completed_modules || []);
        setThemeState(profile.theme || 'midnight-bloom');
        setAppState(AppState.DASHBOARD);
      } else {
        setAppState(AppState.PROFILE_SETUP);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setAppState(AppState.PROFILE_SETUP);
    }
  }, []);

  useEffect(() => {
    if (!supabase || !user || !studentProfile) {
      setOnlineUsers([]);
      return;
    }

    const presenceChannel = supabase.channel('global-presence', {
      config: {
        presence: { key: user.id },
      },
    });

    const updatePresenceState = () => {
      const presences = presenceChannel.presenceState();
      const users = Object.keys(presences).map(key => {
        const presence = (presences[key] as any[])?.[0];
        if (!presence) return null;

        return {
          id: key,
          name: presence.name,
          avatar_url: presence.avatar_url
        } as OnlineUser;
      }).filter((u): u is OnlineUser => !!u.name);

      setOnlineUsers(users);
    };

    presenceChannel.on('presence', { event: 'sync' }, updatePresenceState);
    presenceChannel.on('presence', { event: 'join' }, updatePresenceState);
    presenceChannel.on('presence', { event: 'leave' }, updatePresenceState);

    presenceChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const trackStatus = await presenceChannel.track({
          name: studentProfile.name,
          avatar_url: studentProfile.avatar_url,
          last_active: new Date().toISOString(),
        });
        if (trackStatus !== 'ok') {
          console.error("Presence tracking failed");
        }
      }
    });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [user?.id, studentProfile?.name, studentProfile?.avatar_url]);


  useEffect(() => {
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser && !studentProfile) {
        fetchUserData(currentUser);
      } else if (!currentUser) {
        setStudentProfile(null);
        setScore(0);
        setStreak(0);
        setCompletedModules([]);
        setAppState(AppState.LANDING_PAGE);
      }
      setIsLoadingSession(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData, studentProfile]);

  const updateStudentProfile = useCallback(async (profileUpdate: StudentProfile | null | ((prev: StudentProfile | null) => StudentProfile | null)) => {
    const newProfile = typeof profileUpdate === 'function' ? profileUpdate(studentProfile) : profileUpdate;
    setStudentProfile(newProfile);
    if (newProfile && user) {
      if (newProfile.avatar_url) {
        localStorage.setItem(`customAvatarUrl_${user.id}`, newProfile.avatar_url);
      }
      try {
        await upsertProfile({ ...newProfile, id: user.id });
      } catch (error: any) {
        console.error("Failed to save profile:", JSON.stringify(error, null, 2));
        throw error;
      }
    }
  }, [user, studentProfile]);

  const handleThemeChange = useCallback(async (newTheme: string) => {
    setThemeState(newTheme);
    if (user && studentProfile) {
      const updatedProfile = { ...studentProfile, id: user.id, theme: newTheme };
      setStudentProfile(updatedProfile);
      await upsertProfile(updatedProfile);
    }
  }, [user, studentProfile]);

  const updateScore = useCallback(async (newScore: number | ((prev: number) => number)) => {
    const updatedScore = typeof newScore === 'function' ? newScore(score) : newScore;
    setScore(updatedScore);
    if (user && studentProfile) {
      await upsertProfile({ ...studentProfile, id: user.id, score: updatedScore });
    }
  }, [score, user, studentProfile]);

  const handleStateChange = useCallback((newState: AppState) => {
    if (newState !== AppState.GLOBAL_CHAT) {
      setChatPartner(null);
    }
    setAppState(newState);
  }, []);
  const handleStartApp = useCallback(() => { user ? setAppState(AppState.DASHBOARD) : setAppState(AppState.AUTH); }, [user]);
  const handleStartLesson = useCallback(() => { setChatHistory([]); setAvatarState(AvatarState.IDLE); setAppState(AppState.LESSON); }, []);
  const handleStartPracticeSession = useCallback(() => { setPracticeProblem(null); setUserPracticeAnswer(''); setProblemFeedback(null); setAppState(AppState.PRACTICE_SESSION); }, []);
  const handleStartSolveIssue = useCallback(() => { setChatHistory([]); setAvatarState(AvatarState.IDLE); setAppState(AppState.SOLVE_ISSUE); }, []);
  const handleStartVideoGeneration = useCallback(() => setAppState(AppState.VIDEO_GENERATION), []);
  const handleStartGlobalChat = useCallback((partner?: OnlineUser) => {
    setChatHistory([]);
    setChatPartner(partner || null);
    setAppState(AppState.GLOBAL_CHAT);
  }, []);

  useEffect(() => {
    if (!supabase || !user) return;

    const handleNewMessage = (payload: any) => {
      const newMessage: ChatMessageRow = payload.new;
      if (newMessage.sender_id === user.id) return;

      const isCommunityMessage = newMessage.channel_id === 'community-chat';
      const isDM = newMessage.channel_id.startsWith('dm-');

      if (appState === AppState.GLOBAL_CHAT) {
        if (isCommunityMessage && !chatPartner) return;
        if (isDM && chatPartner && newMessage.channel_id.includes(chatPartner.id)) return;
      }

      if (isDM && !newMessage.channel_id.includes(user.id)) return;

      setChatNotification({
        sender: {
          id: newMessage.sender_id,
          name: newMessage.sender_payload?.name || 'Someone',
          avatar_url: newMessage.sender_payload?.avatar_url
        },
        message: newMessage.content,
        channelId: newMessage.channel_id
      });
    };

    const subscription = supabase.channel('public:chat_messages:notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, handleNewMessage)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, appState, chatPartner]);

  const handleAcceptChat = () => {
    if (!chatNotification) return;

    if (chatNotification.channelId === 'community-chat') {
      handleStartGlobalChat();
    } else {
      handleStartGlobalChat(chatNotification.sender);
    }
    setChatNotification(null);
  };

  const handleDismissNotification = () => {
    setChatNotification(null);
  };


  const handleQuestionsGenerated = useCallback((quiz: GeneratedQuiz, sourceFiles: File[]) => {
    setGeneratedQuiz(quiz);
    setLastUploadedFiles(sourceFiles);
    setUserAnswers({});
    setQuizScore(null);
    setQuizResults(null);
    setLastModuleCompleted(null);
    setSubmissionError(null);
    setAppState(AppState.QUIZ);

    const quizId = getQuizId(quiz);
    if (user && quizId) {
      localStorage.setItem(`lastQuizPointer_${user.id}`, quizId);
    }
  }, [user]);

  const handleGenerateReport = useCallback(async () => {
    if (!studentProfile) return;
    if (chatHistory.length === 0) {
      setProgressReport("No lesson data available. Please complete a lesson to generate a report.");
      setAppState(AppState.PROGRESS_REPORT);
      return;
    }
    setAvatarState(AvatarState.THINKING);
    const report = await generateProgressReport(chatHistory, studentProfile);
    setProgressReport(report);
    setAvatarState(AvatarState.IDLE);
    setAppState(AppState.PROGRESS_REPORT);
  }, [chatHistory, studentProfile]);

  const handleSubmitQuiz = useCallback(async () => {
    if (!generatedQuiz || !studentProfile || !user) {
      setSubmissionError("Cannot submit quiz. User profile or quiz data is missing.");
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      const normalizeAnswer = (text: string) => text.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");

      const evaluationPromises = generatedQuiz.questions.map((q, index) => {
        const userAnswer = userAnswers[index]?.trim() ?? "";
        if (!userAnswer) return Promise.resolve(false);

        if (q.questionType === QuestionType.MCQ || q.questionType === QuestionType.TRUE_FALSE) {
          return Promise.resolve(normalizeAnswer(userAnswer) === normalizeAnswer(q.correctAnswer));
        } else {
          return evaluateAnswerSemantically({
            questionText: q.questionText,
            userAnswer: userAnswer,
            correctAnswer: q.correctAnswer
          }).then(result => result.isCorrect).catch(err => {
            console.error(`Evaluation failed for question ${index + 1}:`, err);
            return false;
          });
        }
      });

      const results = await Promise.all(evaluationPromises);
      const correctCount = results.filter(Boolean).length;

      const scoreFromAnswers = correctCount * 20;

      const newPerformance = { ...(studentProfile.topic_performance || {}) };
      const scorePercentage = (correctCount / generatedQuiz.questions.length) * 100;
      const performanceStatus = scorePercentage >= 80 ? 'strong' : scorePercentage < 50 ? 'weak' : 'neutral';

      const quizTopics = generatedQuiz.topics || [];
      quizTopics.forEach(topic => { newPerformance[topic] = performanceStatus; });

      let scoreFromModules = 0;
      const newCompletedModuleIds = [...(studentProfile.completed_modules || [])];
      learningModules.forEach(module => {
        if (newCompletedModuleIds.includes(module.id)) return;
        const allTopicsMastered = module.requiredTopics.every(topic => newPerformance[topic] === 'strong');
        if (allTopicsMastered) {
          newCompletedModuleIds.push(module.id);
          setLastModuleCompleted(module.title);
          scoreFromModules += 250;
        }
      });
      const currentScore = Number(studentProfile.score || 0);
      const finalScore = currentScore + scoreFromAnswers + scoreFromModules;

      setQuizScore({ score: correctCount, total: generatedQuiz.questions.length });
      setQuizResults(results);
      setScore(finalScore);
      setCompletedModules(newCompletedModuleIds);

      const updatedProfile: StudentProfile = {
        ...studentProfile,
        score: finalScore,
        topic_performance: newPerformance,
        completed_modules: newCompletedModuleIds
      };
      await updateStudentProfile(updatedProfile);

      await addQuizAttempt(user.id, {
        name: studentProfile.name,
        grade: studentProfile.grade,
        subject: studentProfile.subject,
        score: correctCount,
        total_questions: generatedQuiz.questions.length,
        questions: generatedQuiz.questions,
        user_answers: userAnswers,
        topics: quizTopics,
      });
      setQuizHistory(null);

      const quizId = getQuizId(generatedQuiz);
      if (user && quizId) {
        const storageKey = `quizProgress_${user.id}_${quizId}`;
        localStorage.removeItem(storageKey);
        localStorage.removeItem(`lastQuizPointer_${user.id}`);
      }

      setAppState(AppState.QUIZ_RESULTS);
    } catch (error: any) {
      console.error("Error submitting quiz:", JSON.stringify(error, null, 2));
      setSubmissionError("An error occurred while submitting your quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, generatedQuiz, userAnswers, studentProfile, user, learningModules, updateStudentProfile]);

  const [quizSource, setQuizSource] = useState<any | null>(null);

  // ... (previous useEffects)

  const handleRegenerateQuiz = useCallback(async () => {
    // Handle Book Quiz regeneration
    if (quizSource?.type === 'book' && studentProfile) {
      setGeneratedQuiz(null);
      setAppState(AppState.QUIZ);
      try {
        const chapterTitle = quizSource.data;
        const quiz = await analyzeAndGenerateQuestions(
          [],
          studentProfile,
          { numQuestions: 10, difficulty: 'Medium', numOptions: 4, questionType: 'Multiple Choice' },
          `Textbook Chapter: ${chapterTitle}. Randomize the position of the correct answer among options.`
        );
        handleQuestionsGenerated(quiz, []);
      } catch (error) {
        console.error("Failed to regenerate book quiz:", error);
        setAppState(AppState.DASHBOARD);
      }
      return;
    }

    if (lastUploadedFiles.length === 0 || !studentProfile) {
      setAppState(AppState.UPLOAD);
      return;
    }
    setGeneratedQuiz(null);
    setAppState(AppState.QUIZ);
    try {
      const { numQuestions, difficulty, numOptions } = quizCustomization;
      const quiz = await analyzeAndGenerateQuestions(lastUploadedFiles, studentProfile, { numQuestions, difficulty, numOptions });
      handleQuestionsGenerated(quiz, lastUploadedFiles);
    } catch (error) {
      console.error("Failed to regenerate quiz:", error);
      setAppState(AppState.DASHBOARD);
    }
  }, [lastUploadedFiles, studentProfile, quizCustomization, handleQuestionsGenerated, quizSource]);

  const handleLogout = useCallback(async () => { await supabase!.auth.signOut(); }, []);

  const contextValue = useMemo(() => ({
    appState, studentProfile, generatedQuiz, quizSource, avatarState, chatHistory, score, streak, progressReport, userAnswers, quizScore, quizResults, lastUploadedFiles, quizCustomization, learningModules, completedModules, lastModuleCompleted, practiceProblem, userPracticeAnswer, problemFeedback, user, quizHistory, selectedQuizAttempt, theme, isSubmitting, submissionError, onlineUsers, chatPartner,
    setAppState: handleStateChange, setStudentProfile: updateStudentProfile, setGeneratedQuiz, setQuizSource, setAvatarState, setChatHistory, setScore: updateScore, setStreak, setProgressReport, setUserAnswers, setQuizScore, setQuizResults, setLastUploadedFiles, setQuizCustomization, setPracticeProblem, setUserPracticeAnswer, setProblemFeedback, setQuizHistory, setSelectedQuizAttempt, setTheme: handleThemeChange, setIsSubmitting, setSubmissionError,
    startApp: handleStartApp, startLesson: handleStartLesson, startPracticeSession: handleStartPracticeSession, startSolveIssue: handleStartSolveIssue, startVideoGeneration: handleStartVideoGeneration, startGlobalChat: handleStartGlobalChat, onQuestionsGenerated: handleQuestionsGenerated, generateReport: handleGenerateReport, handleSubmitQuiz: handleSubmitQuiz, regenerateQuiz: handleRegenerateQuiz, logout: handleLogout,
  }), [appState, studentProfile, generatedQuiz, quizSource, avatarState, chatHistory, score, streak, progressReport, userAnswers, quizScore, quizResults, lastUploadedFiles, quizCustomization, learningModules, completedModules, lastModuleCompleted, practiceProblem, userPracticeAnswer, problemFeedback, user, quizHistory, selectedQuizAttempt, theme, isSubmitting, submissionError, onlineUsers, chatPartner, handleStateChange, updateStudentProfile, updateScore, handleThemeChange, handleStartApp, handleStartLesson, handleStartPracticeSession, handleStartSolveIssue, handleStartVideoGeneration, handleStartGlobalChat, handleQuestionsGenerated, handleGenerateReport, handleSubmitQuiz, handleRegenerateQuiz, handleLogout]);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-center p-4">
        <div>
          <h1 className="text-3xl font-bold text-red-400 mb-4">Backend Not Configured</h1>
          <p className="text-slate-300 max-w-md mx-auto">
            The application's backend services are not available.
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[var(--color-text-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (appState === AppState.LANDING_PAGE && !user) {
    return <LandingPageView context={contextValue} />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] font-sans flex flex-col items-center justify-center p-4">
        <InteractionPanel context={contextValue} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] font-sans flex flex-col p-2 md:p-4">
      <header className="w-full flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface)]/50 mb-4 no-print shadow-lg border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-10 h-10 text-[var(--color-primary)] animate-pulse" />
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] tracking-tight">StudyBuddy AI</h1>
        </div>
        {studentProfile && appState !== AppState.PROFILE_SETUP && (
          <div className="flex items-center gap-6">
            <GamificationHeader context={contextValue} />
            <button
              onClick={() => handleStateChange(AppState.DASHBOARD)}
              className="px-6 py-2.5 bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20 hover:from-[var(--color-primary)]/30 hover:to-[var(--color-secondary)]/30 border border-white/10 rounded-xl text-[var(--color-text-primary)] font-bold transition-all duration-300 active:scale-95 shadow-lg"
            >
              Dashboard
            </button>
          </div>
        )}
      </header>
      <main className="w-full flex-grow flex flex-col lg:flex-row gap-6">
        {appState === AppState.PROFILE_SETUP || !studentProfile ? (
          <div className="w-full h-full">
            <InteractionPanel context={contextValue} />
          </div>
        ) : (
          <>
            {/* Desktop Sidebar - Hidden on Mobile */}
            <div className="hidden lg:flex lg:w-80 xl:w-96 flex-shrink-0 no-print flex-col gap-6 h-fit sticky top-4">
              <Avatar
                avatarState={avatarState}
                studentProfile={studentProfile}
                onProfileChange={updateStudentProfile}
              />
              <div className="p-6 bg-[var(--color-surface)]/80 backdrop-blur-md border border-white/5 rounded-2xl shadow-xl">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] mb-4">Active Profile</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-xs font-bold text-slate-500 uppercase">Student</span>
                    <span className="text-sm font-bold text-white">{studentProfile.name}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-xs font-bold text-slate-500 uppercase">Grade</span>
                    <span className="text-sm font-bold text-white">{studentProfile.grade}th</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-xs font-bold text-slate-500 uppercase">Subject</span>
                    <span className="text-sm font-bold text-white">{studentProfile.subject}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleStateChange(AppState.PROFILE_SETUP)}
                  className="w-full mt-6 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all duration-300 active:scale-95 text-sm uppercase tracking-widest"
                >
                  Edit Profile
                </button>
              </div>
              <UserPresence user={user} onlineUsers={onlineUsers} startGlobalChat={handleStartGlobalChat} />
            </div>
            <div className="flex-grow w-full h-full min-h-[calc(100vh-160px)] pb-24 lg:pb-0">
              <InteractionPanel context={contextValue} />
            </div>
          </>
        )}
      </main>
      {chatNotification && (
        <ChatNotificationPopup
          sender={chatNotification.sender}
          message={chatNotification.message}
          onAccept={handleAcceptChat}
          onDismiss={handleDismissNotification}
        />
      )}
      {/* Mobile Navigation Bar */}
      <MobileNav
        appState={appState}
        setAppState={handleStateChange}
        studentProfile={studentProfile}
      />
    </div>
  );
};

export default App;
