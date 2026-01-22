import { create } from 'zustand';

interface Section {
  id: string;
  title: string;
  content: string;
  order: number;
  aiGenerated?: boolean;
}

interface Proposal {
  id: string;
  title: string;
  type: string;
  status: string;
  sections: Section[];
}

interface ProposalStore {
  currentProposal: Proposal | null;
  proposals: Proposal[];
  activeSection: string | null;
  isLoading: boolean;
  error: string | null;

  setCurrentProposal: (proposal: Proposal | null) => void;
  setProposals: (proposals: Proposal[]) => void;
  setActiveSection: (sectionId: string | null) => void;
  updateSection: (sectionId: string, content: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProposalStore = create<ProposalStore>((set) => ({
  currentProposal: null,
  proposals: [],
  activeSection: null,
  isLoading: false,
  error: null,

  setCurrentProposal: (proposal) => set({ currentProposal: proposal }),
  setProposals: (proposals) => set({ proposals }),
  setActiveSection: (sectionId) => set({ activeSection: sectionId }),

  updateSection: (sectionId, content) =>
    set((state) => {
      if (!state.currentProposal) return state;

      return {
        currentProposal: {
          ...state.currentProposal,
          sections: state.currentProposal.sections.map((section) =>
            section.id === sectionId ? { ...section, content } : section
          ),
        },
      };
    }),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
