// API Client utilities for frontend

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new APIError(response.status, error.error || 'Request failed');
  }

  return response.json();
}

// Proposals API
export const proposalsAPI = {
  list: async (params?: { status?: string; type?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchAPI(`/api/proposals${query ? `?${query}` : ''}`);
  },

  get: async (id: string) => {
    return fetchAPI(`/api/proposals/${id}`);
  },

  create: async (data: {
    title: string;
    type: string;
    templateId?: string;
    sections?: any[];
  }) => {
    return fetchAPI('/api/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return fetchAPI(`/api/proposals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return fetchAPI(`/api/proposals/${id}`, {
      method: 'DELETE',
    });
  },

  export: async (id: string, format: 'PDF' | 'DOCX') => {
    const response = await fetch(`/api/proposals/${id}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format }),
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  },
};

// Sections API
export const sectionsAPI = {
  list: async (proposalId: string) => {
    return fetchAPI(`/api/proposals/${proposalId}/sections`);
  },

  create: async (proposalId: string, data: { title: string; content: string; order: number }) => {
    return fetchAPI(`/api/proposals/${proposalId}/sections`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (proposalId: string, sectionId: string, data: any) => {
    return fetchAPI(`/api/proposals/${proposalId}/sections/${sectionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (proposalId: string, sectionId: string) => {
    return fetchAPI(`/api/proposals/${proposalId}/sections/${sectionId}`, {
      method: 'DELETE',
    });
  },
};

// AI API
export const aiAPI = {
  generate: async (data: {
    proposalId: string;
    sectionId?: string;
    title: string;
    context?: string;
    tone?: string;
    length?: string;
    includePreviousSections?: boolean;
  }) => {
    return fetchAPI('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  improve: async (data: {
    content: string;
    instruction: string;
    proposalId?: string;
    sectionId?: string;
  }) => {
    return fetchAPI('/api/ai/improve', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Templates API
export const templatesAPI = {
  list: async (type?: string) => {
    const query = type ? `?type=${type}` : '';
    return fetchAPI(`/api/templates${query}`);
  },
};

// Stats API
export const statsAPI = {
  get: async () => {
    return fetchAPI('/api/stats');
  },
};
