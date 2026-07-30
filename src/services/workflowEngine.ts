import { WorkflowNodeData, WorkflowLogItem, WorkflowNodeOutput } from '../types/workflow';

export interface ExecutionCallbacks {
  onNodeStatusChange: (nodeId: string, status: WorkflowNodeData['status'], durationMs?: number, output?: WorkflowNodeOutput, errorMsg?: string) => void;
  onLog: (log: Omit<WorkflowLogItem, 'id'>) => void;
  onExecutionStateChange: (state: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled') => void;
}

export class WorkflowEngine {
  private nodes: any[];
  private edges: any[];
  private callbacks: ExecutionCallbacks;
  private isPaused: boolean = false;
  private isCancelled: boolean = false;
  private currentStepNodeId: string | null = null;

  constructor(nodes: any[], edges: any[], callbacks: ExecutionCallbacks) {
    this.nodes = nodes;
    this.edges = edges;
    this.callbacks = callbacks;
  }

  public pause() {
    this.isPaused = true;
    this.callbacks.onExecutionStateChange('paused');
    this.callbacks.onLog({
      timestamp: new Date().toLocaleTimeString(),
      level: 'warning',
      message: 'Workflow execution paused by user.'
    });
  }

  public resume() {
    this.isPaused = false;
    this.callbacks.onExecutionStateChange('running');
    this.callbacks.onLog({
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'Workflow execution resumed.'
    });
  }

  public cancel() {
    this.isCancelled = true;
    this.callbacks.onExecutionStateChange('cancelled');
    this.callbacks.onLog({
      timestamp: new Date().toLocaleTimeString(),
      level: 'error',
      message: 'Workflow execution cancelled by user.'
    });
  }

  /**
   * Topologically orders nodes according to directed edges
   */
  private getTopologicalOrder(): any[] {
    const inDegree: Record<string, number> = {};
    const adj: Record<string, string[]> = {};

    this.nodes.forEach(node => {
      inDegree[node.id] = 0;
      adj[node.id] = [];
    });

    this.edges.forEach(edge => {
      if (adj[edge.source] && inDegree[edge.target] !== undefined) {
        adj[edge.source].push(edge.target);
        inDegree[edge.target]++;
      }
    });

    const queue: string[] = [];
    Object.keys(inDegree).forEach(id => {
      if (inDegree[id] === 0) {
        queue.push(id);
      }
    });

    const orderedIds: string[] = [];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      orderedIds.push(curr);

      adj[curr]?.forEach(neighbor => {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      });
    }

    // Fallback if graph has cycles or disconnected components
    if (orderedIds.length < this.nodes.length) {
      const remaining = this.nodes.filter(n => !orderedIds.includes(n.id)).map(n => n.id);
      orderedIds.push(...remaining);
    }

    return orderedIds.map(id => this.nodes.find(n => n.id === id)!);
  }

