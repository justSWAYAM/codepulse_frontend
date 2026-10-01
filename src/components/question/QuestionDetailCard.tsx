import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DifficultyBadge } from '../DifficultyBadge';
import type { QuestionRecord, QuestionAdminRecord, QuestionCandidateRecord } from '../../api/questionApi';
import { Clock, MemoryStick, Trophy, FlaskConical, Eye } from 'lucide-react';

interface QuestionDetailCardProps {
  question: QuestionRecord;
}

/** Type guard: admin records have `testCases` array */
function isAdminRecord(q: QuestionRecord): q is QuestionAdminRecord {
  return 'testCases' in q;
}

/** Type guard: candidate records have `sampleTestCases` array */
function isCandidateRecord(q: QuestionRecord): q is QuestionCandidateRecord {
  return 'sampleTestCases' in q;
}

export const QuestionDetailCard: React.FC<QuestionDetailCardProps> = ({ question }) => {
  return (
    <div className="bg-surface rounded-lg border border-line shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-line bg-canvas">
        <div className="flex items-start justify-between">
          <h2 className="text-2xl font-display text-fg font-bold">{question.title}</h2>
          <DifficultyBadge difficulty={question.difficulty} />
        </div>
        <div className="flex items-center gap-6 mt-4 text-sm text-fg-muted font-mono">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-fg-subtle" />
            <span>{question.points} pts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-fg-subtle" />
            <span>{question.timeLimitMs} ms</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MemoryStick className="w-4 h-4 text-fg-subtle" />
            <span>{Math.round(question.memoryLimitKb / 1024)} MB</span>
          </div>
        </div>
      </div>

      {/* Admin / Evaluator: test case count summary */}
      {isAdminRecord(question) && question.testCases && question.testCases.length > 0 && (
        <div className="px-6 py-3 border-b border-line bg-surface-2">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-fg-subtle" />
            <span className="text-sm text-fg-muted">
              {question.testCases.length} test case{question.testCases.length !== 1 ? 's' : ''}
              {' '}
              <span className="text-fg-subtle">
                ({question.testCases.filter(tc => tc.isSample).length} sample,{' '}
                {question.testCases.filter(tc => !tc.isSample).length} hidden)
              </span>
            </span>
          </div>
        </div>
      )}

      <div className="p-6 overflow-y-auto prose prose-slate max-w-none prose-pre:font-mono prose-pre:bg-surface-2 prose-pre:text-fg prose-pre:border prose-pre:border-line">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {question.description}
        </ReactMarkdown>
      </div>

      {/* Candidate: sample test cases section (input only, no expectedOutput or weight) */}
      {isCandidateRecord(question) && question.sampleTestCases && question.sampleTestCases.length > 0 && (
        <div className="px-6 py-4 border-t border-line bg-surface-2">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-fg-subtle" />
            <h3 className="text-sm font-semibold text-fg">Sample Test Cases</h3>
          </div>
          <div className="space-y-3">
            {question.sampleTestCases
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((tc, index) => (
                <div
                  key={tc.id}
                  className="rounded-lg border border-line overflow-hidden"
                >
                  <div className="px-3 py-1.5 bg-surface-2 border-b border-line">
                    <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
                      Sample Input {index + 1}
                    </span>
                  </div>
                  <div className="px-3 py-2 bg-surface">
                    <pre className="font-mono text-sm text-fg whitespace-pre-wrap break-words m-0">
                      {tc.input}
                    </pre>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

