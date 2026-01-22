'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layout,
  FileText,
  Settings,
  Plus,
  Search,
  Bell,
  ChevronRight,
  MoreVertical,
  Wand2,
  BarChart3,
  Clock,
  CheckCircle2,
  GripVertical,
  Bold,
  Italic,
  List,
  AlignLeft,
  Download,
  X,
  ChevronDown,
  Sparkles,
  User,
  LogOut,
  Palette,
  LayoutTemplate
} from 'lucide-react';
import { proposalsAPI, sectionsAPI, aiAPI, templatesAPI, statsAPI } from '@/lib/api-client';
import { useProposalStore } from '@/store/proposal-store';

// Your existing UI components (Button, Badge, Card)
const Button = ({ children, variant = 'primary', className = '', icon: Icon, onClick, ...props }: any) => {
  const baseStyles = "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<string, string> = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm hover:shadow-md",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-slate-200 shadow-sm",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} onClick={onClick} {...props}>
      {Icon && <Icon size={18} className={`${children ? 'mr-2' : ''}`} />}
      {children}
    </button>
  );
};

const Badge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-600",
    REVIEW: "bg-amber-100 text-amber-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    SENT: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.DRAFT}`}>
      {status}
    </span>
  );
};

const Card = ({ children, className = '', ...props }: any) => (
  <div className={`bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`} {...props}>
    {children}
  </div>
);

// AI Generation Modal Component
const AIModal = ({ isOpen, onClose, onGenerate, sectionTitle }: any) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");

  const handleGenerate = async () => {
    setIsGenerating(true);
    setText("");

    try {
      const result = await onGenerate({ context, tone, length });

      // Simulate streaming effect
      const content = result.content;
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < content.length) {
          setText(content.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            onClose();
            setIsGenerating(false);
          }, 800);
        }
      }, 20);
    } catch (error) {
      console.error('Generation failed:', error);
      setIsGenerating(false);
      alert('Failed to generate content. Please try again.');
    }
  };

  useEffect(() => {
    if (isOpen && !isGenerating) {
      setText("");
      setContext("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 transform transition-all scale-100 border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 bg-indigo-100 rounded-lg ${isGenerating ? 'animate-pulse' : ''}`}>
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">AI Assistant</h3>
              <p className="text-sm text-slate-500">
                {isGenerating ? 'Generating content...' : `Generate "${sectionTitle}"`}
              </p>
            </div>
          </div>
          {!isGenerating && <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>}
        </div>

        {!isGenerating ? (
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Context (optional)</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none h-24 resize-none"
                placeholder="Add specific details you want to include..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                  <option value="persuasive">Persuasive</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Length</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl p-6 mb-6 min-h-[120px] border border-slate-100">
            <p className="text-slate-700 leading-relaxed text-sm">
              {text}<span className="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-pulse align-middle"></span>
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          {!isGenerating && <Button variant="secondary" onClick={onClose}>Cancel</Button>}
          {!isGenerating && <Button onClick={handleGenerate}>Generate</Button>}
        </div>
      </div>
    </div>
  );
};

// Views
const Dashboard = ({ onNavigate, proposals, stats }: any) => (
  <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
        <p className="text-slate-500 mt-1">Here's what's happening with your proposals today.</p>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" icon={Sparkles} onClick={() => onNavigate('ai-chat')}>
          Chat with AI
        </Button>
        <Button icon={Plus} onClick={() => onNavigate('templates')}>Create New Proposal</Button>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Proposals</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats?.totalProposals || 0}</h3>
            <p className="text-sm text-emerald-600 font-medium mt-1">
              +{stats?.proposalChange || 0}% <span className="text-slate-400 font-normal">from last month</span>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </Card>
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">AI Tokens Used</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats?.totalTokens?.toFixed(1) || 0}k</h3>
            <p className="text-sm text-emerald-600 font-medium mt-1">
              +{stats?.tokenChange || 0}% <span className="text-slate-400 font-normal">from last month</span>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-purple-50">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </Card>
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Completion Rate</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats?.conversionRate || 0}%</h3>
            <p className="text-sm text-slate-400 font-normal mt-1">proposals completed</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
      </Card>
    </div>

    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Recent Proposals</h2>
      </div>
      {proposals.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No proposals yet</h3>
          <p className="text-slate-500 mb-6">Get started by creating your first proposal</p>
          <Button onClick={() => onNavigate('templates')}>Create Proposal</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {proposals.slice(0, 4).map((prop: any) => (
            <Card key={prop.id} className="group cursor-pointer overflow-hidden flex flex-col h-full" onClick={() => onNavigate('editor', prop)}>
              <div className="h-32 bg-gradient-to-br from-blue-100 to-indigo-100 relative">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-white text-slate-600">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <Badge status={prop.status} />
                    <span className="text-xs text-slate-400">{new Date(prop.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1 truncate">{prop.title}</h3>
                  <p className="text-sm text-slate-500">{prop.type}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  </div>
);

// Continue with remaining components...
// (Due to length, I'll create this in a separate file)

export default function DashboardPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [proposalsData, statsData] = await Promise.all([
        proposalsAPI.list(),
        statsAPI.get(),
      ]);
      setProposals(proposalsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (view: string, data?: any) => {
    if (view === 'templates') {
      router.push('/templates');
    } else if (view === 'ai-chat') {
      router.push('/ai-chat');
    } else if (view === 'editor' && data) {
      router.push(`/editor/${data.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="p-8">
        <Dashboard onNavigate={handleNavigate} proposals={proposals} stats={stats} />
      </div>
    </div>
  );
}
