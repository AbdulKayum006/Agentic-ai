import React from 'react';
import { 
  Play, 
  Pause, 
  Settings2, 
  Bot, 
  Network, 
  Clock, 
  Layers, 
  KeyRound, 
  ShieldCheck,
  RotateCw,
  Sparkles
} from 'lucide-react';
import { OpenAIConfig } from '../types';

interface HeaderProps {
  currentTab: 'orchestrator' | 'canvas' | 'deadlines' | 'platforms' | 'openai';
  onSelectTab: (tab: 'orchestrator' | 'canvas' | 'deadlines' | 'platforms' | 'openai') => void;
  autonomyMode: 'autopilot' | 'copilot' | 'paused';
  onChangeAutonomyMode: (mode: 'autopilot' | 'copilot' | 'paused') => void;
  onRunStep: () => void;
  isCycleRunning: boolean;
  openAIConfig: OpenAIConfig;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  autonomyMode,
  onChangeAutonomyMode,
  onRunStep,
  isCycleRunning,
  openAIConfig,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center p-0.5 shadow-sm shadow-cyan-500/20">
            <img 
              src="/src/assets/images/agent_neural_core_1790481807069.jpg" 
              alt="Nexus Neural Core" 
              className="w-full h-full object-cover rounded-md"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback container
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <button 
            onClick={() => onSelectTab('orchestrator')}
            className="text-left group cursor-pointer"
          >
            <span className="text-base font-semibold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              NexusAgent
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 font-mono">
              v2.8 · Autonomous Core
            </span>
          </button>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800/60 text-xs font-medium">
          <button
            onClick={() => onSelectTab('orchestrator')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              currentTab === 'orchestrator' 
                ? 'bg-slate-800 text-cyan-400 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Orchestrator</span>
          </button>

          <button
            onClick={() => onSelectTab('canvas')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              currentTab === 'canvas' 
                ? 'bg-slate-800 text-cyan-400 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Workflow DAG</span>
          </button>

          <button
            onClick={() => onSelectTab('deadlines')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              currentTab === 'deadlines' 
                ? 'bg-slate-800 text-cyan-400 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Deadlines Matrix</span>
          </button>

          <button
            onClick={() => onSelectTab('platforms')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              currentTab === 'platforms' 
                ? 'bg-slate-800 text-cyan-400 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Connectors</span>
          </button>

          <button
            onClick={() => onSelectTab('openai')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              currentTab === 'openai' 
                ? 'bg-slate-800 text-cyan-400 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>OpenAI API</span>
            {openAIConfig.mode === 'openai_direct' && openAIConfig.apiKey ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          {/* Autonomy Mode Selector */}
          <div className="hidden lg:flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => onChangeAutonomyMode('autopilot')}
              title="Autonomous continuous execution"
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                autonomyMode === 'autopilot' 
                  ? 'bg-cyan-500/20 text-cyan-300 font-medium' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Auto-Pilot</span>
            </button>
            <button
              onClick={() => onChangeAutonomyMode('copilot')}
              title="Requires human approval for critical actions"
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                autonomyMode === 'copilot' 
                  ? 'bg-amber-500/20 text-amber-300 font-medium' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              <span>Co-Pilot</span>
            </button>
            <button
              onClick={() => onChangeAutonomyMode('paused')}
              title="Execution paused"
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                autonomyMode === 'paused' 
                  ? 'bg-slate-800 text-slate-300 font-medium' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Pause className="w-3 h-3" />
              <span>Paused</span>
            </button>
          </div>

          {/* Trigger Step Button */}
          <button
            onClick={onRunStep}
            disabled={isCycleRunning}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all whitespace-nowrap shadow-sm ${
              isCycleRunning
                ? 'bg-slate-800 text-cyan-300 cursor-not-allowed border border-cyan-500/30'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium shadow-cyan-500/20 hover:shadow-cyan-500/30'
            }`}
          >
            {isCycleRunning ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Deliberating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Agent Step</span>
              </>
            )}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors border border-transparent hover:border-slate-700"
            title="Configure OpenAI Connection & Engine"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
