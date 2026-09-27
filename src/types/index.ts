export type PlatformId = 
  | 'github' 
  | 'jira' 
  | 'linear' 
  | 'slack' 
  | 'notion' 
  | 'calendar' 
  | 'cicd' 
  | 'custom';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'failed';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface PlatformAction {
  type: string;
  targetResource: string;
  method: string;
  payload: Record<string, any>;
  resultSummary?: string;
  requiresApproval?: boolean;
  executedAt?: string;
  status?: 'pending' | 'executed' | 'skipped' | 'failed';
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  type: 'thought' | 'tool_call' | 'tool_result' | 'reflection' | 'error' | 'approval_request';
  agentRole: string;
  message: string;
  details?: any;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  platform: PlatformId;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string; // ISO 8601 string
  estimatedMinutes: number;
  dependencies: string[]; // IDs of tasks that must complete first
  assignedAgentRole: string;
  platformAction: PlatformAction;
  executionLogs: ExecutionLog[];
  urgencyScore: number; // 0 - 100 calculated by priorityEngine
  tags: string[];
}

export interface WorkflowNode {
  id: string;
  taskId: string;
  x: number;
  y: number;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  slaHours: number;
  tasks: Task[];
  edges: WorkflowEdge[];
}

export interface PlatformConnection {
  id: PlatformId;
  name: string;
  category: 'code' | 'project_management' | 'communication' | 'docs' | 'scheduling' | 'devops';
  status: 'connected' | 'idle' | 'rate_limited' | 'error';
  authType: 'api_key' | 'oauth_token' | 'webhook';
  apiKeyMasked: string;
  endpointUrl: string;
  lastSync: string;
  eventsProcessed: number;
  enabled: boolean;
  capabilities: string[];
}

export interface OpenAIConfig {
  apiKey: string;
  baseUrl: string;
  model: 'gpt-4o' | 'gpt-4o-mini' | 'o3-mini' | 'o1' | 'gpt-4-turbo';
  organizationId?: string;
  temperature: number;
  mode: 'openai_direct' | 'gemini_fallback' | 'autonomous_sim';
  isConnected: boolean;
  lastTested?: string;
  latencyMs?: number;
  systemPrompt: string;
}

export interface AgentRunCycle {
  runId: string;
  timestamp: string;
  status: 'analyzing' | 'prioritizing' | 'executing' | 'verifying' | 'idle' | 'waiting_approval';
  currentTaskId?: string;
  taskTitle?: string;
  objective: string;
  thoughts: string[];
  toolCalls: {
    platform: PlatformId;
    toolName: string;
    input: any;
    output?: any;
    success: boolean;
  }[];
  tokensUsed: number;
  latencyMs: number;
  reflectionSummary?: string;
}
