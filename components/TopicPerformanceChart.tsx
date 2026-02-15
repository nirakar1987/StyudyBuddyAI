
import React from 'react';
import { AppContextType } from '../types';
import { ChartBarIcon } from './icons/ChartBarIcon';

interface TopicPerformanceChartProps {
    context: AppContextType;
}

const performanceStyles: Record<'weak' | 'neutral' | 'strong', { width: string; color: string; label: string }> = {
    weak: { width: '33.33%', color: 'bg-[var(--color-danger)]', label: 'Needs Practice' },
    neutral: { width: '66.67%', color: 'bg-[var(--color-accent)]', label: 'Good Progress' },
    strong: { width: '100%', color: 'bg-[var(--color-success)]', label: 'Mastered' },
};

const TopicPerformanceChart: React.FC<TopicPerformanceChartProps> = ({ context }) => {
    const { studentProfile } = context;
    const topicPerformance = studentProfile?.topic_performance;

    const hasData = !!(topicPerformance && Object.keys(topicPerformance).length > 0);

    return (
        <div className="w-full bg-[var(--color-surface-light)]/50 rounded-lg p-6">
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <ChartBarIcon className="w-6 h-6 text-[var(--color-primary)]" />
                My Topic Mastery
            </h3>
            {hasData && topicPerformance ? (
                <div className="space-y-4">
                    {/* FIX: Explicitly cast 'performance' to the specific literal union type to resolve the 'unknown' index error when accessing performanceStyles. */}
                    {Object.entries(topicPerformance).map(([topic, performance], index) => {
                        const style = performanceStyles[performance as 'weak' | 'neutral' | 'strong'];
                        return (
                            <div key={topic} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-sm font-medium text-[var(--color-text-secondary)] capitalize">{topic}</p>
                                    <p className={`text-xs font-semibold ${
                                        performance === 'weak' ? 'text-red-400' :
                                        performance === 'neutral' ? 'text-amber-300' : 'text-green-400'
                                    }`}>{style.label}</p>
                                </div>
                                <div className="w-full bg-[var(--color-background)] rounded-full h-2.5">
                                    <div 
                                        className={`${style.color} h-2.5 rounded-full transition-all duration-500 ease-out`} 
                                        style={{ width: style.width }}
                                        title={style.label}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-[var(--color-text-muted)]">Complete a quiz to see your topic performance here!</p>
                </div>
            )}
        </div>
    );
};

export default TopicPerformanceChart;
