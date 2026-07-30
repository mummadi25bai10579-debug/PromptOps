export type User = {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export type AssetType = 'image' | 'video' | 'audio' | 'document' | 'text';

export type TokenUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type GenerationSettings = {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  aspectRatio?: string;
  resolution?: string;
  fps?: string | number;
  seed?: string | number;
  guidanceScale?: number;
  steps?: number;
  style?: string;
  [key: string]: any;
};

export type GenerationJob = {
  id: string;
  userId: string;
  prompt: string;
  negativePrompt?: string;
  type: AssetType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  createdAt: any;
  model: string;
  provider?: string;
  favorite?: boolean;
  tags?: string[];
  resolution?: string;
  fps?: string;
  duration?: string | number;
  seed?: string | number;
  workflowId?: string;
  b2FileId?: string;
  b2Url?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  generatedText?: string;
  parameters?: Record<string, any>;
  settings?: GenerationSettings;
  assetId?: string;
  tokens?: TokenUsage;
};

export type PromptHistoryItem = GenerationJob;
export type AssetDocument = GenerationJob;

export type Comparison = {
  id: string;
  userId: string;
  assetAId: string;
  assetBId: string;
  assetA?: GenerationJob;
  assetB?: GenerationJob;
  winnerId?: string | null;
  createdAt: any;
};

export type Project = {
  id: string;
  userId: string;
  name: string;
  createdAt: any;
};


