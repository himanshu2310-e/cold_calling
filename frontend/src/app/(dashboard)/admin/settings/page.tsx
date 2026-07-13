// ============================================
// Workspace Settings Page
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Settings, Building, PhoneCall, GitMerge, Key, Save,
  RotateCcw, ShieldAlert, Sparkles, RefreshCw, Eye, EyeOff,
  BellRing, Info, Clipboard, Check
} from 'lucide-react';
import settingsService from '@/services/settings.service';

interface CRMConfig {
  companyName: string;
  officeHoursStart: string;
  officeHoursEnd: string;
  allowAgentImport: boolean;
  autoRecordCalls: boolean;
  dailyCallTarget: number;
  retentionDays: number;
  distributionRule: 'manual' | 'round_robin' | 'priority_first';
  aiThreshold: number;
  supportEmail: string;
  twilioSid: string;
  twilioAuthToken: string;
  twilioNumber: string;
  apiKey: string;
  webhookUrl: string;
}

const DEFAULT_CONFIG: CRMConfig = {
  companyName: 'ColdConnect CRM',
  officeHoursStart: '09:00',
  officeHoursEnd: '18:00',
  allowAgentImport: false,
  autoRecordCalls: true,
  dailyCallTarget: 30,
  retentionDays: 90,
  distributionRule: 'round_robin',
  aiThreshold: 75,
  supportEmail: 'support@coldconnect.com',
  twilioSid: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  twilioAuthToken: '••••••••••••••••••••••••••••••••',
  twilioNumber: '+15550199',
  apiKey: 'cc_live_9a8b7c6d5e4f3g2h1i0j',
  webhookUrl: 'https://api.yourdomain.com/webhooks/calls',
};

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'general' | 'calling' | 'distribution' | 'api'>('general');
  const [copiedKey, setCopiedKey] = useState(false);
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  
  // Local form state
  const [form, setForm] = useState<CRMConfig>(DEFAULT_CONFIG);

  // Fetch setting key "crm_config"
  const { data, isLoading } = useQuery({
    queryKey: ['settings-crm-config'],
    queryFn: () => settingsService.getSetting('crm_config'),
  });

  // Update local state when remote data loads
  useEffect(() => {
    if (data?.data?.value) {
      setForm((prev) => ({
        ...prev,
        ...data.data.value,
      }));
    }
  }, [data]);

  // Mutation to save settings
  const saveMutation = useMutation({
    mutationFn: (newVal: CRMConfig) => settingsService.updateSetting('crm_config', newVal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-crm-config'] });
      toast.success('Workspace settings saved successfully');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Failed to save settings');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to revert all tabs to system defaults?')) {
      setForm(DEFAULT_CONFIG);
      toast.success('Form reset to default values');
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(form.apiKey);
    setCopiedKey(true);
    toast.success('API Key copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-4">
        <div className="h-10 w-48 rounded-xl bg-zinc-800/30 animate-pulse" />
        <div className="flex gap-4">
          <div className="w-64 h-80 rounded-2xl bg-zinc-800/30 animate-pulse" />
          <div className="flex-1 h-96 rounded-2xl bg-zinc-800/30 animate-pulse" />
        </div>
      </div>
    );
  }

  // ============================================
  // Tabs Navigation
  // ============================================
  const tabs = [
    { id: 'general', name: 'Workspace & Branding', icon: Building, desc: 'Identity, details & business hours' },
    { id: 'calling', name: 'Call Configurations', icon: PhoneCall, desc: 'Rules for dialer, recordings & targets' },
    { id: 'distribution', name: 'Lead Distribution', icon: GitMerge, desc: 'Routing policies & AI scoring' },
    { id: 'api', name: 'Developer & Keys', icon: Key, desc: 'API access, webhooks & Twilio settings' },
  ] as const;

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      
      {/* ============ Header ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}>
              <Settings className="w-4 h-4 text-white" />
            </div>
            Settings
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Configure global workspace preferences, integrations & business rules</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-200 cursor-pointer"
            style={{ borderColor: '#1E1E22' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}
          >
            {saveMutation.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* ============ Content Grid ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 rounded-2xl border p-4 space-y-1" style={{ background: '#141418', borderColor: '#1E1E22' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-200 text-left cursor-pointer hover:bg-zinc-800/30 ${
                  isSelected 
                    ? 'bg-zinc-800 text-white border' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={{ borderColor: isSelected ? '#2E2E33' : 'transparent' }}
              >
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                  isSelected ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-800/50 text-zinc-500'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold leading-tight">{tab.name}</div>
                  <div className="text-[10px] text-zinc-500 font-normal mt-0.5 leading-snug">{tab.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Form Panel */}
        <form onSubmit={handleSave} className="lg:col-span-3 rounded-2xl border p-6 space-y-6" style={{ background: '#141418', borderColor: '#1E1E22' }}>
          
          {/* ============ Tab 1: General ============ */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Workspace Details</h3>
                <p className="text-[10px] text-zinc-500">Define your company branding, office support email, and operational business hours.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Company Name</label>
                  <input
                    type="text"
                    required
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="Enter company name..."
                    className="input-field"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Support Email Address</label>
                  <input
                    type="email"
                    required
                    value={form.supportEmail}
                    onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                    placeholder="e.g. support@company.com"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: '#1E1E22' }}>
                <h4 className="text-xs font-bold text-white mb-1">Operational Hours</h4>
                <p className="text-[10px] text-zinc-500 mb-4">Set business hours during which follow-ups and active callbacks are scheduled.</p>

                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Start Time (UTC)</label>
                    <input
                      type="time"
                      required
                      value={form.officeHoursStart}
                      onChange={(e) => setForm({ ...form, officeHoursStart: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">End Time (UTC)</label>
                    <input
                      type="time"
                      required
                      value={form.officeHoursEnd}
                      onChange={(e) => setForm({ ...form, officeHoursEnd: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: '#1E1E22' }}>
                <div className="max-w-md">
                  <h4 className="text-xs font-bold text-white mb-0.5">Agent Import Permissions</h4>
                  <p className="text-[10px] text-zinc-500">Allow agent role users to import lead lists via CSV files directly.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allowAgentImport}
                    onChange={(e) => setForm({ ...form, allowAgentImport: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                </label>
              </div>
            </div>
          )}

          {/* ============ Tab 2: Calling ============ */}
          {activeTab === 'calling' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Call Configuration Settings</h3>
                <p className="text-[10px] text-zinc-500">Configure global rules, limits, and behavior for call processing, recording uploads, and goals.</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#0D0D11', border: '1px solid #1E1E22' }}>
                <div className="max-w-md">
                  <h4 className="text-xs font-bold text-white mb-0.5">Auto-Record Outbound Calls</h4>
                  <p className="text-[10px] text-zinc-500">Enforce browser mic recording and upload call history audio files to Cloudinary instantly.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.autoRecordCalls}
                    onChange={(e) => setForm({ ...form, autoRecordCalls: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Daily Call Target (Per Agent)</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={500}
                      value={form.dailyCallTarget}
                      onChange={(e) => setForm({ ...form, dailyCallTarget: parseInt(e.target.value) || 30 })}
                      className="input-field pr-12"
                    />
                    <span className="absolute right-3 top-2.5 text-[9px] font-bold text-zinc-500">calls/day</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Recording Retention Period</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={7}
                      max={365}
                      value={form.retentionDays}
                      onChange={(e) => setForm({ ...form, retentionDays: parseInt(e.target.value) || 90 })}
                      className="input-field pr-12"
                    />
                    <span className="absolute right-3 top-2.5 text-[9px] font-bold text-zinc-500">days</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl flex items-start gap-3 mt-4" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h4 className="text-[11px] font-bold text-purple-200">Recording Tip</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">
                    Recording storage relies on Cloudinary. Stored audio files are automatically purged from database indices after the retention threshold has elapsed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============ Tab 3: Distribution ============ */}
          {activeTab === 'distribution' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Lead Distribution & AI Policies</h3>
                <p className="text-[10px] text-zinc-500">Establish auto-routing lead rules and set confidence metrics limits for AI lead scoring.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Lead Routing Rule</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { id: 'manual', title: 'Manual Assignment', desc: 'Leads are assigned to users by managers manually.' },
                    { id: 'round_robin', title: 'Round Robin', desc: 'Incoming leads are distributed equally among active agents.' },
                    { id: 'priority_first', title: 'High-Priority First', desc: 'Routes warm/hot leads to top performers automatically.' }
                  ].map((rule) => {
                    const isSelected = form.distributionRule === rule.id;
                    return (
                      <button
                        key={rule.id}
                        type="button"
                        onClick={() => setForm({ ...form, distributionRule: rule.id as any })}
                        className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-800/50 text-white border-blue-500 shadow-lg'
                            : 'bg-zinc-900/40 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                        }`}
                        style={{ borderColor: isSelected ? '#3B82F6' : '#1E1E22' }}
                      >
                        <div className="text-[11px] font-bold text-white flex items-center justify-between">
                          {rule.title}
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                        </div>
                        <p className="text-[9px] text-zinc-500 mt-1 leading-snug">{rule.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t space-y-4" style={{ borderColor: '#1E1E22' }}>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">AI Lead Score threshold</h4>
                  <p className="text-[10px] text-zinc-500">Filter hot vs cold leads based on predictive conversational performance modeling.</p>
                </div>
                <div className="flex items-center gap-4 max-w-md">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={form.aiThreshold}
                    onChange={(e) => setForm({ ...form, aiThreshold: parseInt(e.target.value) || 75 })}
                    className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="w-12 text-center text-xs font-bold text-white py-1 px-2 rounded-md bg-zinc-800 border" style={{ borderColor: '#1E1E22' }}>
                    {form.aiThreshold}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ============ Tab 4: API & Twilio ============ */}
          {activeTab === 'api' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Developer Keys & API Configuration</h3>
                <p className="text-[10px] text-zinc-500">Manage API access tokens, callback webhooks, and third-party VoIP configurations.</p>
              </div>

              {/* Twilio Binding */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                  Twilio VoIP Gateway
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Twilio Account SID</label>
                    <input
                      type="text"
                      required
                      value={form.twilioSid}
                      onChange={(e) => setForm({ ...form, twilioSid: e.target.value })}
                      className="input-field font-mono text-[11px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Twilio Auth Token</label>
                    <div className="relative">
                      <input
                        type={showTwilioToken ? 'text' : 'password'}
                        required
                        value={form.twilioAuthToken}
                        onChange={(e) => setForm({ ...form, twilioAuthToken: e.target.value })}
                        className="input-field font-mono text-[11px] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTwilioToken(!showTwilioToken)}
                        className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      >
                        {showTwilioToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Twilio Verified Outbound Number</label>
                  <input
                    type="text"
                    required
                    value={form.twilioNumber}
                    onChange={(e) => setForm({ ...form, twilioNumber: e.target.value })}
                    className="input-field font-mono"
                  />
                </div>
              </div>

              {/* Developer Keys */}
              <div className="pt-4 border-t space-y-4" style={{ borderColor: '#1E1E22' }}>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-400" />
                  API Keys & Integrations
                </h4>
                <div className="space-y-1.5 max-w-xl">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Live Workspace Secret API Key</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={form.apiKey}
                      className="input-field font-mono text-[11px] select-all bg-zinc-900/60 text-zinc-400 cursor-not-allowed flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="px-4 border rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all duration-200 cursor-pointer"
                      style={{ borderColor: '#1E1E22' }}
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 max-w-xl">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Webhook Callbacks Endpoint URL</label>
                  <input
                    type="url"
                    required
                    value={form.webhookUrl}
                    onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
                    placeholder="https://"
                    className="input-field font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          )}

        </form>

      </div>

    </div>
  );
}
