import React from 'react';
import { 
  KeyRound, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Cpu, 
  ExternalLink,
  Sliders,
  Sparkles
} from 'lucide-react';
import { OpenAIConfig } from '../types';
import { testOpenAIConnection, saveOpenAIConfig } from '../services/openaiService';

interface OpenAISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: OpenAIConfig;
  onSaveConfig: (updated: OpenAIConfig) => void;
}

export const OpenAISettingsModal: React.FC<OpenAISettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = React.useState<OpenAIConfig>(config);
  const [showKey, setShowKey] = React.useState(false);
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    modelsFound?: string[];
  } | null>(null);

  React.useEffect(() => {
    setFormData(config);
    setTestResult(null);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testOpenAIConnection(formData);
      setTestResult(res);
      if (res.success) {
        setFormData(prev => ({
          ...prev,
          isConnected: true,
          latencyMs: res.latencyMs,
          lastTested: new Date().toLocaleTimeString(),
        }));
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    saveOpenAIConfig(formData);
    onSaveConfig(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">OpenAI API Connection & Engine</h3>
              <p className="text-xs text-slate-400">
                Configure your OpenAI model parameters, custom relays, and autonomous prompt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Connection Mode Selection */}
          <div>
            <label className="text-slate-300 font-medium block mb-2">Orchestration Engine Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, mode: 'openai_direct' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.mode === 'openai_direct'
                    ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-sm shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-xs mb-1">
                  <span>Direct OpenAI API</span>
                  {formData.mode === 'openai_direct' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[11px] text-slate-400">
                  Connect live to OpenAI or any OpenAI-compatible relay (GPT-4o, o3-mini, o1).
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, mode: 'autonomous_sim' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.mode === 'autonomous_sim'
                    ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-sm shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-xs mb-1">
                  <span>Built-in Engine Mode</span>
                  {formData.mode === 'autonomous_sim' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[11px] text-slate-400">
                  High-speed autonomous deliberation without requiring an OpenAI key upfront.
                </div>
              </button>
            </div>
          </div>

          {/* OpenAI API Key */}
          {formData.mode === 'openai_direct' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-300 font-medium">OpenAI API Key</label>
                <span className="text-[11px] text-slate-500">Stored locally in your browser</span>
              </div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="sk-proj-..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500 pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-2 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          )}

          {/* Base URL & Model */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-medium block mb-1.5">API Base URL</label>
              <input
                type="text"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Compatible with Azure OpenAI, OpenRouter, LocalAI, vLLM
              </span>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1.5">Model Target</label>
              <select
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="gpt-4o">gpt-4o (Omni Principal Model - Recommended)</option>
                <option value="gpt-4o-mini">gpt-4o-mini (Ultra Fast Triage)</option>
                <option value="o3-mini">o3-mini (High-Reasoning Math & Logic)</option>
                <option value="o1">o1 (Deep Complex Multi-Step Reasoning)</option>
                <option value="gpt-4-turbo">gpt-4-turbo</option>
              </select>
            </div>
          </div>

          {/* Temperature */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-medium">Temperature: {formData.temperature}</label>
              <span className="text-[11px] text-slate-500">Lower for deterministic SLA & tool precision</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* System Prompt Customization */}
          <div>
            <label className="text-slate-300 font-medium block mb-1.5">
              Autonomous Orchestrator System Directives
            </label>
            <textarea
              rows={4}
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white font-mono text-[11px] focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          {/* Connection Test Status feedback */}
          {testResult && (
            <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-semibold text-xs">{testResult.message}</div>
                {testResult.modelsFound && (
                  <div className="mt-1 text-[11px] text-slate-400 font-mono">
                    Models verified: {testResult.modelsFound.slice(0, 4).join(', ')}...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isTesting ? 'Pinging Endpoint...' : 'Test Connection & Ping'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm shadow-cyan-500/20"
            >
              Apply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
