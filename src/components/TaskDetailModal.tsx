import React from 'react';
import { 
  X, 
  Clock, 
  GitPullRequest, 
  Terminal, 
  CheckCircle2, 
  Play, 
  Trash2, 
  Lock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Task } from '../types';
import { calculateDeadlineMeta } from '../utils/priorityEngine';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onExecuteTask: (task: Task) => void;
  onCompleteTask: (task: Task) => void;
  onUpdateDeadline: (taskId: string, newDeadline: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onExecuteTask,
  onCompleteTask,
  onUpdateDeadline,
  onDeleteTask,
}) => {
  if (!task) return null;

  const deadlineMeta = calculateDeadlineMeta(task.deadline);
  const [editableDeadline, setEditableDeadline] = React.useState(
    task.deadline.slice(0, 16)
  );

  const handleDeadlineSave = () => {
    onUpdateDeadline(task.id, `${editableDeadline}:00-07:00`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-start justify-between bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="font-semibold text-cyan-400 uppercase">{task.platform}</span>
              <span>·</span>
              <span>ID: {task.id}</span>
              <span>·</span>
              <span className="capitalize">{task.status}</span>
            </div>
            <h3 className="text-base font-semibold text-white mt-1">{task.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Status & Deadline Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 font-mono">
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Urgency Score</div>
              <div className="text-sm font-semibold text-cyan-400 tabular-nums">{task.urgencyScore}/100</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Priority</div>
              <div className="text-sm font-semibold text-slate-200 capitalize">{task.priority}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Time Remaining</div>
              <div className={`text-sm font-semibold tabular-nums ${
                deadlineMeta.isOverdue ? 'text-rose-400' : 'text-amber-400'
              }`}>
                {deadlineMeta.displayTime}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Est. Minutes</div>
              <div className="text-sm font-semibold text-slate-300 tabular-nums">{task.estimatedMinutes}m</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="text-slate-400 font-medium mb-1">Task Context</div>
            <p className="text-slate-200 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
              {task.description}
            </p>
          </div>

          {/* Platform Action Specification */}
          <div>
            <div className="text-slate-400 font-medium mb-1.5 flex items-center justify-between">
              <span>Platform Action Payload</span>
              <span className="font-mono text-[11px] text-cyan-400">
                {task.platformAction.method} {task.platformAction.targetResource}
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
              <pre>{JSON.stringify(task.platformAction, null, 2)}</pre>
            </div>
          </div>

          {/* Deadline Reschedule Input */}
          <div className="bg-slate-950/40 p-3.5 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="text-slate-300 font-medium">Update Hard Deadline SLA</div>
              <div className="text-[11px] text-slate-500">
                Rescheduling recalculates urgency matrix and reprioritizes the autonomous queue
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={editableDeadline}
                onChange={(e) => setEditableDeadline(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleDeadlineSave}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-xs font-medium"
              >
                Save
              </button>
            </div>
          </div>

          {/* Execution Audit Trail / Logs */}
          <div>
            <div className="text-slate-400 font-medium mb-1.5">Agent Execution Audit Trail</div>
            {task.executionLogs.length === 0 ? (
              <div className="text-slate-500 text-center py-4 bg-slate-950/40 rounded-lg border border-slate-800">
                No execution steps logged yet for this task.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[11px]">
                {task.executionLogs.map(log => (
                  <div key={log.id} className="p-2 rounded bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
                      <span className="text-cyan-400 font-semibold">{log.agentRole}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <div className="text-slate-300">{log.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <button
            onClick={() => {
              onDeleteTask(task.id);
              onClose();
            }}
            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-3">
            {task.status !== 'completed' ? (
              <button
                onClick={() => {
                  onCompleteTask(task);
                  onClose();
                }}
                className="px-3.5 py-2 text-xs font-medium text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Completed</span>
              </button>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1 text-xs font-mono">
                <CheckCircle2 className="w-4 h-4" />
                Completed
              </span>
            )}

            {task.status !== 'completed' && (
              <button
                onClick={() => {
                  onExecuteTask(task);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-cyan-500/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run with Agent</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
