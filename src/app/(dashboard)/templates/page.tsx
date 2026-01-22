'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout, FileText, BarChart3, User, Plus } from 'lucide-react';
import { templatesAPI, proposalsAPI } from '@/lib/api-client';

const Card = ({ children, className = '', ...props }: any) => (
  <div className={`bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`} {...props}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', className = '', icon: Icon, onClick, ...props }: any) => {
  const baseStyles = "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<string, string> = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm hover:shadow-md",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-slate-200 shadow-sm",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} onClick={onClick} {...props}>
      {Icon && <Icon size={18} className={`${children ? 'mr-2' : ''}`} />}
      {children}
    </button>
  );
};

const iconMap: Record<string, any> = {
  Layout,
  FileText,
  BarChart3,
  User,
  Plus,
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await templatesAPI.list();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = async (template: any) => {
    try {
      // Create a new proposal from this template
      const proposal = await proposalsAPI.create({
        title: `New ${template.name}`,
        type: template.type,
        templateId: template.id,
      });

      // Navigate to the editor
      router.push(`/editor/${proposal.id}`);
    } catch (error) {
      console.error('Failed to create proposal:', error);
      alert('Failed to create proposal. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 animate-in zoom-in-95 duration-300">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Choose a Template</h1>
        <p className="text-slate-500 mt-2">Start with a professional framework or build from scratch.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => {
          const Icon = iconMap[template.icon || 'FileText'] || FileText;
          return (
            <Card
              key={template.id}
              className="p-6 hover:border-indigo-200 hover:ring-2 hover:ring-indigo-50 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-slate-50 group-hover:bg-white border border-slate-100 ${template.color || 'text-blue-600'}`}>
                  <Icon size={24} />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{template.name}</h3>
              <p className="text-slate-500 text-sm mb-6">{template.description}</p>
              <Button
                variant="secondary"
                className="w-full group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600"
                onClick={() => handleSelectTemplate(template)}
              >
                Use Template
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <Button variant="secondary" onClick={() => router.push('/')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
