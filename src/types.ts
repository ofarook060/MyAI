export type Provider = "gemini" | "openrouter" | "huggingface" | "ollama" | "local-gemma";

export interface AIModel {
  id: string;
  name: string;
  displayName: string;
  description: string;
  provider: Provider;
  size?: string;
  type: "cloud" | "local" | "hybrid";
  isDownloaded?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  stats?: {
    tokensPerSecond?: number;
    timeToFirstTokenMs?: number;
    engine?: string;
    ramUsageGb?: string;
    isOfflineSimulated?: boolean;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  provider: Provider;
  model: string;
  createdAt: string;
}

export interface ProviderConfig {
  apiKey: string;
  isActive: boolean;
  customModels: string[];
  ollamaUrl?: string;
}

export interface DownloadState {
  modelId: string;
  progress: number;
  speed: string;
  eta: string;
  status: "idle" | "preparing" | "downloading" | "verifying" | "installed";
  log: string[];
}
