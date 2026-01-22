'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FileText, Download, Palette, ChevronDown } from 'lucide-react';
import { proposalsAPI } from '@/lib/api-client';

const Card = ({ children, className = '', ...props }: any) => (
  <div className={`bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`} {...props}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', className = '', icon: Icon, onClick, disabled, ...props }: any) => {
  const baseStyles = "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<string, string> = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm hover:shadow-md",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-slate-200 shadow-sm",
  };

  return (
    <button disabled={disabled} className={`${baseStyles} ${variants[variant]} ${className}`} onClick={onClick} {...props}>
      {Icon && <Icon size={18} className={`${children ? 'mr-2' : ''}`} />}
      {children}
    </button>
  );
};

export default function ExportPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<any>(null);
  const [format, setFormat] = useState<'PDF' | 'DOCX'>('PDF');
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProposal();
  }, [proposalId]);

  const loadProposal = async () => {
    try {
      const data = await proposalsAPI.get(proposalId);
      setProposal(data);
    } catch (error) {
      console.error('Failed to load proposal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await proposalsAPI.export(proposalId, format);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${proposal.title}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('Export successful!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Please try again.');
    } finally {
      setIsExporting(false);
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
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-300">
      <div className="flex items-center mb-8">
        <button onClick={() => router.push(`/editor/${proposalId}`)} className="mr-4 p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
          <ChevronDown size={24} className="rotate-90" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Export Proposal</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Preview */}
        <div className="bg-slate-200 rounded-xl p-8 flex items-center justify-center min-h-[400px]">
          <div className="bg-white w-full max-w-sm h-[450px] shadow-xl rounded-sm flex flex-col p-8 transform hover:scale-105 transition-transform duration-500">
            <div className="w-16 h-16 bg-slate-100 rounded mb-6"></div>
            <div className="h-4 bg-slate-100 w-3/4 mb-4"></div>
            <div className="h-2 bg-slate-50 w-full mb-2"></div>
            <div className="h-2 bg-slate-50 w-full mb-2"></div>
            <div className="h-2 bg-slate-50 w-2/3 mb-8"></div>
            <div className="mt-auto flex justify-between">
              <div className="h-2 bg-slate-100 w-12"></div>
              <div className="h-2 bg-slate-100 w-4"></div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
              <FileText size={18} className="mr-2 text-indigo-600" /> Format
            </h3>
            <div className="space-y-3">
              <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                format === 'PDF' ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="format"
                  checked={format === 'PDF'}
                  onChange={() => setFormat('PDF')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className={`ml-3 font-medium ${format === 'PDF' ? 'text-indigo-900' : 'text-slate-700'}`}>
                  PDF Document
                </span>
                {format === 'PDF' && (
                  <span className="ml-auto text-xs text-indigo-600 font-medium">Recommended</span>
                )}
              </label>
              <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                format === 'DOCX' ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="format"
                  checked={format === 'DOCX'}
                  onChange={() => setFormat('DOCX')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className={`ml-3 font-medium ${format === 'DOCX' ? 'text-indigo-900' : 'text-slate-700'}`}>
                  Word Document (.docx)
                </span>
              </label>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
              <Palette size={18} className="mr-2 text-purple-600" /> Branding
            </h3>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                Logo
              </div>
              <Button variant="secondary" className="text-sm">Upload New</Button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-500">Accent Color:</span>
              <div className="w-6 h-6 rounded-full bg-indigo-600 ring-2 ring-offset-2 ring-indigo-600 cursor-pointer"></div>
              <div className="w-6 h-6 rounded-full bg-emerald-600 cursor-pointer hover:ring-2 ring-emerald-600 ring-offset-1"></div>
              <div className="w-6 h-6 rounded-full bg-slate-900 cursor-pointer hover:ring-2 ring-slate-900 ring-offset-1"></div>
            </div>
          </Card>

          <div className="flex space-x-4 pt-4">
            <Button className="flex-1" icon={Download} onClick={handleExport} disabled={isExporting}>
              {isExporting ? 'Exporting...' : 'Export Now'}
            </Button>
            <Button variant="secondary" onClick={() => router.push(`/editor/${proposalId}`)}>
              Back to Editor
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
