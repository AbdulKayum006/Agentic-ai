import React from 'react';
import { Task, PlatformConnection, OpenAIConfig } from '../types';
import { calculateDeadlineMeta } from '../utils/priorityEngine';

interface MetricCardsProps {
  tasks: Task[];
  platforms: PlatformConnection[];
  openAIConfig: OpenAIConfig;
  totalExecutedCycles: number;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  tasks,
  platforms,
  openAIConfig,
  totalExecutedCycles,
}) => {
  const pendingOrActive = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  
  // Urgent deadlines: < 3 hours or overdue
  const criticalSLA = tasks.filter(t => {
    if (t.status === 'completed') return false;
    const meta = calculateDeadlineMeta(t.deadline);
    return meta.isOverdue || meta.isCriticalWindow;
  }).length;

  const connectedPlatformsCount = platforms.filter(p => p.status === 'connected').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Metric 1 */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
        <div className="text-xs text-slate-400 font-medium">Active Tasks</div>
        <div className="flex items-baseline justify-between mt-2">
          <div className="text-2xl font-semibold text-white tracking-tight tabular-nums">
            {pendingOrActive}
          </div>
          <div className="text-xs text-slate-400 tabular-nums">
            {completed} completed
          </div>
        </div>
        <div className="text-[11px] text-slate-500 mt-2">
          {tasks.filter(t => t.status === 'blocked').length} tasks waiting on dependencies
        </div>
      </div>

      {/* Metric 2 */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
        <div className="text-xs text-slate-400 font-medium">Critical SLA Window (&lt;3h)</div>
        <div className="flex items-baseline justify-between mt-2">
          <div className={`text-2xl font-semibold tracking-tight tabular-nums ${
            criticalSLA > 0 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {criticalSLA}
          </div>
          <div className="text-xs text-slate-400">
            {criticalSLA > 0 ? 'High Priority' : 'All Clear'}
          </div>
        </div>
        <div className="text-[11px] text-slate-500 mt-2">
          Calculated by dynamic burn-down engine
        </div>
      </div>

      {/* Metric 3 */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
        <div className="text-xs text-slate-400 font-medium">Integrated Platforms</div>
        <div className="flex items-baseline justify-between mt-2">
          <div className="text-2xl font-semibold text-white tracking-tight tabular-nums">
            {connectedPlatformsCount}/{platforms.length}
          </div>
          <div className="text-xs text-cyan-400">
            Live Stream
          </div>
        </div>
        <div className="text-[11px] text-slate-500 mt-2 truncate">
          GitHub · Linear · Jira · Slack · Notion
        </div>
      </div>

      {/* Metric 4 */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
        <div className="text-xs text-slate-400 font-medium">OpenAI Engine Model</div>
        <div className="flex items-baseline justify-between mt-2">
          <div className="text-base font-semibold text-cyan-300 font-mono tracking-tight truncate">
            {openAIConfig.mode === 'openai_direct' ? openAIConfig.model : 'Nexus-v2 (Auto)'}
          </div>
          <div className="text-xs text-slate-400 tabular-nums">
            {openAIConfig.latencyMs ? `${openAIConfig.latencyMs}ms` : 'Ready'}
          </div>
        </div>
        <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
          <span>{totalExecutedCycles} autonomous actions</span>
          <span className="text-slate-400 font-mono">temp: {openAIConfig.temperature}</span>
        </div>
      </div>
    </div>
  );
};
