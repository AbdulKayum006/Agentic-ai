import React from 'react';
import { 
  Network, 
  GitPullRequest, 
  Server, 
  MessageSquare, 
  FileText, 
  Calendar, 
  CheckSquare, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  RefreshCw,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Task, WorkflowEdge, WorkflowTemplate, PlatformId } from '../types';
import { calculateDeadlineMeta } from '../utils/priorityEngine';

interface WorkflowCanvasProps {
  tasks: Task[];
  templates: WorkflowTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  onSelectTask: (task: Task) => void;
  onExecuteWorkflow: () => void;
  onOpenNewTaskModal: () => void;
  isCycleRunning: boolean;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  tasks,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onSelectTask,
  onExecuteWorkflow,
  onOpenNewTaskModal,
  isCycleRunning,
}) => {
  const currentTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  const getPlatformIcon = (platform: PlatformId) => {
    switch (platform) {
      case 'github': return <GitPullRequest className="w-4 h-4 text-slate-300" />;
      case 'linear': return <CheckSquare className="w-4 h-4 text-indigo-400" />;
      case 'jira': return <Server className="w-4 h-4 text-blue-400" />;
      case 'slack': return <MessageSquare className="w-4 h-4 text-amber-400" />;
      case 'notion': return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'calendar': return <Calendar className="w-4 h-4 text-rose-400" />;
      case 'cicd': return <Server className="w-4 h-4 text-cyan-400" />;
      default: return <Zap className="w-4 h-4 text-slate-400" />;
    }
  };

  // Group tasks into topological workflow columns
  // Column 1: Ingestion & Trigger (no dependencies)
  // Column 2: Code Synthesis & Remediation (dependencies on column 1)
  // Column 3: Verification & Canaries (dependencies on column 2)
  // Column 4: Comms, Docs & Release
  const stage1 = tasks.filter(t => t.dependencies.length === 0);
  const stage2 = tasks.filter(t => t.dependencies.some(d => stage1.map(s => s.id).includes(d)) && !stage1.includes(t));
  const stage3 = tasks.filter(t => !stage1.includes(t) && !stage2.includes(t));

  const stages = [
    { title: 'Trigger & Discovery', subtitle: 'Event Ingestion', items: stage1 },
    { title: 'Autonomous Action', subtitle: 'Code & Dispatch', items: stage2 },
    { title: 'Verification & Sync', subtitle: 'SLA Audit & Release', items: stage3 },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col min-h-[580px]">
      {/* Canvas Top Bar */}
      <div className="p-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-slate-950/40">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">Directed Acyclic Graph (DAG) Orchestrator</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-platform autonomous node execution with deterministic dependency gates
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Workflow Template Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="hidden sm:inline">Preset:</span>
            <select
              value={selectedTemplateId}
              onChange={(e) => onSelectTemplate(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              {templates.map(tpl => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenNewTaskModal}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Node</span>
          </button>

          <button
            onClick={onExecuteWorkflow}
            disabled={isCycleRunning}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-sm shadow-cyan-500/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Pipeline Step</span>
          </button>
        </div>
      </div>

      {/* Interactive Visual Graph Canvas */}
      <div className="p-6 flex-1 overflow-x-auto bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="min-w-[900px] grid grid-cols-3 gap-8 relative">
          {stages.map((stage, stageIdx) => (
            <div key={stageIdx} className="space-y-4">
              {/* Stage Header */}
              <div className="border-b border-slate-800/80 pb-2">
                <div className="text-xs font-semibold text-white tracking-wide uppercase">
                  {stage.title}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {stage.subtitle} ({stage.items.length} nodes)
                </div>
              </div>

              {/* Stage Nodes */}
              <div className="space-y-3">
                {stage.items.length === 0 ? (
                  <div className="p-4 border border-dashed border-slate-800 rounded-lg text-center text-xs text-slate-600">
                    No active nodes in this stage
                  </div>
                ) : (
                  stage.items.map(task => {
                    const isCompleted = task.status === 'completed';
                    const isInProgress = task.status === 'in_progress';
                    const isBlocked = task.status === 'blocked';
                    const deadlineMeta = calculateDeadlineMeta(task.deadline);

                    return (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                          isCompleted
                            ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-300'
                            : isInProgress
                            ? 'bg-cyan-950/30 border-cyan-500 shadow-md shadow-cyan-500/10'
                            : isBlocked
                            ? 'bg-slate-950/60 border-slate-800/80 text-slate-400 opacity-75'
                            : 'bg-slate-900/90 border-slate-700/80 hover:border-cyan-500/60 text-white'
                        }`}
                      >
                        {/* Status Accent Bar */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                            {getPlatformIcon(task.platform)}
                            <span>{task.platform}</span>
                          </div>

                          <span className={`text-[11px] font-mono tabular-nums ${
                            isCompleted ? 'text-emerald-400' :
                            deadlineMeta.isOverdue ? 'text-rose-400' :
                            'text-slate-400'
                          }`}>
                            {deadlineMeta.displayTime}
                          </span>
                        </div>

                        {/* Title */}
                        <div className="text-xs font-medium text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-2">
                          {task.title}
                        </div>

                        {/* Target action */}
                        <div className="mt-2 text-[11px] font-mono text-slate-400 bg-slate-950/60 px-2 py-1 rounded border border-slate-800/60 truncate">
                          {task.platformAction.type}
                        </div>

                        {/* Footer status */}
                        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                          <span>Urgency: {task.urgencyScore}</span>
                          <span className="capitalize font-mono text-slate-400">
                            {isCompleted ? '✓ Done' : isInProgress ? '● Running' : isBlocked ? '⊗ Blocked' : '○ Ready'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas Summary Footer */}
      <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Completed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Active Exec</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Blocked on Dep</span>
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Target SLA Compliance: 99.98%
        </div>
      </div>
    </div>
  );
};
