'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  GripVertical,
  Bold,
  Italic,
  List,
  X,
  Sparkles,
  AlignLeft,
  CheckCircle2,
  Wand2,
  Download,
  Plus,
  Home,
  ArrowLeft,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  ListOrdered,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Type,
  Undo2,
  Redo2,
  Palette,
  Eraser,
  Pencil,
  Check,
  Trash2,
} from 'lucide-react';
import { proposalsAPI, sectionsAPI, aiAPI } from '@/lib/api-client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { Extension } from '@tiptap/core';

// Custom Font Size Extension
const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: any) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }: any) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});

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

// Toolbar Button Component
const ToolbarButton = ({ onClick, active, icon: Icon, title, disabled }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded-md transition-colors ${active
      ? 'bg-indigo-100 text-indigo-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    title={title}
  >
    <Icon size={18} />
  </button>
);

// Toolbar Divider
const ToolbarDivider = () => (
  <div className="w-px h-6 bg-slate-200 mx-1" />
);

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiContext, setAiContext] = useState('');
  const [aiTone, setAiTone] = useState('professional');
  const [aiLength, setAiLength] = useState('medium');
  const [generatedText, setGeneratedText] = useState('');

  // Color picker states
  const [showTextColor, setShowTextColor] = useState(false);
  const [showHighlightColor, setShowHighlightColor] = useState(false);

  // Editing states for titles
  const [isEditingProposalTitle, setIsEditingProposalTitle] = useState(false);
  const [editedProposalTitle, setEditedProposalTitle] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editedSectionTitle, setEditedSectionTitle] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start typing or use AI to generate content...',
      }),
      TextStyle,
      FontSize,
      Underline,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[600px] text-slate-700 leading-relaxed text-lg',
      },
    },
    onUpdate: ({ editor }) => {
      // Auto-save on content change
      if (activeSection) {
        const html = editor.getHTML();
        debouncedSave(activeSection, html);
      }
    },
  });

  // Debounced save function
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedSave = (sectionId: string, content: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveSection(sectionId, content);
    }, 1000);
  };

  useEffect(() => {
    loadProposal();
  }, [proposalId]);

  const loadProposal = async () => {
    try {
      const data = await proposalsAPI.get(proposalId);
      setProposal(data);
      setSections(data.sections || []);
      if (data.sections && data.sections.length > 0) {
        setActiveSection(data.sections[0].id);
        editor?.commands.setContent(data.sections[0].content || '');
      }
    } catch (error) {
      console.error('Failed to load proposal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectionClick = (section: any) => {
    // Save current section before switching
    if (activeSection && editor) {
      saveSection(activeSection, editor.getHTML());
    }
    setActiveSection(section.id);
    editor?.commands.setContent(section.content || '');
  };

  const saveSection = async (sectionId: string, newContent: string) => {
    try {
      setIsSaving(true);
      await sectionsAPI.update(proposalId, sectionId, { content: newContent });
      // Update local state
      setSections(sections.map(s => s.id === sectionId ? { ...s, content: newContent } : s));
    } catch (error) {
      console.error('Failed to save section:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Save proposal title
  const handleSaveProposalTitle = async () => {
    if (!editedProposalTitle.trim() || editedProposalTitle === proposal?.title) {
      setIsEditingProposalTitle(false);
      return;
    }
    try {
      setIsSaving(true);
      await proposalsAPI.update(proposalId, { title: editedProposalTitle.trim() });
      setProposal({ ...proposal, title: editedProposalTitle.trim() });
      setIsEditingProposalTitle(false);
    } catch (error) {
      console.error('Failed to update proposal title:', error);
      alert('Failed to save title. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save section title
  const handleSaveSectionTitle = async (sectionId: string) => {
    if (!editedSectionTitle.trim()) {
      setEditingSectionId(null);
      return;
    }
    const section = sections.find(s => s.id === sectionId);
    if (editedSectionTitle === section?.title) {
      setEditingSectionId(null);
      return;
    }
    try {
      setIsSaving(true);
      await sectionsAPI.update(proposalId, sectionId, { title: editedSectionTitle.trim() });
      setSections(sections.map(s => s.id === sectionId ? { ...s, title: editedSectionTitle.trim() } : s));
      setEditingSectionId(null);
    } catch (error) {
      console.error('Failed to update section title:', error);
      alert('Failed to save section title. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete section
  const handleDeleteSection = async (sectionId: string) => {
    if (sections.length <= 1) {
      alert('Cannot delete the last section. You must have at least one section.');
      return;
    }
    const section = sections.find(s => s.id === sectionId);
    if (!confirm(`Are you sure you want to delete "${section?.title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setIsSaving(true);
      await sectionsAPI.delete(proposalId, sectionId);
      const newSections = sections.filter(s => s.id !== sectionId);
      setSections(newSections);
      // If deleted section was active, switch to the first available section
      if (activeSection === sectionId && newSections.length > 0) {
        setActiveSection(newSections[0].id);
        editor?.commands.setContent(newSections[0].content || '');
      }
    } catch (error) {
      console.error('Failed to delete section:', error);
      alert('Failed to delete section. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Formatting handlers
  const handleBold = () => editor?.chain().focus().toggleBold().run();
  const handleItalic = () => editor?.chain().focus().toggleItalic().run();
  const handleUnderline = () => editor?.chain().focus().toggleUnderline().run();
  const handleStrike = () => editor?.chain().focus().toggleStrike().run();
  const handleCode = () => editor?.chain().focus().toggleCode().run();
  const handleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const handleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
  const handleAlignLeft = () => editor?.chain().focus().setTextAlign('left').run();
  const handleAlignCenter = () => editor?.chain().focus().setTextAlign('center').run();
  const handleAlignRight = () => editor?.chain().focus().setTextAlign('right').run();
  const handleAlignJustify = () => editor?.chain().focus().setTextAlign('justify').run();
  const handleUndo = () => editor?.chain().focus().undo().run();
  const handleRedo = () => editor?.chain().focus().redo().run();
  const handleClearFormat = () => editor?.chain().focus().clearNodes().unsetAllMarks().run();

  const handleFontSize = (size: string) => {
    if (size === 'normal') {
      editor?.chain().focus().unsetFontSize().run();
    } else {
      editor?.chain().focus().setFontSize(size).run();
    }
  };

  const handleTextColor = (color: string) => {
    editor?.chain().focus().setColor(color).run();
    setShowTextColor(false);
  };

  const handleHighlightColor = (color: string) => {
    editor?.chain().focus().setHighlight({ color }).run();
    setShowHighlightColor(false);
  };

  const handleAddSection = async () => {
    const newSectionTitle = prompt('Enter section title:');
    if (!newSectionTitle || !newSectionTitle.trim()) return;

    try {
      const newSection = await sectionsAPI.create(proposalId, {
        title: newSectionTitle.trim(),
        content: '',
        order: sections.length,
      });

      setSections([...sections, newSection]);
      setActiveSection(newSection.id);
      editor?.commands.setContent('');
    } catch (error) {
      console.error('Failed to create section:', error);
      alert('Failed to create section. Please try again.');
    }
  };

  const handleGenerateAI = async () => {
    if (!activeSection || !editor) return;

    const section = sections.find(s => s.id === activeSection);
    if (!section) return;

    setIsGenerating(true);
    setGeneratedText('');

    try {
      const result = await aiAPI.generate({
        proposalId,
        sectionId: activeSection,
        title: section.title,
        context: aiContext,
        tone: aiTone,
        length: aiLength,
        includePreviousSections: true,
      });

      const fullText = result.content;
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < fullText.length) {
          setGeneratedText(fullText.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            const currentContent = editor.getHTML();
            const newContent = currentContent === '<p></p>' ? fullText : currentContent + '<p></p>' + fullText;
            editor.commands.setContent(newContent);
            setShowAIModal(false);
            setIsGenerating(false);
            setGeneratedText('');
            setAiContext('');
            saveSection(activeSection, newContent);
          }, 500);
        }
      }, 20);
    } catch (error) {
      console.error('AI generation failed:', error);
      alert('Failed to generate content. Please try again.');
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/proposals/${proposalId}/export-pdf`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${proposal?.title || 'proposal'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading editor...</p>
        </div>
      </div>
    );
  }

  const currentSection = sections.find(s => s.id === activeSection);

  // Color presets
  const textColors = ['#000000', '#DC2626', '#EA580C', '#D97706', '#65A30D', '#059669', '#0891B2', '#2563EB', '#7C3AED', '#C026D3'];
  const highlightColors = ['#FEF3C7', '#FED7AA', '#FECACA', '#DDD6FE', '#DBEAFE', '#D1FAE5', '#E0E7FF'];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Outline</h3>
          <button onClick={handleAddSection} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Add new section">
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`group flex items-center p-2.5 rounded-lg cursor-pointer text-sm transition-colors ${activeSection === section.id
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <GripVertical size={14} className="mr-2 text-slate-300 flex-shrink-0 opacity-0 group-hover:opacity-100 cursor-move" />
              {editingSectionId === section.id ? (
                <input
                  type="text"
                  value={editedSectionTitle}
                  onChange={(e) => setEditedSectionTitle(e.target.value)}
                  onBlur={() => handleSaveSectionTitle(section.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveSectionTitle(section.id);
                    if (e.key === 'Escape') setEditingSectionId(null);
                  }}
                  className="flex-1 text-sm bg-white border border-indigo-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <span onClick={() => handleSectionClick(section)} className="truncate flex-1">{section.title}</span>
                  <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSectionId(section.id);
                        setEditedSectionTitle(section.title);
                      }}
                      className="p-1 hover:bg-indigo-100 rounded text-slate-500 hover:text-indigo-600"
                      title="Edit section name"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSection(section.id);
                      }}
                      className="p-1 hover:bg-red-100 rounded text-slate-500 hover:text-red-600"
                      title="Delete section"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-200">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Progress</span>
              <span className="text-xs font-bold text-indigo-600">
                {Math.round((sections.filter(s => s.content && s.content.trim()).length / sections.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div
                className="bg-indigo-600 h-1.5 rounded-full"
                style={{
                  width: `${(sections.filter(s => s.content && s.content.trim()).length / sections.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-slate-200 flex items-center px-4 justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              {isEditingProposalTitle ? (
                <input
                  type="text"
                  value={editedProposalTitle}
                  onChange={(e) => setEditedProposalTitle(e.target.value)}
                  onBlur={handleSaveProposalTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveProposalTitle();
                    if (e.key === 'Escape') setIsEditingProposalTitle(false);
                  }}
                  className="text-sm font-semibold text-slate-900 bg-white border border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full max-w-xs"
                  autoFocus
                />
              ) : (
                <div className="flex items-center group">
                  <h2
                    onClick={() => {
                      setIsEditingProposalTitle(true);
                      setEditedProposalTitle(proposal?.title || '');
                    }}
                    className="text-sm font-semibold text-slate-900 cursor-pointer hover:text-indigo-600"
                    title="Click to edit title"
                  >
                    {proposal?.title || 'Untitled Proposal'}
                  </h2>
                  <button
                    onClick={() => {
                      setIsEditingProposalTitle(true);
                      setEditedProposalTitle(proposal?.title || '');
                    }}
                    className="ml-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-100 rounded transition-opacity"
                    title="Edit proposal title"
                  >
                    <Pencil size={12} />
                  </button>
                </div>
              )}
              <p className="text-xs text-slate-500">{isSaving ? 'Saving...' : 'All changes saved'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleExport} variant="secondary" icon={Download}>Export PDF</Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 p-2 flex items-center gap-1 flex-wrap">
          {/* History */}
          <ToolbarButton onClick={handleUndo} icon={Undo2} title="Undo (⌘Z)" disabled={!editor?.can().undo()} />
          <ToolbarButton onClick={handleRedo} icon={Redo2} title="Redo (⌘⇧Z)" disabled={!editor?.can().redo()} />

          <ToolbarDivider />

          {/* Font Size */}
          <select
            onChange={(e) => handleFontSize(e.target.value)}
            className="px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            title="Font Size"
          >
            <option value="normal">Normal</option>
            <option value="14px">Small</option>
            <option value="18px">Medium</option>
            <option value="24px">Large</option>
            <option value="32px">XL</option>
            <option value="48px">2XL</option>
          </select>

          <ToolbarDivider />

          {/* Text Formatting */}
          <ToolbarButton onClick={handleBold} active={editor?.isActive('bold')} icon={Bold} title="Bold (⌘B)" />
          <ToolbarButton onClick={handleItalic} active={editor?.isActive('italic')} icon={Italic} title="Italic (⌘I)" />
          <ToolbarButton onClick={handleUnderline} active={editor?.isActive('underline')} icon={UnderlineIcon} title="Underline (⌘U)" />
          <ToolbarButton onClick={handleStrike} active={editor?.isActive('strike')} icon={Strikethrough} title="Strikethrough" />
          <ToolbarButton onClick={handleCode} active={editor?.isActive('code')} icon={Code} title="Code" />

          <ToolbarDivider />

          {/* Colors */}
          <div className="relative">
            <ToolbarButton
              onClick={() => setShowTextColor(!showTextColor)}
              icon={Palette}
              title="Text Color"
              active={showTextColor}
            />
            {showTextColor && (
              <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-lg shadow-lg border border-slate-200 z-10 w-60">
                <p className="text-xs font-semibold text-slate-600 mb-2">Text Color</p>
                <div className="grid grid-cols-5 gap-2">
                  {textColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleTextColor(color)}
                      className="w-8 h-8 rounded border-2 border-slate-200 hover:border-indigo-500 transition-colors"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <button
                  onClick={() => { editor?.chain().focus().unsetColor().run(); setShowTextColor(false); }}
                  className="mt-2 w-full text-xs text-slate-600 hover:text-slate-900 py-1"
                >
                  Reset Color
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <ToolbarButton
              onClick={() => setShowHighlightColor(!showHighlightColor)}
              icon={Highlighter}
              title="Highlight Color"
              active={showHighlightColor}
            />
            {showHighlightColor && (
              <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-lg shadow-lg border border-slate-200 z-10 w-60">
                <p className="text-xs font-semibold text-slate-600 mb-2">Highlight Color</p>
                <div className="grid grid-cols-4 gap-2">
                  {highlightColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleHighlightColor(color)}
                      className="w-10 h-8 rounded border-2 border-slate-200 hover:border-indigo-500 transition-colors"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <button
                  onClick={() => { editor?.chain().focus().unsetHighlight().run(); setShowHighlightColor(false); }}
                  className="mt-2 w-full text-xs text-slate-600 hover:text-slate-900 py-1"
                >
                  Remove Highlight
                </button>
              </div>
            )}
          </div>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton onClick={handleBulletList} active={editor?.isActive('bulletList')} icon={List} title="Bullet List" />
          <ToolbarButton onClick={handleOrderedList} active={editor?.isActive('orderedList')} icon={ListOrdered} title="Numbered List" />

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarButton onClick={handleAlignLeft} active={editor?.isActive({ textAlign: 'left' })} icon={AlignLeft} title="Align Left" />
          <ToolbarButton onClick={handleAlignCenter} active={editor?.isActive({ textAlign: 'center' })} icon={AlignCenter} title="Align Center" />
          <ToolbarButton onClick={handleAlignRight} active={editor?.isActive({ textAlign: 'right' })} icon={AlignRight} title="Align Right" />
          <ToolbarButton onClick={handleAlignJustify} active={editor?.isActive({ textAlign: 'justify' })} icon={AlignJustify} title="Justify" />

          <ToolbarDivider />

          {/* Clear Formatting */}
          <ToolbarButton onClick={handleClearFormat} icon={Eraser} title="Clear Formatting" />
        </div>

        {/* Document Area */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12">
          <div className="max-w-3xl mx-auto bg-white min-h-[800px] shadow-sm border border-slate-200 rounded-sm p-12 md:p-16 relative">
            {editingSectionId === currentSection?.id ? (
              <input
                type="text"
                value={editedSectionTitle}
                onChange={(e) => setEditedSectionTitle(e.target.value)}
                onBlur={() => currentSection && handleSaveSectionTitle(currentSection.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && currentSection) handleSaveSectionTitle(currentSection.id);
                  if (e.key === 'Escape') setEditingSectionId(null);
                }}
                className="text-3xl font-bold text-slate-900 mb-6 pb-2 bg-transparent border-b-2 border-indigo-300 focus:outline-none focus:border-indigo-500 w-full"
                autoFocus
              />
            ) : (
              <div className="flex items-center group mb-6 pb-2">
                <h1
                  onClick={() => {
                    if (currentSection) {
                      setEditingSectionId(currentSection.id);
                      setEditedSectionTitle(currentSection.title);
                    }
                  }}
                  className="text-3xl font-bold text-slate-900 cursor-pointer hover:text-indigo-700"
                  title="Click to edit section title"
                >
                  {currentSection?.title || 'Section'}
                </h1>
                <button
                  onClick={() => {
                    if (currentSection) {
                      setEditingSectionId(currentSection.id);
                      setEditedSectionTitle(currentSection.title);
                    }
                  }}
                  className="ml-3 p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-100 rounded transition-opacity"
                  title="Edit section title"
                >
                  <Pencil size={18} />
                </button>
              </div>
            )}
            <EditorContent editor={editor} />

            {/* Floating AI Button */}
            <div className="absolute bottom-8 right-8">
              <Button icon={Sparkles} onClick={() => setShowAIModal(true)} className="shadow-lg rounded-full px-6">
                Generate with AI
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={`p-2 bg-indigo-100 rounded-lg ${isGenerating ? 'animate-pulse' : ''}`}>
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">AI Assistant</h3>
                  <p className="text-sm text-slate-500">
                    {isGenerating ? 'Generating content...' : `Generate "${currentSection?.title}"`}
                  </p>
                </div>
              </div>
              {!isGenerating && (
                <button onClick={() => setShowAIModal(false)}>
                  <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>

            {!isGenerating ? (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Context (optional)</label>
                  <textarea
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                    placeholder="Add specific details..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">Tone</label>
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
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
                      value={aiLength}
                      onChange={(e) => setAiLength(e.target.value)}
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
                  {generatedText}
                  <span className="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-pulse align-middle"></span>
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              {!isGenerating && <Button variant="secondary" onClick={() => setShowAIModal(false)}>Cancel</Button>}
              {!isGenerating && <Button onClick={handleGenerateAI}>Generate</Button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
