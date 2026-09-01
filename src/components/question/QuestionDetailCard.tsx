import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DifficultyBadge } from '../DifficultyBadge';
import type { QuestionRecord } from '../../api/questionApi';
import { Clock, MemoryStick, Trophy } from 'lucide-react';

interface QuestionDetailCardProps {
  question: QuestionRecord;
}

export const QuestionDetailCard: React.FC<QuestionDetailCardProps> = ({ question }) => {
  return (
    <div className="bg-white rounded-lg border border-[#E4E2DC] shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-[#E4E2DC] bg-[#FAFAF8]">
        <div className="flex items-start justify-between">
          <h2 className="text-2xl font-display text-[#1B1E3A] font-bold">{question.title}</h2>
          <DifficultyBadge difficulty={question.difficulty} />
        </div>
        <div className="flex items-center gap-6 mt-4 text-sm text-gray-600 font-mono">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-gray-400" />
            <span>{question.points} pts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{question.timeLimitMs} ms</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MemoryStick className="w-4 h-4 text-gray-400" />
            <span>{Math.round(question.memoryLimitKb / 1024)} MB</span>
          </div>
        </div>
      </div>
      <div className="p-6 overflow-y-auto prose prose-slate max-w-none prose-pre:font-mono prose-pre:bg-gray-50 prose-pre:text-[#1B1E3A] prose-pre:border prose-pre:border-gray-200">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {question.description}
        </ReactMarkdown>
      </div>
    </div>
  );
};