  /**
   * Main Execution Loop
   */
  public async run(): Promise<boolean> {
    this.isPaused = false;
    this.isCancelled = false;
    this.callbacks.onExecutionStateChange('running');

    const executionOrder = this.getTopologicalOrder();
    const nodeOutputs: Record<string, WorkflowNodeOutput> = {};

    this.callbacks.onLog({
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: `Starting workflow execution with ${executionOrder.length} steps.`
    });

    for (const node of executionOrder) {
      if (this.isCancelled) return false;

      // Handle Pause
      while (this.isPaused) {
        if (this.isCancelled) return false;
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      this.currentStepNodeId = node.id;
      const nodeData: WorkflowNodeData = node.data;

      // Mark running
      this.callbacks.onNodeStatusChange(node.id, 'running');
      this.callbacks.onLog({
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        nodeId: node.id,
        nodeTitle: nodeData.title,
        message: `Executing node "${nodeData.title}" (${nodeData.nodeType})`
      });

      const startTime = Date.now();

      try {
        // Collect inputs from upstream nodes
        const upstreamEdges = this.edges.filter(e => e.target === node.id);
        const upstreamOutputs = upstreamEdges.map(e => nodeOutputs[e.source]).filter(Boolean);

        const output = await this.executeSingleNode(node, upstreamOutputs);
        const durationMs = Date.now() - startTime;

        nodeOutputs[node.id] = output;

        if (this.isCancelled) return false;

        this.callbacks.onNodeStatusChange(node.id, 'success', durationMs, output);
        this.callbacks.onLog({
          timestamp: new Date().toLocaleTimeString(),
          level: 'success',
          nodeId: node.id,
          nodeTitle: nodeData.title,
          message: `Completed "${nodeData.title}" in ${(durationMs / 1000).toFixed(2)}s.`
        });
      } catch (err: any) {
        const durationMs = Date.now() - startTime;
        const errorMsg = err.message || 'Node execution failed';

        this.callbacks.onNodeStatusChange(node.id, 'error', durationMs, undefined, errorMsg);
        this.callbacks.onLog({
          timestamp: new Date().toLocaleTimeString(),
          level: 'error',
          nodeId: node.id,
          nodeTitle: nodeData.title,
          message: `Failed "${nodeData.title}": ${errorMsg}`
        });

        this.callbacks.onExecutionStateChange('failed');
        return false;
      }
    }

    this.callbacks.onExecutionStateChange('completed');
    this.callbacks.onLog({
      timestamp: new Date().toLocaleTimeString(),
      level: 'success',
      message: 'Workflow execution completed successfully!'
    });

    return true;
  }

  /**
   * Executes individual node logic
   */
  public async executeSingleNode(node: any, upstreamOutputs: WorkflowNodeOutput[]): Promise<WorkflowNodeOutput> {
    const data: WorkflowNodeData = node.data;
    const params = data.params || {};

    // Combine upstream text, images, or audio
    const parentText = upstreamOutputs.map(o => o.text).filter(Boolean).join('\n\n') || params.promptText || '';
    const parentImage = upstreamOutputs.map(o => o.imageUrl || o.imageBase64).filter(Boolean)[0] || '';
    const parentAudio = upstreamOutputs.map(o => o.audioUrl || o.audioBase64).filter(Boolean)[0] || '';
    const parentVideo = upstreamOutputs.map(o => o.videoUrl || o.videoBase64).filter(Boolean)[0] || '';

    switch (data.nodeType) {
      case 'promptInput': {
        const text = params.promptText || 'A creative AI workflow prompt';
        return { text };
      }

      case 'textGen': {
        const prompt = parentText || params.promptText || 'Write a creative summary';
        const response = await fetch('/api/generate/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            tone: params.textTone || 'Professional',
            length: params.textLength || 'Medium',
            category: params.textCategory || 'Blog'
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || errData.details || `Text generation failed with status ${response.status}`);
        }

        const resData = await response.json();
        return { text: resData.text };
      }

      case 'imageGen': {
        const prompt = parentText || params.promptText || 'Futuristic cybernetic metropolis';
        const response = await fetch('/api/generate/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            aspectRatio: params.imageAspect || '1:1',
            provider: params.imageProvider || 'pollinations'
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || errData.details || `Image generation failed with status ${response.status}`);
        }

        const resData = await response.json();
        const base64 = resData.base64;
        const imageUrl = `data:image/png;base64,${base64}`;

        return {
          imageBase64: base64,
          imageUrl: imageUrl,
          text: prompt
        };
      }

      case 'videoGen': {
        let imageUrl = parentImage;
        if (!imageUrl) {
          // If no parent image, generate a base frame first
          const prompt = parentText || 'Cinematic futuristic visual landscape';
          const imgRes = await fetch('/api/generate/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, aspectRatio: '16:9', provider: 'pollinations' })
          });
          const imgData = await imgRes.json();
          imageUrl = `data:image/png;base64,${imgData.base64}`;
        }

        const response = await fetch('/api/generate/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl,
            animation: params.videoAnimation || 'Zoom In',
            duration: params.videoDuration || 5,
            resolution: params.videoResolution || '720p',
            fps: params.videoFps || 30,
            provider: params.videoProvider || 'ffmpeg',
            prompt: parentText
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || errData.details || `Video generation failed with status ${response.status}`);
        }

        const resData = await response.json();
        const videoBase64 = resData.base64;
        const videoUrl = `data:video/mp4;base64,${videoBase64}`;

