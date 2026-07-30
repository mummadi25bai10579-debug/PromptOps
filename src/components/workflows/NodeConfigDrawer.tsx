import React from 'react';
import { 
  X, Play, Trash2, Copy, Sparkles, AlertCircle, CheckCircle2, 
  ExternalLink, Download, Clock, RefreshCw
} from 'lucide-react';
import { WorkflowNodeData, WorkflowNodeType } from '../../types/workflow';

interface NodeConfigDrawerProps {
  nodeId: string | null;
  nodeData: WorkflowNodeData | null;
  onClose: () => void;
  onUpdateParams: (nodeId: string, params: Record<string, any>, title?: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onRetryNode: (nodeId: string) => void;
}

export const NodeConfigDrawer: React.FC<NodeConfigDrawerProps> = ({
  nodeId,
  nodeData,
  onClose,
  onUpdateParams,
  onDeleteNode,
  onDuplicateNode,
  onRetryNode
}) => {
  if (!nodeId || !nodeData) return null;

  const params = nodeData.params || {};
  const status = nodeData.status || 'idle';
  const output = nodeData.output;

  const handleInputChange = (key: string, value: any) => {
    onUpdateParams(nodeId, { ...params, [key]: value });
  };

  const handleTitleChange = (newTitle: string) => {
    onUpdateParams(nodeId, params, newTitle);
  };

  return (
    <aside className="w-96 bg-[#090d16]/95 border-l border-white/5 flex flex-col h-full shadow-2xl backdrop-blur-2xl z-20 overflow-y-auto no-scrollbar">
      {/* Drawer Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#090d16]/95 backdrop-blur-xl z-10">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={nodeData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-sm font-semibold text-white bg-transparent hover:bg-white/5 focus:bg-white/10 rounded px-2 py-1 outline-none border border-transparent focus:border-indigo-500/50 transition-all w-48"
          />
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase">
            {nodeData.nodeType}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="p-5 space-y-6 flex-1">
        {/* Status & Execution Bar */}
        <div className="p-3.5 rounded-2xl bg-[#111827]/60 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Execution Status</span>
            <div className="flex items-center gap-1.5">
              {status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {status === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
              <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                status === 'success' ? 'text-emerald-400' :
                status === 'error' ? 'text-rose-400' :
                status === 'running' ? 'text-amber-400 animate-pulse' : 'text-slate-400'
              }`}>
                {status}
              </span>
            </div>
          </div>

          {nodeData.executionTimeMs !== undefined && (
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1 border-t border-white/5">
              <span>Execution Time</span>
              <span className="text-indigo-300">{(nodeData.executionTimeMs / 1000).toFixed(2)}s</span>
            </div>
          )}

          {status === 'error' && (
            <div className="pt-2 border-t border-white/5 space-y-2">
              <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 font-mono">
                {nodeData.errorMessage || 'Step execution encountered an error.'}
              </p>
              <button
                onClick={() => onRetryNode(nodeId)}
                className="w-full py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Failed Step
              </button>
            </div>
          )}
        </div>

        {/* Node Specific Form Controls */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Parameters & Config
          </h4>

          {/* Prompt Input Node Controls */}
          {nodeData.nodeType === 'promptInput' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Prompt Text</label>
                <textarea
                  rows={4}
                  value={params.promptText || ''}
                  onChange={(e) => handleInputChange('promptText', e.target.value)}
                  placeholder="Enter initial prompt idea or script..."
                  className="w-full bg-[#111827] border border-white/10 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Text Generation Node Controls */}
          {nodeData.nodeType === 'textGen' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Category</label>
                <select
                  value={params.textCategory || 'Blog'}
                  onChange={(e) => handleInputChange('textCategory', e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200"
                >
                  <option value="Blog">Blog Article</option>
                  <option value="Social">Social Media Copy</option>
                  <option value="Script">Video/Podcast Script</option>
                  <option value="Summary">Executive Summary</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Tone of Voice</label>
                <select
                  value={params.textTone || 'Professional'}
                  onChange={(e) => handleInputChange('textTone', e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200"
                >
                  <option value="Professional">Professional</option>
                  <option value="Creative">Creative & Engaging</option>
                  <option value="Casual">Casual & Conversational</option>
                  <option value="Formal">Formal Technical</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Response Length</label>
                <select
                  value={params.textLength || 'Medium'}
                  onChange={(e) => handleInputChange('textLength', e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200"
                >
                  <option value="Short">Short (~100 words)</option>
                  <option value="Medium">Medium (~300 words)</option>
                  <option value="Long">Long (~500+ words)</option>
                </select>
              </div>
            </div>
          )}

          {/* Image Generation Node Controls */}
          {nodeData.nodeType === 'imageGen' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Aspect Ratio</label>
                <select
                  value={params.imageAspect || '1:1'}
                  onChange={(e) => handleInputChange('imageAspect', e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200"
                >
                  <option value="1:1">1:1 Square (1024x1024)</option>
                  <option value="16:9">16:9 Widescreen (1024x576)</option>
                  <option value="9:16">9:16 Portrait (576x1024)</option>
                  <option value="4:3">4:3 Standard (1024x768)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Generator Model Provider</label>
                <select
                  value={params.imageProvider || 'pollinations'}
                  onChange={(e) => handleInputChange('imageProvider', e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200"
                >
                  <option value="pollinations">Pollinations FLUX Schnell (High Speed)</option>
                  <option value="huggingface">Hugging Face FLUX.1 Pro (Premium)</option>
                </select>
              </div>
            </div>
          )}

          {/* Video Generation Node Controls */}
          {nodeData.nodeType === 'videoGen' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Camera Motion Animation</label>
                <select
                  value={params.videoAnimation || 'Zoom In'}
                  onChange={(e) => handleInputChange('videoAnimation', e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200"
                >
                  <option value="Zoom In">Cinematic Zoom In</option>
                  <option value="Zoom Out">Dramatic Zoom Out</option>
                  <option value="Pan Left">Pan Left Smooth</option>
                  <option value="Pan Right">Pan Right Smooth</option>
                  <option value="Fade In">Fade In Reveal</option>
                  <option value="Slow Rotate">3D Slow Rotation</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Video Duration (seconds)</label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={params.videoDuration || 5}
                  onChange={(e) => handleInputChange('videoDuration', Number(e.target.value))}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Resolution</label>
                <select
                  value={params.videoResolution || '720p'}
                  onChange={(e) => handleInputChange('videoResolution', e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200"
                >
                  <option value="720p">720p HD (Fast)</option>
                  <option value="1080p">1080p Full HD</option>
                </select>
              </div>
            </div>
          )}

          {/* Audio Generation Node Controls */}
          {nodeData.nodeType === 'audioGen' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Voice Profile</label>
                <select
                  value={params.audioVoice || 'Female'}
                  onChange={(e) => handleInputChange('audioVoice', e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200"
                >
                  <option value="Female">Kore (Female - Natural Warm)</option>
                  <option value="Male">Fenrir (Male - Deep Resonant)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Speech Language</label>
                <select
                  value={params.audioLanguage || 'English'}
                  onChange={(e) => handleInputChange('audioLanguage', e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200"
                >
                  <option value="English">English (US)</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Japanese">Japanese</option>
                </select>
              </div>
            </div>
          )}

          {/* Image Upscale Node Controls */}
          {nodeData.nodeType === 'imageUpscale' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Scale Factor</label>
                <select
                  value={params.upscaleFactor || '2x'}
                  onChange={(e) => handleInputChange('upscaleFactor', e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200"
                >
                  <option value="2x">2x Resolution Upscale</option>
                  <option value="4x">4x Ultra Clarity Upscale</option>
                </select>
              </div>
            </div>
          )}

          {/* Storage Node Controls */}
          {nodeData.nodeType === 'storage' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Storage Destination</label>
                <select
                  value={params.storageTarget || 'backblaze_b2'}
                  onChange={(e) => handleInputChange('storageTarget', e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200"
                >
                  <option value="backblaze_b2">Backblaze B2 Bucket (prompt-media)</option>
                  <option value="asset_library">PromptOps Asset Library</option>
                </select>
              </div>
            </div>
          )}

          {/* Condition Node Controls */}
          {nodeData.nodeType === 'condition' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Condition Rule</label>
                <select
                  value={params.conditionType || 'contains_text'}
                  onChange={(e) => handleInputChange('conditionType', e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200"
                >
                  <option value="contains_text">Contains Keyword/Text</option>
                  <option value="length_greater_than">Character Length &gt;</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Condition Value</label>
                <input
                  type="text"
                  value={params.conditionValue || ''}
                  onChange={(e) => handleInputChange('conditionValue', e.target.value)}
                  placeholder="e.g. AI or 50"
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200"
                />
              </div>
            </div>
          )}

          {/* Delay Node Controls */}
          {nodeData.nodeType === 'delay' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Delay Time (seconds)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={params.delaySeconds || 3}
                  onChange={(e) => handleInputChange('delaySeconds', Number(e.target.value))}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200"
                />
              </div>
            </div>
          )}

          {/* Notification Node Controls */}
          {nodeData.nodeType === 'notification' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Notification Message</label>
                <input
                  type="text"
                  value={params.notificationMessage || ''}
                  onChange={(e) => handleInputChange('notificationMessage', e.target.value)}
                  placeholder="e.g. Workflow Step Complete"
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200"
                />
              </div>
            </div>
          )}

          {/* Custom API Node Controls */}
          {nodeData.nodeType === 'customApi' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">API Endpoint URL</label>
                <input
                  type="text"
                  value={params.apiEndpoint || ''}
                  onChange={(e) => handleInputChange('apiEndpoint', e.target.value)}
                  placeholder="https://api.example.com/webhook"
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">HTTP Method</label>
                <select
                  value={params.apiMethod || 'GET'}
                  onChange={(e) => handleInputChange('apiMethod', e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Output Inspector */}
        {output && (
          <div className="space-y-3 pt-4 border-t border-white/5">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Output Results
            </h4>

            {output.text && (
              <div className="bg-[#030712] border border-white/10 rounded-xl p-3 space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Text Result</span>
                <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {output.text}
                </p>
              </div>
            )}

            {output.imageUrl && (
              <div className="bg-[#030712] border border-white/10 rounded-xl p-2 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
                  <span>Image Result</span>
                  <a href={output.imageUrl} download="workflow-image.png" className="hover:text-white flex items-center gap-1">
                    <Download className="w-3 h-3" /> Save
                  </a>
                </div>
                <img src={output.imageUrl || undefined} alt="Result" className="w-full rounded-lg object-contain max-h-48 bg-black/40" />
              </div>
            )}

            {output.videoUrl && (
              <div className="bg-[#030712] border border-white/10 rounded-xl p-2 space-y-2">
                <div className="text-[10px] font-mono text-slate-400 px-1">Video Stream</div>
                <video src={output.videoUrl || undefined} controls className="w-full rounded-lg max-h-48 object-cover" />
              </div>
            )}

            {output.audioUrl && (
              <div className="bg-[#030712] border border-white/10 rounded-xl p-2 space-y-2">
                <div className="text-[10px] font-mono text-slate-400 px-1">Audio Audio Stream</div>
                <audio src={output.audioUrl || undefined} controls className="w-full h-8" />
              </div>
            )}

            {output.b2Url && (
              <div className="bg-[#030712] border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-emerald-300">Saved to Backblaze B2</div>
                  <div className="text-[10px] text-slate-400 font-mono">{output.fileId || 'B2 Cloud File'}</div>
                </div>
                <a
                  href={output.b2Url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Quick Node Actions */}
        <div className="pt-4 border-t border-white/5 flex items-center gap-2">
          <button
            onClick={() => onDuplicateNode(nodeId)}
            className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Duplicate
          </button>
          <button
            onClick={() => onDeleteNode(nodeId)}
            className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>
    </aside>
  );
};
