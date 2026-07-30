export type WorkflowNodeType = 
  | 'promptInput'
  | 'textGen'
  | 'imageGen'
  | 'videoGen'
  | 'audioGen'
  | 'imageUpscale'
  | 'storage'
  | 'condition'
  | 'delay'
  | 'notification'
  | 'customApi';

export type NodeExecutionStatus = 'idle' | 'pending' | 'running' | 'success' | 'error' | 'paused';

export interface WorkflowNodeOutput {
  text?: string;
  imageUrl?: string;
  imageBase64?: string;
  videoUrl?: string;
  videoBase64?: string;
  audioUrl?: string;
  audioBase64?: string;
  fileId?: string;
  b2Url?: string;
  conditionMet?: boolean;
  rawResponse?: any;
  [key: string]: any;
}

export interface WorkflowNodeData {
  title: string;
  description: string;
  nodeType: WorkflowNodeType;
  status: NodeExecutionStatus;
  executionTimeMs?: number;
  errorMessage?: string;
  output?: WorkflowNodeOutput;
  logs?: string[];
  
  // Custom Parameters per Node Type
  params: {
    // Prompt Input
    promptText?: string;
    systemPrompt?: string;
    variables?: Record<string, string>;

    // Text Gen (Gemini)
    textCategory?: string; // 'Blog' | 'Social' | 'Script' | 'Summary'
    textTone?: string; // 'Professional' | 'Creative' | 'Casual' | 'Formal'
    textLength?: 'Short' | 'Medium' | 'Long';

    // Image Gen (FLUX / Pollinations)
    imageAspect?: '1:1' | '16:9' | '9:16' | '4:3';
    imageProvider?: 'pollinations' | 'huggingface';
    imageStyle?: string;

    // Video Gen (LTX / FFmpeg)
    videoAnimation?: 'Zoom In' | 'Zoom Out' | 'Pan Left' | 'Pan Right' | 'Fade In' | 'Slow Rotate';
    videoDuration?: number; // seconds
    videoResolution?: '720p' | '1080p';
    videoFps?: number;
    videoProvider?: 'ffmpeg' | 'huggingface';

    // Audio Gen (Gemini TTS / Neural)
    audioVoice?: 'Female' | 'Male';
    audioLanguage?: string;
    audioSpeed?: number;

    // Image Upscale
    upscaleFactor?: '2x' | '4x';
    enhanceDetail?: boolean;

    // Storage
    storageTarget?: 'backblaze_b2' | 'asset_library';
    autoShare?: boolean;

    // Condition
    conditionType?: 'contains_text' | 'length_greater_than' | 'aspect_is';
    conditionValue?: string;

    // Delay
    delaySeconds?: number;

    // Notification
    notificationChannel?: 'in_app' | 'webhook';
    webhookUrl?: string;
    notificationMessage?: string;

    // Custom API
    apiEndpoint?: string;
    apiMethod?: 'GET' | 'POST' | 'PUT';
    apiHeaders?: string; // JSON string
    apiBody?: string; // JSON string

    [key: string]: any;
  };
}

export type WorkflowExecutionMode = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowLogItem {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  nodeId?: string;
  nodeTitle?: string;
  message: string;
  details?: any;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  finishedAt: string;
  executionTimeMs: number;
  nodeCount: number;
  assetsGenerated: {
    type: 'image' | 'video' | 'audio' | 'text';
    url?: string;
    b2FileId?: string;
    preview?: string;
  }[];
  logs: WorkflowLogItem[];
  userId?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: any[]; // ReactFlow Node[]
  edges: any[]; // ReactFlow Edge[]
  createdAt: string;
  updatedAt: string;
  userId?: string;
  isTemplate?: boolean;
  category?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  iconName: string;
  nodes: any[];
  edges: any[];
}
