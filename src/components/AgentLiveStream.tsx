import React from 'react';
import { 
  Bot, 
  Terminal, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  Cpu,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AgentRunCycle, Task } from '../types';

interface AgentLiveStreamProps {
  activeCycle: AgentRunCycle | null;
  historyCycles: AgentRunCycle[];
  isCycleRunning: boolean;
  pendingApprovalTask: Task | null;
  onApproveAction: (task: Task) => void;
  onRejectAction: (task: Task) => void;
}

export const AgentLiveStream: React.FC<AgentLiveStreamProps> = ({
  activeCycle,
  historyCycles,
  isCycleRunning,
  pendingApprovalTask,
  onApproveAction,
  onRejectAction,
}) => {
  const [showHistory, setShowHistory] = React.useState(false);

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col">
      {/* Stream Header */}
      <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Autonomous Agent Reasoning Loop</h3>
          <span className="text-xs text-slate-500 font-mono">
            {isCycleRunning ? '· Active Deliberation' : '· Standby & Listening'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {activeCycle && (
            <span className="text-slate-400 font-mono tabular-nums">
              latency: {activeCycle.latencyMs}ms · {activeCycle.tokensUsed} tokens
            </span>
          )}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
          >
            <span>History ({historyCycles.length})</span>
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Operator Approval Banner (When Co-Pilot or high-consequence action is triggered) */}
      {pendingApprovalTask && (
        <div className="bg-amber-950/40 border-b border-amber-800/60 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-amber-200">
                  Co-Pilot Authorization Required
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  The autonomous agent synthesized a platform mutation on <span className="font-semibold text-white uppercase">{pendingApprovalTask.platform}</span>:
                </div>
                <div className="mt-2 bg-slate-950/70 p-2.5 rounded-lg border border-amber-900/40 text-xs font-mono text-amber-300 overflow-x-auto max-w-2xl">
                  <div>Action: {pendingApprovalTask.platformAction.type}</div>
                  <div>Target: {pendingApprovalTask.platformAction.targetResource}</div>
                  <div className="text-slate-400 mt-1">
                    Payload: {JSON.stringify(pendingApprovalTask.platformAction.payload)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onRejectAction(pendingApprovalTask)}
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Reject & Modify
              </button>
              <button
                onClick={() => onApproveAction(pendingApprovalTask)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm shadow-amber-500/20"
              >
                Authorize & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Deliberation Body */}
      <div className="p-4 space-y-3 font-mono text-xs">
        {activeCycle ? (
          <div>
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/60 pb-2 mb-3">
              <span className="text-slate-300 font-sans font-medium">
                Cycle: {activeCycle.objective}
              </span>
              <span className="text-slate-500">{activeCycle.timestamp}</span>
            </div>

            {/* Cognitive Thoughts Stream */}
            <div className="space-y-2">
              {activeCycle.thoughts.map((thought, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-slate-300 leading-relaxed">
                  <span className="text-cyan-500 shrink-0 font-mono">›</span>
                  <span className={thought.includes('[Observation]') ? 'text-slate-400' : thought.includes('[Deadline') ? 'text-amber-300' : 'text-slate-200'}>
                    {thought}
                  </span>
                </div>
              ))}
            </div>

            {/* Platform Tool Calls */}
            {activeCycle.toolCalls.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-2">
                <div className="text-slate-400 font-sans text-[11px] font-medium uppercase tracking-wider">
                  Dispatched Platform Tool Operations
                </div>
                {activeCycle.toolCalls.map((tc, idx) => (
                  <div key={idx} className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-cyan-400 font-semibold mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5" />
                        {tc.toolName} ({tc.platform.toUpperCase()})
                      </span>
                      <span className="text-emerald-400 flex items-center gap-1 font-sans text-[11px]">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified Success
                      </span>
                    </div>
                    <div className="text-slate-400 overflow-x-auto text-[11px]">
                      <span className="text-slate-500">Payload: </span>
                      {JSON.stringify(tc.input)}
                    </div>
                    {tc.output && (
                      <div className="mt-1.5 text-emerald-300/90 text-[11px] bg-emerald-950/20 p-1.5 rounded border border-emerald-900/30">
                        <span className="text-slate-400">Response: </span>
                        {typeof tc.output === 'string' ? tc.output : JSON.stringify(tc.output)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Reflection */}
            {activeCycle.reflectionSummary && (
              <div className="mt-3 pt-2 text-slate-400 flex items-start gap-2 border-t border-slate-800/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-300 font-sans">Autonomous Reflection: </strong>
                  {activeCycle.reflectionSummary}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-500 font-sans">
            <Bot className="w-6 h-6 mx-auto mb-2 text-slate-600" />
            <p className="text-xs">Agent loop waiting for next deadline tick or manual trigger.</p>
            <p className="text-[11px] text-slate-600 mt-1">Click "Run Agent Step" above to start autonomous execution.</p>
          </div>
        )}
      </div>

      {/* History Collapsible */}
      {showHistory && historyCycles.length > 0 && (
        <div className="border-t border-slate-800/80 bg-slate-950/60 p-4 max-h-56 overflow-y-auto space-y-3 font-mono text-xs">
          <div className="text-slate-400 font-sans text-xs font-medium">Previous Execution Cycles</div>
          {historyCycles.slice(0, 5).map((cycle, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60">
              <div className="flex items-center justify-between text-slate-300 font-sans">
                <span className="font-medium text-white">{cycle.objective}</span>
                <span className="text-slate-500 tabular-nums">{cycle.timestamp}</span>
              </div>
              <div className="text-slate-400 text-[11px] mt-1 line-clamp-1">
                {cycle.reflectionSummary || cycle.thoughts[0]}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
