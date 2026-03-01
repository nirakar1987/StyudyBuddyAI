
import React from 'react';
import { AppState, AppContextType } from '../types';
import Dashboard from './Dashboard';
import LessonView from './LessonView';
import UploadView from './UploadView';
import ProgressView from './ProgressView';
import QuizView from './QuizView';
import QuizResultsView from './QuizResultsView';
import OralQuizView from './OralQuizView';
import ProfileSetupView from './ProfileSetupView';
import PracticeView from './PracticeView';
import AuthView from './AuthView';
import QuizHistoryView from './QuizHistoryView';
import QuizAttemptDetailsView from './QuizAttemptDetailsView';
import SolveIssueView from './SolveIssueView';
import VideoGenerationView from './VideoGenerationView';
import GlobalChatView from './GlobalChatView';
import DatabaseCheckView from './DatabaseCheckView';
import WhiteboardView from './WhiteboardView';
import StudyPlanView from './StudyPlanView';
import AnalyticsView from './AnalyticsView';
import ChapterQAView from './ChapterQAView';

import MultiplayerChallengeView from './MultiplayerChallengeView';
import MathMasteryView from './MathMasteryView';
import BookQuizView from './BookQuizView';
import FlashcardsView from './FlashcardsView';
import PointShopView from './PointShopView';
import PatternDetectiveView from './PatternDetectiveView';
import ParentNotificationsView from './ParentNotificationsView';
import HomeworkScannerView from './HomeworkScannerView';
import NCERTSolutionsView from './NCERTSolutionsView';
interface InteractionPanelProps {
  context: AppContextType;
}

const InteractionPanel: React.FC<InteractionPanelProps> = ({ context }) => {
  const renderContent = () => {
    switch (context.appState) {
      case AppState.AUTH:
        return <AuthView context={context} />;
      case AppState.PROFILE_SETUP:
        return <ProfileSetupView context={context} />;
      case AppState.DASHBOARD:
        return <Dashboard context={context} />;
      case AppState.LESSON:
        return <LessonView context={context} />;
      case AppState.PRACTICE_SESSION:
        return <PracticeView context={context} />;
      case AppState.UPLOAD:
        return <UploadView context={context} />;
      case AppState.QUIZ:
        return <QuizView context={context} />;
      case AppState.ORAL_QUIZ:
        return <OralQuizView context={context} />;
      case AppState.QUIZ_RESULTS:
        return <QuizResultsView context={context} />;
      case AppState.PROGRESS_REPORT:
        return <ProgressView context={context} />;
      case AppState.QUIZ_HISTORY:
        return <QuizHistoryView context={context} />;
      case AppState.QUIZ_ATTEMPT_DETAILS:
        return <QuizAttemptDetailsView context={context} />;
      case AppState.SOLVE_ISSUE:
        return <SolveIssueView context={context} />;
      case AppState.VIDEO_GENERATION:
        return <VideoGenerationView context={context} />;
      case AppState.GLOBAL_CHAT:
        return <GlobalChatView context={context} />;
      case AppState.DB_CHECK:
        return <DatabaseCheckView context={context} />;
      case AppState.WHITEBOARD:
        return <WhiteboardView context={context} />;
      case AppState.STUDY_PLAN:
        return <StudyPlanView context={context} />;
      case AppState.ANALYTICS:
        return <AnalyticsView context={context} />;
      case AppState.CHAPTER_QA:
        return <ChapterQAView context={context} />;

      case AppState.MULTIPLAYER_CHALLENGE:
        return <MultiplayerChallengeView context={context} />;
      case AppState.MATH_MASTERY:
        return <MathMasteryView context={context} />;
      case AppState.BOOK_QUIZ:
        return <BookQuizView context={context} />;
      case AppState.FLASHCARDS:
        return <FlashcardsView context={context} />;
      case AppState.POINT_SHOP:
        return <PointShopView context={context} />;
      case AppState.PATTERN_DETECTIVE:
        return <PatternDetectiveView context={context} />;
      case AppState.PARENT_NOTIFICATIONS:
        return <ParentNotificationsView context={context} />;
      case AppState.HOMEWORK_SCANNER:
        return <HomeworkScannerView context={context} />;
      case AppState.NCERT_SOLUTIONS:
        return <NCERTSolutionsView context={context} />;
      default:
        return <Dashboard context={context} />;
    }
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-lg shadow-lg p-4 md:p-6 h-full w-full overflow-y-auto custom-scrollbar">
      {renderContent()}
    </div>
  );
};

export default InteractionPanel;
