import React from 'react';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  GitPullRequest, 
  MessageSquare, 
  FileText, 
  Calendar, 
  Server, 
  CheckSquare, 
  Lock,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { Task, PlatformId, TaskStatus } from '../types';
import { calculateDeadlineMeta } from '../utils/priorityEngine';

interface TaskQueueProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onExecuteTask: (task: Task) => void;
  onCompleteTask: (task: Task) => void;
  onOpenNewTaskModal: () => void;
}

export const TaskQueue: React.FC<TaskQueueProps> = ({
  tasks,
  onSelectTask,
  onExecuteTask,
  onCompleteTask,
  onOpenNewTaskModal,
}) => {
  const [filterPlatform, setFilterPlatform] = React.useState<string>('all');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');

  const getPlatformIcon = (platform: PlatformId) => {
    switch (platform) {
      case 'github': return <GitPullRequest className="w-3.5 h-3.5 text-slate-300" />;
      case 'linear': return <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />;
      case 'jira': return <Server className="w-3.5 h-3.5 text-blue-400" />;
      case 'slack': return <MessageSquare className="w-3.5 h-3.5 text-amber-400" />;
      case 'notion': return <FileText className="w-3.5 h-3.5 text-emerald-400" />;
      case 'calendar': return <Calendar className="w-3.5 h-3.5 text-rose-400" />;
      case 'cicd': return <Server className="w-3.5 h-3.5 text-cyan-400" />;
      default: return <ExternalLink className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterPlatform !== 'all' && t.platform !== filterPlatform) return false;
    if (filterStatus === 'active' && (t.status === 'completed')) return false;
    if (filterStatus === 'completed' && t.status !== 'completed') return false;
    if (filterStatus === 'urgent' && t.urgencyScore < 75) return false;
    return true;
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col">
      {/* Header and Controls */}
      <div className="p-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Autonomous Prioritized Queue</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic ordering driven by deadline burn-down rates and dependency topology
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/60 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterStatus === 'all' 
                  ? 'bg-slate-800 text-white font-medium' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterStatus === 'active' 
                  ? 'bg-slate-800 text-white font-medium' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active ({tasks.filter(t => t.status !== 'completed').length})
            </button>
            <button
              onClick={() => setFilterStatus('urgent')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterStatus === 'urgent' 
                  ? 'bg-slate-800 text-amber-300 font-medium' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Critical ({tasks.filter(t => t.urgencyScore >= 75 && t.status !== 'completed').length})
            </button>
          </div>

          <button
            onClick={onOpenNewTaskModal}
            className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap"
          >
            + Add Platform Task
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="divide-y divide-slate-800/60">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No tasks match the active filter criteria.
          </div>
        ) : (
          filteredTasks.map((task, index) => {
            const deadlineMeta = calculateDeadlineMeta(task.deadline);
            const isBlocked = task.status === 'blocked';
            const isCompleted = task.status === 'completed';
            const isInProgress = task.status === 'in_progress';

            return (
              <div 
                key={task.id}
                className={`p-4 transition-colors hover:bg-slate-800/30 flex items-start justify-between gap-4 ${
                  isCompleted ? 'opacity-60 bg-slate-950/20' : isInProgress ? 'bg-cyan-950/15' : ''
                }`}
              >
                {/* Left side: Priority Rank + Details */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Urgency Rank Number */}
                  <div className="flex flex-col items-center justify-center w-10 text-center shrink-0">
                    <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                      #{index + 1}
                    </span>
                    <span className={`text-xs font-mono font-semibold tabular-nums mt-0.5 ${
                      isCompleted ? 'text-slate-500' :
                      task.urgencyScore >= 90 ? 'text-rose-400' :
                      task.urgencyScore >= 75 ? 'text-amber-400' :
                      'text-cyan-400'
                    }`}>
                      {task.urgencyScore}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-tighter">urgency</span>
                  </div>

                  {/* Body Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-400 flex items-center gap-1 text-xs">
                        {getPlatformIcon(task.platform)}
                        <span className="font-semibold text-slate-200 capitalize">{task.platform}</span>
                      </span>

                      {/* Zero-Pill Typography Separator */}
                      <span className="text-slate-600" aria-hidden="true">·</span>

                      {/* Target Resource */}
                      <span className="text-xs text-slate-400 font-mono truncate max-w-xs">
                        {task.platformAction.targetResource}
                      </span>

                      {/* Zero-Pill Typography Separator */}
                      <span className="text-slate-600" aria-hidden="true">·</span>

                      {/* Deadline Countdown */}
                      <span className={`text-xs font-mono tabular-nums flex items-center gap-1 ${
                        isCompleted ? 'text-slate-500' :
                        deadlineMeta.isOverdue ? 'text-rose-400 font-semibold' :
                        deadlineMeta.isCriticalWindow ? 'text-amber-400 font-medium' :
                        'text-slate-400'
                      }`}>
                        <Clock className="w-3 h-3 inline" />
                        {deadlineMeta.displayTime}
                      </span>

                      {/* Blocked indicator */}
                      {isBlocked && (
                        <>
                          <span className="text-slate-600" aria-hidden="true">·</span>
                          <span className="text-xs text-amber-400/90 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Blocked by {task.dependencies.join(', ')}
                          </span>
                        </>
                      )}

                      {/* Status indicator */}
                      {isInProgress && (
                        <>
                          <span className="text-slate-600" aria-hidden="true">·</span>
                          <span className="text-xs text-cyan-400 flex items-center gap-1 animate-pulse">
                            Active in cycle
                          </span>
                        </>
                      )}
                    </div>

                    <h4 
                      onClick={() => onSelectTask(task)}
                      className={`text-sm font-medium mt-1 cursor-pointer transition-colors ${
                        isCompleted ? 'line-through text-slate-400' : 'text-white hover:text-cyan-300'
                      }`}
                    >
                      {task.title}
                    </h4>

                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {task.description}
                    </p>

                    {/* Metadata Footer: Clean unboxed text */}
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                      <span>Agent: {task.assignedAgentRole}</span>
                      <span aria-hidden="true">·</span>
                      <span>Action: {task.platformAction.type}</span>
                      {task.platformAction.requiresApproval && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-400/80">Approval Required</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>Est: {task.estimatedMinutes}m</span>
                    </div>
                  </div>
                </div>

                {/* Right side: Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-1">
                  {!isCompleted && (
                    <button
                      onClick={() => onExecuteTask(task)}
                      disabled={isBlocked}
                      title={isBlocked ? 'Task is blocked by unresolved dependencies' : 'Execute this task with agent'}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
                        isBlocked 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/20'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span className="hidden sm:inline">Dispatch</span>
                    </button>
                  )}

                  {!isCompleted ? (
                    <button
                      onClick={() => onCompleteTask(task)}
                      title="Mark as completed"
                      className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Done
                    </span>
                  )}

                  <button
                    onClick={() => onSelectTask(task)}
                    title="Inspect details & payload"
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