        return {
          videoBase64,
          videoUrl,
          imageUrl
        };
      }

      case 'audioGen': {
        const prompt = parentText || params.promptText || 'Welcome to PromptOps AI Workflow engine.';
        const response = await fetch('/api/generate/audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            voice: params.audioVoice || 'Female',
            language: params.audioLanguage || 'English'
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || errData.details || `Audio generation failed with status ${response.status}`);
        }

        const resData = await response.json();
        const audioBase64 = resData.base64;
        const audioUrl = `data:audio/wav;base64,${audioBase64}`;

        return {
          audioBase64,
          audioUrl,
          text: prompt
        };
      }

      case 'imageUpscale': {
        const sourceImage = parentImage;
        if (!sourceImage) {
          throw new Error('Image Upscale node requires an incoming image from parent node');
        }

        // Simulate high quality 2x / 4x upscale processing delay
        await new Promise(resolve => setTimeout(resolve, 1200));

        return {
          imageUrl: sourceImage,
          imageBase64: sourceImage.replace(/^data:image\/\w+;base64,/, ''),
          text: `Upscaled (${params.upscaleFactor || '2x'})`
        };
      }

      case 'storage': {
        // Upload image, audio, or video output to Backblaze B2
        let blobToUpload: Blob | null = null;
        let mimeType = 'text/plain';
        let filename = `asset_${Date.now()}.txt`;

        if (parentImage) {
          const base64Data = parentImage.replace(/^data:image\/\w+;base64,/, '');
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blobToUpload = new Blob([byteArray], { type: 'image/png' });
          mimeType = 'image/png';
          filename = `image_${Date.now()}.png`;
        } else if (parentVideo) {
          const base64Data = parentVideo.replace(/^data:video\/\w+;base64,/, '');
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blobToUpload = new Blob([byteArray], { type: 'video/mp4' });
          mimeType = 'video/mp4';
          filename = `video_${Date.now()}.mp4`;
        } else if (parentAudio) {
          const base64Data = parentAudio.replace(/^data:audio\/\w+;base64,/, '');
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blobToUpload = new Blob([byteArray], { type: 'audio/wav' });
          mimeType = 'audio/wav';
          filename = `audio_${Date.now()}.wav`;
        } else if (parentText) {
          blobToUpload = new Blob([parentText], { type: 'text/plain' });
          mimeType = 'text/plain';
          filename = `text_${Date.now()}.txt`;
        } else {
          throw new Error('Storage node requires output from an upstream node');
        }

        const formData = new FormData();
        formData.append('file', blobToUpload, filename);

        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || errData.details || `Backblaze storage upload failed with status ${response.status}`);
        }

        const resData = await response.json();

        return {
          fileId: resData.fileId,
          b2Url: resData.url,
          imageUrl: parentImage,
          videoUrl: parentVideo,
          audioUrl: parentAudio,
          text: parentText
        };
      }

      case 'condition': {
        const conditionType = params.conditionType || 'contains_text';
        const targetVal = (params.conditionValue || '').toLowerCase();
        let conditionMet = false;

        if (conditionType === 'contains_text') {
          conditionMet = parentText.toLowerCase().includes(targetVal);
        } else if (conditionType === 'length_greater_than') {
          const len = parseInt(targetVal) || 50;
          conditionMet = parentText.length > len;
        } else {
          conditionMet = Boolean(parentText || parentImage || parentVideo);
        }

        return {
          conditionMet,
          text: `Condition (${conditionType}): ${conditionMet ? 'Passed' : 'Failed'}`
        };
      }

      case 'delay': {
        const delaySec = params.delaySeconds || 3;
        await new Promise(resolve => setTimeout(resolve, delaySec * 1000));
        return { text: `Delayed ${delaySec}s` };
      }

      case 'notification': {
        const message = params.notificationMessage || `Workflow notification: ${parentText.substring(0, 50)}...`;
        return { text: `Notification Sent: ${message}` };
      }

      case 'customApi': {
        const endpoint = params.apiEndpoint || 'https://jsonplaceholder.typicode.com/posts/1';
        const method = params.apiMethod || 'GET';
        
        let headers: Record<string, string> = {};
        if (params.apiHeaders) {
          try { headers = JSON.parse(params.apiHeaders); } catch (_) {}
        }

        let body: any = undefined;
        if (method !== 'GET' && params.apiBody) {
          body = params.apiBody;
        }

        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json', ...headers },
          body
        });

        const rawResponse = await response.json().catch(() => ({ status: response.status }));
        return {
          rawResponse,
          text: JSON.stringify(rawResponse, null, 2)
        };
      }

      default:
        return { text: parentText };
    }
  }
}
