'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Sparkles, FileText, Loader2, CheckCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CONVERSATION_FLOW = [
  "Hi! I'm your AI proposal assistant. I'll help you create a professional proposal by asking you a few questions. What type of proposal are you creating? (e.g., Business, Project, Grant, Consulting)",
  "Great! What's the title or main objective of your proposal?",
  "Who is your target client or audience for this proposal?",
  "What's the main problem or challenge that this proposal addresses?",
  "What solution are you proposing to solve this problem?",
  "What are the key deliverables or outcomes they can expect?",
  "What's your proposed timeline for this project?",
  "What's the estimated budget or investment required?",
  "Perfect! I have all the information I need. I'll now generate a complete, professional proposal for you. This will take a moment..."
];

export default function AIChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: CONVERSATION_FLOW[0],
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [conversationData, setConversationData] = useState<any>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Store user's answer
    const dataKeys = ['proposalType', 'title', 'client', 'problem', 'solution', 'deliverables', 'timeline', 'budget'];
    setConversationData((prev: any) => ({
      ...prev,
      [dataKeys[currentStep]]: input,
    }));

    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 1000));

    const nextStep = currentStep + 1;

    if (nextStep < CONVERSATION_FLOW.length - 1) {
      // Continue conversation
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: CONVERSATION_FLOW[nextStep],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentStep(nextStep);
      setIsLoading(false);
    } else {
      // Final step - generate proposal
      const finalMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: CONVERSATION_FLOW[nextStep],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, finalMessage]);
      setIsLoading(false);
      setIsGenerating(true);

      // Generate the proposal
      setTimeout(() => {
        generateProposal();
      }, 2000);
    }
  };

  const generateProposal = async () => {
    try {
      // Call API to generate proposal with all collected data
      const response = await fetch('/api/ai/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversationData),
      });

      const data = await response.json();

      if (response.ok) {
        const successMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: `✅ Your proposal "${data.proposal.title}" has been created successfully! It includes all the sections based on our conversation. Would you like to view and edit it now?`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, successMessage]);
        setIsGenerating(false);

        // Redirect to editor after a moment
        setTimeout(() => {
          router.push(`/editor/${data.proposal.id}`);
        }, 3000);
      } else {
        throw new Error(data.error || 'Failed to generate proposal');
      }
    } catch (error) {
      console.error('Error generating proposal:', error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: '❌ Sorry, I encountered an error generating your proposal. Please try again or create one manually from the dashboard.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">AI Proposal Generator</h1>
              <p className="text-sm text-slate-500">Let's create your proposal together</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600">
              Step {Math.min(currentStep + 1, 9)} of 9
            </span>
            <span className="text-xs font-medium text-indigo-600">
              {Math.round(((currentStep + 1) / 9) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / 9) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-900 shadow-sm border border-slate-200'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-semibold text-indigo-600">AI Assistant</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <span className={`text-xs mt-2 block ${message.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-slate-500">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl px-6 py-4 border-2 border-indigo-200">
                <div className="flex items-center space-x-3 mb-3">
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  <span className="font-semibold text-indigo-900">Generating your proposal...</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-indigo-700">
                    <CheckCircle className="w-4 h-4" />
                    <span>Analyzing your requirements</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-indigo-700">
                    <CheckCircle className="w-4 h-4" />
                    <span>Structuring proposal sections</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-indigo-700">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Writing professional content...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      {!isGenerating && (
        <div className="bg-white border-t border-slate-200 p-4 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your answer here..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                  rows={2}
                  disabled={isLoading || isGenerating}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading || isGenerating}
                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
