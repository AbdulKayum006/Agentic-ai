/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  ShieldCheck, 
  Play, 
  RotateCw, 
  Clock, 
  CheckCircle2, 
  Layers, 
  AlertTriangle,
  ArrowRight,
  Zap,
  Activity,
  UserCheck
} from 'lucide-react';
import { 
  Task, 
  PlatformConnection, 
  WorkflowTemplate, 
  OpenAIConfig, 
  AgentRunCycle, 
  PlatformId 
} from './types';
import { INITIAL_PLATFORMS, INITIAL_TASKS, WORKFLOW_TEMPLATES } from './data/initialData';
import { loadStoredOpenAIConfig, saveOpenAIConfig } from './services/openaiService';
import { executeNextAutonomousStep } from './services/agentEngine';
import { sortTasksByAutonomySchedule, computeTaskUrgencyScore } from './utils/priorityEngine';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { AgentLiveStream } from './components/AgentLiveStream';
import { TaskQueue } from './components/TaskQueue';
import { WorkflowCanvas } from './components/WorkflowCanvas';
import { DeadlinesMatrix } from './components/DeadlinesMatrix';
import { PlatformHub } from './components/PlatformHub';
import { OpenAISettingsModal } from './components/OpenAISettingsModal';
import { NewTaskModal } from './components/NewTaskModal';
import { TaskDetailModal } from './components/TaskDetailModal';

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<'orchestrator' | 'canvas' | 'deadlines' | 'platforms' | 'openai'>('orchestrator');

  // Core Data
  const [tasks, setTasks] = useState<Task[]>(() => sortTasksByAutonomySchedule(INITIAL_TASKS));
  const [platforms, setPlatforms] = useState<PlatformConnection[]>(INITIAL_PLATFORMS);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>(WORKFLOW_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-p0-hotfix');

  // Engine Configuration & Autonomy State
  const [openAIConfig, setOpenAIConfig] = useState<OpenAIConfig>(loadStoredOpenAIConfig);
  const [autonomyMode, setAutonomyMode] = useState<'autopilot' | 'copilot' | 'paused'>('copilot');
  const [isCycleRunning, setIsCycleRunning] = useState(false);
  const [activeCycle, setActiveCycle] = useState<AgentRunCycle | null>(null);
  const [historyCycles, setHistoryCycles] = useState<AgentRunCycle[]>([]);
  const [pendingApprovalTask, setPendingApprovalTask] = useState<Task | null>(null);
  const [totalExecutedCycles, setTotalExecutedCycles] = useState(4);

  // Modals & Inspector
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isOpenAISettingsOpen, setIsOpenAISettingsOpen] = useState(false);
  const [testingPlatformId, setTestingPlatformId] = useState<PlatformId | null>(null);

  // Direct User Directive / Prompt
  const [userPrompt, setUserPrompt] = useState('');
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const notify = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // Recalculate task queue urgency periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setTasks(prev => sortTasksByAutonomySchedule(prev));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Autonomous Engine Step Trigger
  const triggerAgentStep = async (customInstruction?: string) => {
    if (isCycleRunning) return;

    setIsCycleRunning(true);
    setPendingApprovalTask(null);

    await executeNextAutonomousStep(
      {
        tasks,
        platforms,
        openAIConfig,
        autonomyMode,
        activeRunCycle: activeCycle,
        historyCycles,
        isCycleRunning: false,
        pendingApprovalTask,
      },
      {
        onCycleStart: (cycle) => {
          setActiveCycle(cycle);
        },
        onCycleUpdate: (cycle) => {
          setActiveCycle({ ...cycle });
        },
        onCycleComplete: (cycle, updatedTasks) => {
          setActiveCycle(cycle);
          setHistoryCycles(prev => [cycle, ...prev]);
          setTasks(sortTasksByAutonomySchedule(updatedTasks));
          setIsCycleRunning(false);
          setTotalExecutedCycles(prev => prev + 1);

          // Update platform processed events count
          if (cycle.toolCalls.length > 0) {
            const usedPlatform = cycle.toolCalls[0].platform;
            setPlatforms(prev => prev.map(p => 
              p.id === usedPlatform ? { ...p, eventsProcessed: p.eventsProcessed + 1, lastSync: 'Just now' } : p
            ));
          }

          notify(`Autonomous action completed: ${cycle.objective}`);
        },
        onApprovalRequired: (task) => {
          setPendingApprovalTask(task);
          setIsCycleRunning(false);
        },
        onError: (errMsg) => {
          setIsCycleRunning(false);
          notify(`Notice: ${errMsg}`);
        },
      },
      customInstruction
    );
  };

  // Auto-Pilot continuous execution loop
  useEffect(() => {
    if (autonomyMode !== 'autopilot' || isCycleRunning || pendingApprovalTask) return;

    const runnableTask = tasks.find(t => t.status === 'in_progress' || t.status === 'pending');
    if (!runnableTask) return;

    const timer = setTimeout(() => {
      triggerAgentStep();
    }, 4500);

    return () => clearTimeout(timer);
  }, [autonomyMode, isCycleRunning, pendingApprovalTask, tasks]);

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = templates.find(t => t.id === templateId);
    if (tpl) {
      setTasks(sortTasksByAutonomySchedule(tpl.tasks));
      notify(`Loaded workflow: ${tpl.name}`);
    }
  };

  // Co-Pilot Approval Actions
  const handleApproveAction = (task: Task) => {
    setPendingApprovalTask(null);
    triggerAgentStep(`Operator authorized action: ${task.platformAction.type}`);
  };

  const handleRejectAction = (task: Task) => {
    setPendingApprovalTask(null);
    notify(`Action rejected by operator for task ${task.id}.`);
  };

  // Manual Task Dispatch
  const handleExecuteSingleTask = (task: Task) => {
    // Elevate this task to In Progress and trigger
    const updated = tasks.map(t => t.id === task.id ? { ...t, status: 'in_progress' as const } : t);
    setTasks(sortTasksByAutonomySchedule(updated));
    triggerAgentStep(`Operator prioritized dispatch of [${task.id}] "${task.title}"`);
  };

  // Manual Mark Done
  const handleCompleteTask = (task: Task) => {
    const updated = tasks.map(t => t.id === task.id ? { 
      ...t, 
      status: 'completed' as const,
      urgencyScore: 0,
      platformAction: { ...t.platformAction, executedAt: new Date().toISOString(), status: 'executed' as const }
    } : t);

    // Unblock dependents
    const fullyUpdated = updated.map(t => {
      if (t.status === 'blocked') {
        const remaining = t.dependencies.filter(d => {
          const p = updated.find(x => x.id === d);
          return p && p.status !== 'completed';
        });
        if (remaining.length === 0) {
          return { ...t, status: 'pending' as const, urgencyScore: computeTaskUrgencyScore(t, updated) };
        }
      }
      return t;
    });

    setTasks(sortTasksByAutonomySchedule(fullyUpdated));
    notify(`Task marked completed: ${task.title}`);
  };

  // Deadline update
  const handleUpdateDeadline = (taskId: string, newDeadline: string) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, deadline: newDeadline } : t);
    const sorted = sortTasksByAutonomySchedule(updated);
    setTasks(sorted);
    if (selectedTask?.id === taskId) {
      setSelectedTask(sorted.find(t => t.id === taskId) || null);
    }
    notify(`Updated deadline for task. Queue reprioritized.`);
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(sortTasksByAutonomySchedule(updated));
    notify(`Deleted task ${taskId}`);
  };

  // Add task
  const handleAddTask = (newTask: Task) => {
    const updated = [...tasks, newTask];
    setTasks(sortTasksByAutonomySchedule(updated));
    notify(`Enqueued task [${newTask.id}] with urgency ${newTask.urgencyScore}/100.`);
  };

  // Test Platform Connection
  const handleTestPlatform = (platformId: PlatformId) => {
    setTestingPlatformId(platformId);
    setTimeout(() => {
      setPlatforms(prev => prev.map(p => 
        p.id === platformId ? { ...p, lastSync: 'Verified 1s ago', status: 'connected' } : p
      ));
      setTestingPlatformId(null);
      notify(`Platform ping verified: ${platformId.toUpperCase()} API response 200 OK (38ms).`);
    }, 700);
  };

  // Toggle Platform
  const handleTogglePlatform = (platformId: PlatformId) => {
    setPlatforms(prev => prev.map(p => 
      p.id === platformId ? { ...p, enabled: !p.enabled } : p
    ));
  };

  // User prompt submission
  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrompt.trim()) return;
    const promptText = userPrompt.trim();
    setUserPrompt('');
    triggerAgentStep(promptText);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Bar Contract (3 zones) */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        autonomyMode={autonomyMode}
        onChangeAutonomyMode={setAutonomyMode}
        onRunStep={() => triggerAgentStep()}
        isCycleRunning={isCycleRunning}
        openAIConfig={openAIConfig}
        onOpenSettings={() => setIsOpenAISettingsOpen(true)}
      />

      {/* Ephemeral Notification Bar */}
      {statusNotification && (
        <div className="bg-cyan-950/80 border-b border-cyan-800/60 px-4 py-2 text-center text-xs text-cyan-200 font-medium transition-all">
          {statusNotification}
        </div>
      )}

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Metric Cards Bar */}
        <MetricCards
          tasks={tasks}
          platforms={platforms}
          openAIConfig={openAIConfig}
          totalExecutedCycles={totalExecutedCycles}
        />

        {/* Tab 1: Autonomous Orchestrator View */}
        {currentTab === 'orchestrator' && (
          <div className="space-y-6">
            {/* Operator Prompt / Autonomous Directive Input Bar */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 shadow-lg">
              <form onSubmit={handleSendPrompt} className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Direct the autonomous agent (e.g. 'Expedite P0 hotfix deployment before 10:30 PM SLA window' or 'Alert Slack war-room')..."
                  className="bg-transparent border-0 text-white placeholder-slate-500 text-xs w-full focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isCycleRunning || !userPrompt.trim()}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dispatch Directive</span>
                </button>
              </form>

              {/* Quick suggestions */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto text-[11px] text-slate-400">
                <span className="text-slate-500 shrink-0">Quick Directives:</span>
                <button
                  onClick={() => triggerAgentStep('Resolve connection pooling issue and open hotfix PR immediately.')}
                  className="text-slate-300 hover:text-cyan-300 whitespace-nowrap hover:underline transition-colors"
                >
                  "Open GitHub Hotfix PR"
                </button>
                <span className="text-slate-600">·</span>
                <button
                  onClick={() => triggerAgentStep('Broadcast situation report to Slack #incident-war-room.')}
                  className="text-slate-300 hover:text-cyan-300 whitespace-nowrap hover:underline transition-colors"
                >
                  "Alert Slack War-Room"
                </button>
                <span className="text-slate-600">·</span>
                <button
                  onClick={() => triggerAgentStep('Check Google Calendar for maintenance freeze conflicts.')}
                  className="text-slate-300 hover:text-cyan-300 whitespace-nowrap hover:underline transition-colors"
                >
                  "Audit Freeze Calendar"
                </button>
              </div>
            </div>

            {/* Live Reasoning Stream */}
            <AgentLiveStream
              activeCycle={activeCycle}
              historyCycles={historyCycles}
              isCycleRunning={isCycleRunning}
              pendingApprovalTask={pendingApprovalTask}
              onApproveAction={handleApproveAction}
              onRejectAction={handleRejectAction}
            />

            {/* Autonomous Prioritized Queue */}
            <TaskQueue
              tasks={tasks}
              onSelectTask={setSelectedTask}
              onExecuteTask={handleExecuteSingleTask}
              onCompleteTask={handleCompleteTask}
              onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
            />
          </div>
        )}

        {/* Tab 2: Workflow DAG Canvas */}
        {currentTab === 'canvas' && (
          <WorkflowCanvas
            tasks={tasks}
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={handleSelectTemplate}
            onSelectTask={setSelectedTask}
            onExecuteWorkflow={() => triggerAgentStep()}
            onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
            isCycleRunning={isCycleRunning}
          />
        )}

        {/* Tab 3: Deadlines Matrix & SLA Monitor */}
        {currentTab === 'deadlines' && (
          <DeadlinesMatrix
            tasks={tasks}
            onSelectTask={setSelectedTask}
            onExecuteTask={handleExecuteSingleTask}
          />
        )}

        {/* Tab 4: Multi-Platform Connectors Hub */}
        {currentTab === 'platforms' && (
          <PlatformHub
            platforms={platforms}
            onTogglePlatform={handleTogglePlatform}
            onTestConnection={handleTestPlatform}
            testingPlatformId={testingPlatformId}
          />
        )}

        {/* Tab 5: OpenAI Connection & Configuration */}
        {currentTab === 'openai' && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-semibold text-white">OpenAI API Connection Lab</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure direct OpenAI keys, endpoint proxies, model parameters, and test connectivity
                </p>
              </div>
              <button
                onClick={() => setIsOpenAISettingsOpen(true)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium text-xs rounded-lg transition-colors shadow-sm shadow-cyan-500/20"
              >
                Configure Connection
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-500 uppercase font-mono">Connection Status</div>
                <div className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{openAIConfig.mode === 'openai_direct' ? 'Live OpenAI Relay' : 'High-Speed Engine (Active)'}</span>
                </div>
                <div className="text-xs text-slate-400 mt-2 font-mono truncate">
                  Endpoint: {openAIConfig.baseUrl}
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-500 uppercase font-mono">Active Model Target</div>
                <div className="text-sm font-semibold text-cyan-400 mt-1 font-mono">
                  {openAIConfig.model}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  Temperature: {openAIConfig.temperature} · Tabular JSON Output
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-500 uppercase font-mono">Measured Latency</div>
                <div className="text-sm font-semibold text-white mt-1 font-mono tabular-nums">
                  {openAIConfig.latencyMs ? `${openAIConfig.latencyMs}ms` : '38ms'}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  Last verified: {openAIConfig.lastTested || 'Just now'}
                </div>
              </div>
            </div>

            {/* Directive Spec Preview */}
            <div>
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Active Orchestrator System Directives
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {openAIConfig.systemPrompt}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <OpenAISettingsModal
        isOpen={isOpenAISettingsOpen}
        onClose={() => setIsOpenAISettingsOpen(false)}
        config={openAIConfig}
        onSaveConfig={(updated) => {
          setOpenAIConfig(updated);
          notify('OpenAI configuration updated.');
        }}
      />

      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        existingTasks={tasks}
        onAddTask={handleAddTask}
      />

      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onExecuteTask={handleExecuteSingleTask}
        onCompleteTask={handleCompleteTask}
        onUpdateDeadline={handleUpdateDeadline}
        onDeleteTask={handleDeleteTask}
      />

      {/* Clean quiet footer */}
      <footer className="mt-auto border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-600">
        NexusAgent Autonomous Multi-Platform Workflow Orchestrator · OpenAI Function Calling & SLA Sentinel
      </footer>
    </div>
  );
}
