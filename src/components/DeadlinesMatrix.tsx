import React from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  ShieldAlert, 
  Sparkles,
  Calendar,
  Layers,
  Play
} from 'lucide-react';
import { Task } from '../types';
import { calculateDeadlineMeta } from '../utils/priorityEngine';

interface DeadlinesMatrixProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onExecuteTask: (task: Task) => void;
}

export const DeadlinesMatrix: React.FC<DeadlinesMatrixProps> = ({
  tasks,
  onSelectTask,
  onExecuteTask,
}) => {
  // Categorize tasks by deadline distance
  const overdueTasks: Task[] = [];
  const criticalTasks: Task[] = []; // <= 3h
  const todayTasks: Task[] = []; // <= 12h
  const upcomingTasks: Task[] = []; // > 12h

  tasks.forEach(t => {
    if (t.status === 'completed') return;
    const meta = calculateDeadlineMeta(t.deadline);
    if (meta.isOverdue) overdueTasks.push(t);
    else if (meta.isCriticalWindow) criticalTasks.push(t);
    else if (meta.isImminent) todayTasks.push(t);
    else upcomingTasks.push(t);
  });

  return (
    <div className="space-y-6">
      {/* Autonomous Rebalancer Recommendation Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/50 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Autonomous SLA Guardian Vector</h3>
              <span className="text-xs text-cyan-400 font-mono">Continuous Proximity Analysis</span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              The agentic prioritization engine detected <strong>{criticalTasks.length + overdueTasks.length} critical SLA dependencies</strong>. 
              Execution order has been topologically dynamically recalibrated to guarantee all high-severity platform mutations dispatch before their contractual deadline window expires.
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                Overdue: {overdueTasks.length}
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                Critical Window (&lt;3h): {criticalTasks.length}
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                Due Today (&lt;12h): {todayTasks.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of SLA Windows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bucket 1: Urgent Window (< 3 hours / Overdue) */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
            <div>
              <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Urgent Horizon (&lt; 3h)
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Immediate agent priority queue
              </div>
            </div>
            <span className="text-sm font-semibold font-mono text-rose-400 tabular-nums">
              {overdueTasks.length + criticalTasks.length}
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {[...overdueTasks, ...criticalTasks].length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-8">
                No immediate deadlines in danger
              </div>
            ) : (
              [...overdueTasks, ...criticalTasks].map(task => {
                const meta = calculateDeadlineMeta(task.deadline);
                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="p-3 bg-slate-950/70 border border-rose-900/30 rounded-lg hover:border-rose-500/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-300 uppercase">{task.platform}</span>
                      <span className="font-mono text-rose-400 font-semibold tabular-nums">
                        {meta.displayTime}
                      </span>
                    </div>
                    <div className="text-xs text-white font-medium line-clamp-1">
                      {task.title}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Urgency: {task.urgencyScore}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onExecuteTask(task);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        Run
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bucket 2: Due Today (< 12 hours) */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
            <div>
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Mid-Term Horizon (&lt; 12h)
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Sequenced after critical window
              </div>
            </div>
            <span className="text-sm font-semibold font-mono text-amber-400 tabular-nums">
              {todayTasks.length}
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {todayTasks.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-8">
                No mid-term tasks queued
              </div>
            ) : (
              todayTasks.map(task => {
                const meta = calculateDeadlineMeta(task.deadline);
                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg hover:border-amber-500/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-300 uppercase">{task.platform}</span>
                      <span className="font-mono text-amber-400 tabular-nums">
                        {meta.displayTime}
                      </span>
                    </div>
                    <div className="text-xs text-white font-medium line-clamp-1">
                      {task.title}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Urgency: {task.urgencyScore}</span>
                      <span className="text-slate-500 font-mono">est: {task.estimatedMinutes}m</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bucket 3: Upcoming Horizon (> 12 hours) */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
            <div>
              <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Extended Horizon (&gt; 12h)
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Scheduled release & compliance
              </div>
            </div>
            <span className="text-sm font-semibold font-mono text-cyan-400 tabular-nums">
              {upcomingTasks.length}
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {upcomingTasks.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-8">
                No future horizon tasks
              </div>
            ) : (
              upcomingTasks.map(task => {
                const meta = calculateDeadlineMeta(task.deadline);
                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg hover:border-cyan-500/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-300 uppercase">{task.platform}</span>
                      <span className="font-mono text-slate-400 tabular-nums">
                        {meta.displayTime}
                      </span>
                    </div>
                    <div className="text-xs text-white font-medium line-clamp-1">
                      {task.title}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Urgency: {task.urgencyScore}</span>
                      <span className="text-slate-500 font-mono">est: {task.estimatedMinutes}m</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
