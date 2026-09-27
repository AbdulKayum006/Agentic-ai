import React from 'react';
import { 
  GitPullRequest, 
  CheckSquare, 
  Server, 
  MessageSquare, 
  FileText, 
  Calendar, 
  Zap, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  Lock,
  ExternalLink
} from 'lucide-react';
import { PlatformConnection, PlatformId } from '../types';

interface PlatformHubProps {
  platforms: PlatformConnection[];
  onTogglePlatform: (platformId: PlatformId) => void;
  onTestConnection: (platformId: PlatformId) => void;
  testingPlatformId: PlatformId | null;
}

export const PlatformHub: React.FC<PlatformHubProps> = ({
  platforms,
  onTogglePlatform,
  onTestConnection,
  testingPlatformId,
}) => {
  const getIcon = (id: PlatformId) => {
    switch (id) {
      case 'github': return <GitPullRequest className="w-5 h-5 text-slate-200" />;
      case 'linear': return <CheckSquare className="w-5 h-5 text-indigo-400" />;
      case 'jira': return <Server className="w-5 h-5 text-blue-400" />;
      case 'slack': return <MessageSquare className="w-5 h-5 text-amber-400" />;
      case 'notion': return <FileText className="w-5 h-5 text-emerald-400" />;
      case 'calendar': return <Calendar className="w-5 h-5 text-rose-400" />;
      case 'cicd': return <Zap className="w-5 h-5 text-cyan-400" />;
      default: return <Server className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-base font-semibold text-white">Multi-Platform Integration Hub</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time API & Webhook connectors allowing the OpenAI agent to dispatch actions across tooling
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {platforms.filter(p => p.status === 'connected' && p.enabled).length} Active Connectors
          </span>
        </div>
      </div>

      {/* Grid of Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map(platform => {
          const isTesting = testingPlatformId === platform.id;

          return (
            <div
              key={platform.id}
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                platform.enabled
                  ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              <div>
                {/* Top Bar */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                      {getIcon(platform.id)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{platform.name}</h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {platform.authType.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platform.enabled}
                      onChange={() => onTogglePlatform(platform.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>

                {/* Masked Key & Endpoint */}
                <div className="space-y-1.5 text-xs font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800/60 text-slate-300">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Key:</span>
                    <span className="text-slate-400">{platform.apiKeyMasked}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] truncate">
                    <span className="text-slate-500">Endpoint:</span>
                    <span className="text-slate-400 truncate max-w-[170px]" title={platform.endpointUrl}>
                      {platform.endpointUrl}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Processed:</span>
                    <span className="text-cyan-400 tabular-nums">{platform.eventsProcessed} events</span>
                  </div>
                </div>

                {/* Capabilities list */}
                <div className="mt-3">
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                    Agent Capabilities
                  </div>
                  <div className="text-xs text-slate-300 space-y-1">
                    {platform.capabilities.map((cap, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span className="text-cyan-500 font-mono">›</span>
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">
                  Sync: {platform.lastSync}
                </span>

                <button
                  onClick={() => onTestConnection(platform.id)}
                  disabled={isTesting || !platform.enabled}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isTesting
                      ? 'bg-slate-800 text-cyan-400 cursor-wait'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>{isTesting ? 'Testing Ping...' : 'Test Connection'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
