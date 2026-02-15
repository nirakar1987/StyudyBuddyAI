import React from 'react';
import { AppContextType, AppState, QuestionType } from '../types';

interface QuestionViewerProps {
    context: AppContextType;
}

const getQuestionTypeBadgeColor = (type: QuestionType) => {
    switch (type) {
        case QuestionType.MCQ: return 'bg-blue-500 text-blue-100';
        case QuestionType.SHORT_ANSWER: return 'bg-green-500 text-green-100';
        case QuestionType.TRUE_FALSE: return 'bg-purple-500 text-purple-100';
        case QuestionType.FILL_IN_THE_BLANK: return 'bg-yellow-500 text-yellow-100';
        default: return 'bg-gray-500 text-gray-100';
    }
};

const QuestionViewer: React.FC<QuestionViewerProps> = ({ context }) => {
    // FIX: Destructure 'generatedQuiz' from context and derive 'generatedQuestions' from it.
    const { generatedQuiz, setAppState } = context;
    const generatedQuestions = generatedQuiz?.questions || [];

    if (generatedQuestions.length === 0) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold text-cyan-300 mb-4">No Questions Generated</h2>
                <p className="text-slate-400">Please upload some material to generate questions.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in h-full flex flex-col">
            <h2 className="text-3xl font-bold text-cyan-300 mb-4">Quiz Preview</h2>
            <p className="text-slate-400 mb-6">Here are the questions StudyBuddy AI created. Start the practice session when you're ready!</p>

            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                {generatedQuestions.map((q, index) => (
                    <div key={index} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-slate-200 font-semibold pr-4">{index + 1}. {q.questionText}</p>
                            <div className="flex gap-2 items-center flex-shrink-0">
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getQuestionTypeBadgeColor(q.questionType)}`}>
                                    {q.questionType}
                                </span>
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${q.difficulty === 'Easy' ? 'bg-green-600' : q.difficulty === 'Medium' ? 'bg-yellow-600' : 'bg-red-600'}`}>
                                    {q.difficulty}
                                </span>
                            </div>
                        </div>

                        {q.questionType === QuestionType.MCQ && q.options && (
                            <div className="pl-6 space-y-1 text-sm text-slate-300">
                                {q.options.map((opt, i) => (
                                    <p key={i}>- {opt}</p>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-6 flex justify-end gap-4">
                <button
                    onClick={() => setAppState(AppState.UPLOAD)}
                    className="px-5 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold"
                >
                    Generate New Quiz
                </button>
                <button onClick={() => setAppState(AppState.QUIZ)} className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold">Start Practice Session</button>
            </div>
        </div>
    );
};

export default QuestionViewer;