import { AgentRunCycle, ExecutionLog, OpenAIConfig, PlatformConnection, Task } from '../types';
import { runAgentReasoningCycle } from './openaiService';
import { computeTaskUrgencyScore, sortTasksByAutonomySchedule } from '../utils/priorityEngine';

export interface OrchestratorState {
  tasks: Task[];
  platforms: PlatformConnection[];
  openAIConfig: OpenAIConfig;
  autonomyMode: 'autopilot' | 'copilot' | 'paused';
  activeRunCycle: AgentRunCycle | null;
  historyCycles: AgentRunCycle[];
  isCycleRunning: boolean;
  pendingApprovalTask: Task | null;
}

export async function executeNextAutonomousStep(
  state: OrchestratorState,
  callbacks: {
    onCycleStart: (cycle: AgentRunCycle) => void;
    onCycleUpdate: (cycle: AgentRunCycle) => void;
    onCycleComplete: (cycle: AgentRunCycle, updatedTasks: Task[]) => void;
    onApprovalRequired: (task: Task) => void;
    onError: (error: string) => void;
  },
  customInstruction?: string
): Promise<void> {
  if (state.isCycleRunning) return;

  // 1. Identify candidate tasks
  const sortedTasks = sortTasksByAutonomySchedule(state.tasks);
  
  // Find next runnable task (not completed, not blocked)
  const candidate = sortedTasks.find(t => t.status === 'in_progress') || 
                    sortedTasks.find(t => t.status === 'pending');

  if (!candidate) {
    callbacks.onError('All tasks are completed or blocked. No runnable tasks in queue.');
    return;
  }

  // Check if dependencies are actually cleared
  const unfinishedDeps = candidate.dependencies.filter(depId => {
    const parent = state.tasks.find(t => t.id === depId);
    return parent && parent.status !== 'completed';
  });

  if (unfinishedDeps.length > 0) {
    // Mark as blocked and retry with next unblocked task
    const updated = state.tasks.map(t => t.id === candidate.id ? { ...t, status: 'blocked' as const } : t);
    callbacks.onCycleComplete({
      runId: `run-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      status: 'idle',
      objective: `Blocked on dependencies: ${unfinishedDeps.join(', ')}`,
      thoughts: [`Task ${candidate.id} cannot proceed until ${unfinishedDeps.join(', ')} complete. Marking as blocked.`],
      toolCalls: [],
      tokensUsed: 0,
      latencyMs: 10,
    }, updated);
    return;
  }

  const runId = `cycle-${Date.now().toString(36)}`;
  const initialCycle: AgentRunCycle = {
    runId,
    timestamp: new Date().toLocaleTimeString(),
    status: 'analyzing',
    currentTaskId: candidate.id,
    taskTitle: candidate.title,
    objective: `Autonomous SLA Execution: ${candidate.title}`,
    thoughts: [
      `[Trigger] Prioritized task [${candidate.id}] on ${candidate.platform.toUpperCase()} with urgency score ${candidate.urgencyScore}/100.`,
      `[Deadline SLA] Scheduled target: ${candidate.deadline}.`,
    ],
    toolCalls: [],
    tokensUsed: 0,
    latencyMs: 0,
  };

  callbacks.onCycleStart(initialCycle);

  // If Co-Pilot mode or task requires approval, check if we need user sign-off
  if (state.autonomyMode === 'copilot' || candidate.platformAction.requiresApproval) {
    if (!candidate.platformAction.executedAt) {
      initialCycle.status = 'waiting_approval';
      initialCycle.thoughts.push(`[Co-Pilot Guardrail] Platform action "${candidate.platformAction.type}" requires operator sign-off.`);
      callbacks.onCycleUpdate(initialCycle);
      callbacks.onApprovalRequired(candidate);
      return;
    }
  }

  try {
    initialCycle.status = 'executing';
    callbacks.onCycleUpdate(initialCycle);

    // Call OpenAI / reasoning loop
    const reasoningResult = await runAgentReasoningCycle(
      state.openAIConfig,
      candidate,
      state.tasks,
      customInstruction
    );

    initialCycle.thoughts = [...initialCycle.thoughts, ...reasoningResult.thoughts];
    initialCycle.toolCalls = reasoningResult.toolCalls;
    initialCycle.tokensUsed = reasoningResult.tokensUsed;
    initialCycle.latencyMs = reasoningResult.latencyMs;
    initialCycle.reflectionSummary = reasoningResult.reflection;
    initialCycle.status = 'verifying';

    callbacks.onCycleUpdate(initialCycle);

    // Create execution log entries for the task
    const newLogs: ExecutionLog[] = reasoningResult.thoughts.map((msg, idx) => ({
      id: `log-${Date.now()}-${idx}`,
      timestamp: new Date().toLocaleTimeString(),
      type: idx === 0 ? 'thought' : 'tool_call',
      agentRole: candidate.assignedAgentRole,
      message: msg,
    }));

    // Update target task to completed
    let updatedTasks = state.tasks.map(t => {
      if (t.id === candidate.id) {
        return {
          ...t,
          status: 'completed' as const,
          urgencyScore: 0,
          platformAction: {
            ...t.platformAction,
            executedAt: new Date().toISOString(),
            status: 'executed' as const,
            resultSummary: reasoningResult.toolCalls[0]?.output?.result || 'Completed via Autonomous Agent.',
          },
          executionLogs: [...t.executionLogs, ...newLogs],
        };
      }
      return t;
    });

    // Check if any blocked tasks can now be unblocked!
    updatedTasks = updatedTasks.map(t => {
      if (t.status === 'blocked') {
        const remainingBlockers = t.dependencies.filter(depId => {
          const parent = updatedTasks.find(p => p.id === depId);
          return parent && parent.status !== 'completed';
        });

        if (remainingBlockers.length === 0) {
          return {
            ...t,
            status: 'pending' as const,
            urgencyScore: computeTaskUrgencyScore(t, updatedTasks),
            executionLogs: [
              ...t.executionLogs,
              {
                id: `log-unblock-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString(),
                type: 'thought',
                agentRole: 'Orchestrator',
                message: `Dependency [${candidate.id}] resolved. Task unblocked and promoted to runnable queue.`,
              },
            ],
          };
        }
      }
      return t;
    });

    initialCycle.status = 'idle';
    callbacks.onCycleComplete(initialCycle, updatedTasks);

  } catch (err: any) {
    callbacks.onError(err.message || 'Execution cycle failed.');
  }
}
