import axios from "axios";

const BASE = "http://localhost:8000";

export interface VaultItem {
  id: string;
  original_name: string;
  saved_name: string;
  mime_type: string;
  file_url: string;
  type_category: "image" | "pdf" | "audio" | "text" | "other";
}

export interface SearchResult extends VaultItem {
  similarity: number;
}

export const api = {
  upload: async (file: File): Promise<VaultItem> => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await axios.post<VaultItem>(`${BASE}/upload`, form);
    return data;
  },

  searchText: async (query: string): Promise<SearchResult[]> => {
    const form = new FormData();
    form.append("query", query);
    const { data } = await axios.post<{ results: SearchResult[] }>(
      `${BASE}/search/text`,
      form
    );
    return data.results;
  },

  searchImage: async (file: File): Promise<SearchResult[]> => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await axios.post<{ results: SearchResult[] }>(
      `${BASE}/search/image`,
      form
    );
    return data.results;
  },

  listItems: async (): Promise<VaultItem[]> => {
    const { data } = await axios.get<{ items: VaultItem[] }>(`${BASE}/items`);
    return data.items;
  },

  deleteItem: async (id: string): Promise<void> => {
    await axios.delete(`${BASE}/items/${id}`);
  },

  fileUrl: (fileUrl: string) => `${BASE}${fileUrl}`,
};
