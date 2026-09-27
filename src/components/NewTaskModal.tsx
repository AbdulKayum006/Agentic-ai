import React from 'react';
import { X, Plus, Clock, Layers, ShieldAlert, GitPullRequest } from 'lucide-react';
import { PlatformId, Task, TaskPriority } from '../types';
import { computeTaskUrgencyScore } from '../utils/priorityEngine';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTasks: Task[];
  onAddTask: (task: Task) => void;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  existingTasks,
  onAddTask,
}) => {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [platform, setPlatform] = React.useState<PlatformId>('github');
  const [priority, setPriority] = React.useState<TaskPriority>('high');
  // Default deadline: 2 hours from current baseline time 2026-09-26T23:00:00
  const [deadline, setDeadline] = React.useState('2026-09-26T23:00');
  const [estimatedMinutes, setEstimatedMinutes] = React.useState(30);
  const [selectedDependencies, setSelectedDependencies] = React.useState<string[]>([]);
  const [targetResource, setTargetResource] = React.useState('nexus-core/service-gateway');
  const [actionType, setActionType] = React.useState('github_create_pr');
  const [requiresApproval, setRequiresApproval] = React.useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Convert local deadline to ISO string with offset
    const deadlineIso = `${deadline}:00-07:00`;

    const newTask: Task = {
      id: `task-${Date.now().toString(36)}`,
      title: title.trim(),
      description: description.trim() || `Automated ${actionType} triggered on ${platform.toUpperCase()}`,
      platform,
      status: selectedDependencies.length > 0 ? 'blocked' : 'pending',
      priority,
      deadline: deadlineIso,
      estimatedMinutes,
      dependencies: selectedDependencies,
      assignedAgentRole: 'Autonomous Dispatcher',
      platformAction: {
        type: actionType,
        targetResource,
        method: 'POST',
        payload: {
          action: actionType,
          resource: targetResource,
          notes: description,
        },
        requiresApproval,
      },
      executionLogs: [],
      urgencyScore: 75,
      tags: [platform, priority],
    };

    newTask.urgencyScore = computeTaskUrgencyScore(newTask, [...existingTasks, newTask]);

    onAddTask(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">Create Multi-Platform Task</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-medium block mb-1">Task Title / Action Goal</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deploy Database Migration & Notify On-Call"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Platform Integration</label>
              <select
                value={platform}
                onChange={(e) => {
                  const p = e.target.value as PlatformId;
                  setPlatform(p);
                  if (p === 'github') {
                    setActionType('github_create_pr');
                    setTargetResource('nexus-core/service-gateway');
                  } else if (p === 'slack') {
                    setActionType('slack_broadcast');
                    setTargetResource('#incident-war-room');
                  } else if (p === 'linear') {
                    setActionType('linear_issue_triage');
                    setTargetResource('LIN-5100');
                  } else if (p === 'jira') {
                    setActionType('jira_status_transition');
                    setTargetResource('JIRA-9012');
                  } else if (p === 'notion') {
                    setActionType('notion_append_doc');
                    setTargetResource('Release-Changelog');
                  } else if (p === 'cicd') {
                    setActionType('cicd_canary_deploy');
                    setTargetResource('cluster-prod-asia');
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="github">GitHub Enterprise</option>
                <option value="linear">Linear</option>
                <option value="jira">Jira Software</option>
                <option value="slack">Slack Enterprise</option>
                <option value="notion">Notion Workspace</option>
                <option value="calendar">Google Calendar</option>
                <option value="cicd">Cloud CI/CD & Canaries</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Priority SLA</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="critical">Critical (Immediate SLA)</option>
                <option value="high">High (4h Horizon)</option>
                <option value="medium">Medium (12h Horizon)</option>
                <option value="low">Low (Flexible)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Hard Deadline SLA</label>
              <input
                type="datetime-local"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Estimated Duration (mins)</label>
              <input
                type="number"
                min="5"
                max="360"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 15)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Action Type</label>
              <input
                type="text"
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Target Resource</label>
              <input
                type="text"
                value={targetResource}
                onChange={(e) => setTargetResource(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Description & Context</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Operational details for the autonomous agent..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Dependencies Multi-Select */}
          {existingTasks.length > 0 && (
            <div>
              <label className="text-slate-300 font-medium block mb-1.5">
                Upstream Dependencies (DAG Blockers)
              </label>
              <div className="max-h-32 overflow-y-auto space-y-1.5 p-2 bg-slate-950 rounded-lg border border-slate-800">
                {existingTasks.map(t => (
                  <label key={t.id} className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={selectedDependencies.includes(t.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDependencies([...selectedDependencies, t.id]);
                        } else {
                          setSelectedDependencies(selectedDependencies.filter(d => d !== t.id));
                        }
                      }}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span className="font-mono text-[11px] text-slate-500">[{t.id}]</span>
                    <span className="truncate">{t.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Requires Approval Toggle */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-200">Require Co-Pilot Authorization</div>
              <div className="text-[11px] text-slate-500">
                Agent will pause and await operator approval before invoking this platform action
              </div>
            </div>
            <input
              type="checkbox"
              checked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-700 focus:ring-0"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm shadow-cyan-500/20"
            >
              Add to Queue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
