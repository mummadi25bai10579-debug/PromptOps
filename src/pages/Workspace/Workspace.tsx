import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  Image as ImageIcon, Video, FileText, Music, Sparkles, 
  Lock, Unlock, Check, X, Loader2, Settings2, SlidersHorizontal, ImagePlus
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { genblazeService, GenblazeWorkflow } from '../../services/genblaze';
import { useGenerations } from '../../hooks/useGenerations';
import { cn } from '../../utils/cn';
import { Type, AlignLeft, Copy, Download, Trash2, History, RotateCw, CheckCircle2, Save, Wand2, Volume2, Mic, Play, Pause, FastForward } from 'lucide-react';

const TONES = ['Professional', 'Casual', 'Friendly', 'Formal', 'Creative'];
const LENGTHS = ['Short', 'Medium', 'Long'];
const CATEGORIES = ['Blog', 'Email', 'Story', 'Code', 'Summary', 'Social Media', 'Resume', 'Article', 'Explanation', 'Translation'];
const VIDEO_ANIMATIONS = ['Zoom In', 'Zoom Out', 'Pan Left', 'Pan Right', 'Pan Up', 'Pan Down', 'Slow Rotate', 'Fade In', 'Fade Out'];
const MOTION_STRENGTHS = ['Low', 'Medium', 'High'];
const CAMERA_MOTIONS = ['Static', 'Zoom In', 'Zoom Out', 'Orbit', 'Pan Left', 'Pan Right'];

type GenerationStatus = 'idle' | 'thinking' | 'generating' | 'formatting' | 'completed' | 'error';

const assetTypes = [
  { id: 'image', name: 'Image', icon: ImageIcon, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  { id: 'video', name: 'Animate Image', icon: Video, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { id: 'audio', name: 'Audio', icon: Music, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { id: 'text', name: 'Text', icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/20' },
];

export const Workspace = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [selectedType, setSelectedType] = useState('image');
  const [selectedProvider, setSelectedProvider] = useState<'pollinations' | 'huggingface'>('pollinations');
  const [accessCode, setAccessCode] = useState('');
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false);
  const [accessCodeError, setAccessCodeError] = useState('');
  const [fallbackMessage, setFallbackMessage] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  
  const [prompt, setPrompt] = useState(location.state?.prompt || '');

  useEffect(() => {
    if (location.state?.prompt) {
      setPrompt(location.state.prompt);
    }
  }, [location.state]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [workflow, setWorkflow] = useState<GenblazeWorkflow | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  

  // Audio generation states
  const [voice, setVoice] = useState('Female');
  const [audioLanguage, setAudioLanguage] = useState('English');
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [audioStatus, setAudioStatus] = useState<GenerationStatus>('idle');
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [audioErrorMsg, setAudioErrorMsg] = useState('');
  const [audioSaved, setAudioSaved] = useState(false);

  // Text generation states
  const [tone, setTone] = useState(TONES[0]);
  const [length, setLength] = useState(LENGTHS[1]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [textStatus, setTextStatus] = useState<GenerationStatus>('idle');
  const [generatedText, setGeneratedText] = useState('');
  const [textErrorMsg, setTextErrorMsg] = useState('');
  const [textCopied, setTextCopied] = useState(false);
  const [textSaved, setTextSaved] = useState(false);

  // Video generation states
  const { generations } = useGenerations();
  const imageAssets = generations.filter(g => g.type === 'image' && g.resultUrl);
  const [selectedImageId, setSelectedImageId] = useState<string>('');
  const [videoAnimation, setVideoAnimation] = useState(VIDEO_ANIMATIONS[0]);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [motionStrength, setMotionStrength] = useState(MOTION_STRENGTHS[1]);
  const [cameraMotion, setCameraMotion] = useState(CAMERA_MOTIONS[0]);
  const [videoSeed, setVideoSeed] = useState('');
  const [videoDuration, setVideoDuration] = useState('5');
  const [videoResolution, setVideoResolution] = useState('720p');
  const [videoFps, setVideoFps] = useState('30');
  const [videoStatus, setVideoStatus] = useState<GenerationStatus>('idle');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoErrorMsg, setVideoErrorMsg] = useState('');
  const [videoSaved, setVideoSaved] = useState(false);
  const [videoStage, setVideoStage] = useState('');
  const [videoProvider, setVideoProvider] = useState<'ffmpeg' | 'huggingface'>('ffmpeg');


  const handleGenerateAudio = async () => {
    if (!prompt.trim() || !user) return;
    
    setGeneratedAudioUrl(null);
    setAudioErrorMsg('');
    setAudioSaved(false);
    
    try {
      setAudioStatus('thinking');
      await new Promise(r => setTimeout(r, 600)); 
      
      setAudioStatus('generating');
      const res = await fetch('/api/generate/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, voice, language: audioLanguage, speed, pitch, volume })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.details || 'Failed to generate audio');
      }
      
      const data = await res.json();
      setAudioStatus('formatting');
      
      // Upload to B2
      const blob = await (await fetch(`data:audio/wav;base64,${data.base64}`)).blob();
      const file = new File([blob], `audio-${Date.now()}.wav`, { type: 'audio/wav' });
      
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error('Failed to upload audio');
      const uploadData = await uploadRes.json();
      
      await addDoc(collection(db, 'generations'), {
        userId: user.id,
        type: 'audio',
        prompt,
        model: 'Gemini TTS',
        provider: data.providerUsed || 'mms-tts',
        voice,
        language: audioLanguage,
        duration: '0:05',
        resultUrl: `/api/media/${uploadData.fileId}`,
        videoUrl: `/api/media/${uploadData.fileId}`,
        thumbnailUrl: "",
        b2FileId: uploadData.fileId,
        b2Url: uploadData.url,
        fileName: uploadData.fileName,
        fileType: uploadData.fileType,
        fileSize: uploadData.fileSize,
        status: 'completed',
        createdAt: serverTimestamp()
      });
      
      setGeneratedAudioUrl(`/api/media/${uploadData.fileId}`);
      setAudioStatus('completed');
      setAudioSaved(true);
    } catch (err: any) {
      console.error(err);
      setAudioErrorMsg(err.message);
      setAudioStatus('error');
    }
  };

  const handleClearAudio = () => {
    setGeneratedAudioUrl(null);
    setAudioStatus('idle');
    setAudioSaved(false);
  };

  const handleGenerateVideo = async () => {
    if (!selectedImageId || !user) return;
    
    const imageAsset = imageAssets.find(img => img.id === selectedImageId);
    if (!imageAsset || !imageAsset.resultUrl) return;
    
    setGeneratedVideoUrl(null);
    setVideoErrorMsg('');
    setVideoSaved(false);
    setFallbackMessage('');
    
    try {
      setVideoStatus('thinking');
      setVideoStage('Preparing...');
      await new Promise(r => setTimeout(r, 600)); 
      
      setVideoStatus('generating');
      setVideoStage(videoProvider === 'huggingface' ? 'Generating AI Video...' : 'Applying Animation...');
      
      const res = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           imageUrl: imageAsset.resultUrl, 
           animation: videoAnimation, 
           prompt: videoPrompt,
           motionStrength,
           cameraMotion,
           seed: videoSeed,
           duration: videoDuration, 
           resolution: videoResolution, 
           fps: videoFps, 
           provider: videoProvider 
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.error || 'Failed to generate video');
      }
      
      const data = await res.json();
      if (data.fallbackMessage) {
        setFallbackMessage(data.fallbackMessage);
      }
      setVideoStatus('formatting');
      setVideoStage('Uploading to Backblaze...');
      
      // Upload to B2
      const blob = await (await fetch(`data:video/mp4;base64,${data.base64}`)).blob();
      const file = new File([blob], `video-${Date.now()}.mp4`, { type: 'video/mp4' });
      
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error('Failed to upload video');
      const uploadData = await uploadRes.json();
      
      await addDoc(collection(db, 'generations'), {
        userId: user.id,
        type: 'video',
        prompt: data.providerUsed === 'huggingface' ? `AI Motion: ${videoPrompt}` : `Animate Image: ${videoAnimation} (${imageAsset.prompt})`,
        model: data.providerUsed === 'huggingface' ? 'LTX-Video' : 'FFmpeg',
        provider: data.providerUsed === 'huggingface' ? 'Hugging Face' : 'FFmpeg',
        animation: videoAnimation,
        imagePrompt: imageAsset.prompt || '',
        motionPrompt: videoPrompt || '',
        duration: videoDuration,
        resolution: videoResolution,
        fps: videoFps,
        sourceImageId: selectedImageId,
        resultUrl: `/api/media/${uploadData.fileId}`,
        videoUrl: `/api/media/${uploadData.fileId}`,
        thumbnailUrl: imageAsset.resultUrl,
        b2FileId: uploadData.fileId,
        b2Url: uploadData.url,
        fileName: uploadData.fileName,
        fileType: uploadData.fileType,
        fileSize: uploadData.fileSize,
        status: 'completed',
        createdAt: serverTimestamp()
      });
      
      setGeneratedVideoUrl(`/api/media/${uploadData.fileId}`);
      setVideoStatus('completed');
      setVideoSaved(true);
    } catch (err: any) {
      console.error(err);
      setVideoErrorMsg(err.message);
      setVideoStatus('error');
    }
  };

  const handleClearVideo = () => {
    setGeneratedVideoUrl(null);
    setVideoStatus('idle');
    setVideoSaved(false);
  };

  const handleGenerateText = async () => {
    if (!prompt.trim() || !user) return;
    
    setGeneratedText('');
    setTextErrorMsg('');
    setTextSaved(false);
    
    try {
      setTextStatus('thinking');
      await new Promise(r => setTimeout(r, 800)); // Simulate thinking
      
      setTextStatus('generating');
      
      const res = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tone, length, category })
      });
      
      setTextStatus('formatting');
      await new Promise(r => setTimeout(r, 600)); // Simulate formatting
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.details || 'Failed to generate text');
      }
      
      const data = await res.json();
      setGeneratedText(data.text);
      setTextStatus('completed');
    } catch (err: any) {
      console.error(err);
      setTextErrorMsg(err.message);
      setTextStatus('error');
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generatedText);
    setTextCopied(true);
    setTimeout(() => setTextCopied(false), 2000);
  };

  const handleDownloadText = () => {
    const blob = new Blob([generatedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleClearText = () => {
    setGeneratedText('');
    setTextStatus('idle');
    setTextSaved(false);
  };

  const handleSaveTextToHistory = async () => {
    if (!user || !generatedText || textSaved) return;
    try {
      await addDoc(collection(db, 'generations'), {
        userId: user.id,
        type: 'text',
        prompt,
        generatedText,
        model: 'gemini-2.5-flash',
        tone,
        length,
        category,
        status: 'completed',
        createdAt: serverTimestamp()
      });
      setTextSaved(true);
    } catch (err) {
      console.error('Failed to save', err);
    }
  };

  const verifyAccessCode = async () => {
    if (!accessCode.trim()) return;
    setIsVerifyingCode(true);
    setAccessCodeError('');
    try {
      const res = await fetch('/api/verify-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode })
      });
      const data = await res.json();
      if (data.success) {
        setIsPremiumUnlocked(true);
      } else {
        setAccessCodeError('Invalid Access Code');
      }
    } catch (err) {
      setAccessCodeError('Failed to verify code');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const uploadWithProgress = (file: Blob, filename: string, onProgress: (progress: number) => void): Promise<any> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file, filename);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(xhr.responseText || 'Upload failed'));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.open('POST', '/api/media/upload');
      xhr.send(formData);
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !user) return;
    setIsGenerating(true);
    setUploadProgress(0);
    setError('');
    setSuccess(false);
    setWorkflow(null);
    setGeneratedImageUrl(null);
    setFallbackMessage('');

    try {
      if (selectedType !== 'image') {
        throw new Error('Only image generation is supported at this time.');
      }

      // 1. Trigger Genblaze Pipeline
      console.log(`[Workspace] Workflow start: Initializing Genblaze pipeline for "${selectedType}"`);
      const initialWorkflow = await genblazeService.executePipeline(
        `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Generation`, 
        { prompt, type: selectedType }
      );
      setWorkflow(initialWorkflow);

      // 2. Wait for Workflow to complete
      await new Promise<void>((resolve, reject) => {
        const unsubscribe = genblazeService.subscribeToWorkflow(initialWorkflow.id, { prompt, type: selectedType, name: initialWorkflow.name }, (updatedWf) => {
          setWorkflow(updatedWf);
          if (updatedWf.status === 'idle') {
            unsubscribe();
            resolve();
          } else if (updatedWf.status === 'failed') {
            unsubscribe();
            reject(new Error('Genblaze workflow failed'));
          }
        });
      });

      // 3. Generate Image using selected provider
      console.log(`[Workspace] Requesting generation for: "${prompt}" using ${selectedProvider}`);
      
      const payload = { 
        prompt, 
        aspectRatio: '1:1', // Fixed as per original logic although we have a local state
        provider: selectedProvider,
        accessCode: isPremiumUnlocked ? accessCode : undefined
      };

      const generateRes = await fetch('/api/generate/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!generateRes.ok) {
        const errData = await generateRes.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || 'Failed to generate image from API');
      }

      console.log(`[Workspace] API request successful, receiving generated image...`);
      const { base64, providerUsed, fallbackMessage: fbMsg } = await generateRes.json();
      
      if (fbMsg) {
        setFallbackMessage(fbMsg);
      }
      
      // Convert base64 to Blob
      const binary = atob(base64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([array], { type: 'image/jpeg' });
      if (blob.size === 0) throw new Error("Generated image blob is empty");
      console.log(`[Workspace] Converted response to Blob (size: ${blob.size} bytes). Preparing to upload...`);

      // 4. Upload to B2 with retries
      let retryCount = 0;
      const maxRetries = 3;
      let uploadData = null;

      while (retryCount < maxRetries) {
        try {
          console.log(`[Workspace] Upload attempt ${retryCount + 1} to Backblaze B2...`);
          uploadData = await uploadWithProgress(blob, `generated-${initialWorkflow.id}-${Date.now()}.jpg`, (progress) => {
            setUploadProgress(progress);
          });
          console.log(`[Workspace] Upload successful:`, uploadData);
          break; // Success, exit retry loop
        } catch (uploadErr) {
          retryCount++;
          console.error(`Upload attempt ${retryCount} failed:`, uploadErr);
          if (retryCount >= maxRetries) {
            throw new Error(`Upload to B2 failed: ${uploadErr instanceof Error ? uploadErr.message : String(uploadErr)}`);
          }
          await new Promise(res => setTimeout(res, 1000 * retryCount)); // Exponential backoff
        }
      }

      if (!uploadData) throw new Error('Upload failed');

      // 5. Store metadata in Firestore
      console.log(`[Workspace] Storing metadata in Firestore...`);
      await addDoc(collection(db, 'generations'), {
        userId: user.id,
        prompt: prompt.trim(),
        type: selectedType,
        status: 'completed',
        model: selectedType === 'image' ? (providerUsed === 'huggingface' ? 'HF FLUX.1-schnell' : 'Pollinations') : selectedType === 'video' ? 'Sora' : 'AudioGen',
        provider: providerUsed || 'pollinations',
        workflowId: initialWorkflow.id,
        resultUrl: `/api/media/${uploadData.fileId}`,
        fileName: uploadData.fileName,
        fileType: uploadData.fileType,
        fileSize: uploadData.fileSize,
        b2FileId: uploadData.fileId,
        b2Url: uploadData.url,
        createdAt: serverTimestamp(),
      });
      console.log(`[Workspace] Final success! Pipeline completed.`);
      
      setSuccess(true);
      setGeneratedImageUrl(`/api/media/${uploadData.fileId}`);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate');
    } finally {
      setIsGenerating(false);
      setUploadProgress(0);
      setTimeout(() => setWorkflow(null), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full w-full pb-10">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">Generate Workspace</h1>
        <p className="text-slate-400">Design, prototype, and build with multiple AI models in one cohesive interface.</p>
      </div>

      {/* Asset Type Selector */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {assetTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`flex items-center gap-3 px-6 py-4 rounded-[20px] transition-all duration-300 min-w-[160px] border relative overflow-hidden group ${
              selectedType === type.id
                ? 'border-indigo-500/50 bg-[#111827]/80 shadow-[0_0_30px_rgba(99,102,241,0.15)]'
                : 'border-white/5 bg-[#111827]/40 hover:bg-[#111827]/60'
            }`}
          >
            {selectedType === type.id && (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
            )}
            <div className={`p-2.5 rounded-xl ${type.bg} relative z-10 transition-transform group-hover:scale-110`}>
              <type.icon className={`w-5 h-5 ${type.color}`} />
            </div>
            <span className={`font-semibold relative z-10 ${selectedType === type.id ? 'text-white' : 'text-slate-400'}`}>
              {type.name}
            </span>
          </button>
        ))}
      </div>

      {/* Main Grid Workspace */}
      {selectedType === 'audio' ? (
        <div className="flex flex-col lg:flex-row gap-8 w-full min-h-[500px]">
           <div className="w-full lg:w-[400px] shrink-0 space-y-6">
              <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] backdrop-blur-xl p-6 shadow-xl">
                 <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                       <Volume2 className="w-5 h-5 text-emerald-400" />
                       Audio Settings
                    </h2>
                 </div>

                 <div className="space-y-6">
                    <div>
                       <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Language</label>
                       <div className="grid grid-cols-2 gap-2">
                          {['English', 'Hindi', 'Telugu', 'Tamil'].map(l => (
                            <button
                              key={l}
                              onClick={() => setAudioLanguage(l)}
                              className={cn(
                                "px-3 py-2 text-sm rounded-lg transition-colors border",
                                audioLanguage === l 
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                                  : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              {l}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div>
                       <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Voice Profile</label>
                       <div className="flex gap-2">
                          {['Female', 'Male'].map(v => (
                            <button
                              key={v}
                              onClick={() => setVoice(v)}
                              className={cn(
                                "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors border text-center",
                                voice === v 
                                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" 
                                  : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              {v}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div>
                          <div className="flex justify-between items-center mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                             <label>Speed</label>
                             <span className="text-emerald-400">{speed}x</span>
                          </div>
                          <input 
                             type="range" min="0.5" max="2" step="0.1" 
                             value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}
                             className="w-full accent-emerald-500"
                          />
                       </div>
                       
                       <div>
                          <div className="flex justify-between items-center mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                             <label>Pitch</label>
                             <span className="text-indigo-400">{pitch}</span>
                          </div>
                          <input 
                             type="range" min="0.5" max="2" step="0.1" 
                             value={pitch} onChange={(e) => setPitch(parseFloat(e.target.value))}
                             className="w-full accent-indigo-500"
                          />
                       </div>

                       <div>
                          <div className="flex justify-between items-center mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                             <label>Volume</label>
                             <span className="text-purple-400">{volume}</span>
                          </div>
                          <input 
                             type="range" min="0" max="1" step="0.1" 
                             value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
                             className="w-full accent-purple-500"
                          />
                       </div>
                    </div>
                    
                    <div className="pt-4 border-t border-white/5">
                       <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Model</span>
                          <span className="text-slate-300 font-medium flex items-center gap-1">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                             Gemini TTS (Pro)
                          </span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex-1 flex flex-col gap-6">
              <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] backdrop-blur-xl p-6 shadow-xl flex flex-col relative group transition-all focus-within:border-emerald-500/50 focus-within:bg-white/[0.04]">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">What should the AI speak?</label>
                 <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter text to convert to speech..."
                    className="w-full h-32 bg-transparent text-lg text-white placeholder-slate-600 focus:outline-none resize-none custom-scrollbar"
                 />
                 <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-slate-500">{prompt.length} chars</span>
                    <button 
                       onClick={handleGenerateAudio}
                       disabled={!prompt.trim() || ['thinking', 'generating', 'formatting'].includes(audioStatus)}
                       className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                       {['thinking', 'generating', 'formatting'].includes(audioStatus) ? (
                         <>
                           <Loader2 className="w-4 h-4 animate-spin" />
                           {audioStatus === 'thinking' && 'Preparing...'}
                           {audioStatus === 'generating' && 'Generating Voice...'}
                           {audioStatus === 'formatting' && 'Uploading...'}
                         </>
                       ) : (
                         <>
                           <Mic className="w-4 h-4" />
                           Generate Audio
                         </>
                       )}
                    </button>
                 </div>
              </div>

              {audioErrorMsg && (
                 <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {audioErrorMsg}
                 </div>
              )}

              {generatedAudioUrl && (
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#111827]/40 border border-white/5 rounded-[24px] backdrop-blur-xl shadow-xl overflow-hidden flex flex-col"
                 >
                    <div className="px-6 py-6 flex flex-col items-center justify-center gap-6 bg-black/20">
                       <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center relative">
                          <Volume2 className="w-10 h-10 text-emerald-400" />
                          <div className="absolute inset-0 rounded-full animate-ping border border-emerald-500/50 opacity-20"></div>
                       </div>
                       
                       <audio controls src={generatedAudioUrl || undefined} className="w-full max-w-md accent-emerald-500 outline-none" />
                    </div>
                    
                    <div className="p-4 border-t border-white/5 bg-black/40 flex items-center justify-end gap-3">
                       <a
                         href={generatedAudioUrl}
                         download={`audio-${Date.now()}.wav`}
                         target="_blank" rel="noopener noreferrer"
                         className="p-2 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm mr-auto"
                       >
                         <Download className="w-4 h-4" /> Download WAV
                       </a>
                       
                       <button
                         onClick={handleGenerateAudio}
                         disabled={['thinking', 'generating', 'formatting'].includes(audioStatus)}
                         className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                         title="Regenerate"
                       >
                         <RotateCw className="w-4 h-4" />
                       </button>
                       <button
                         onClick={handleClearAudio}
                         className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                         title="Clear"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                 </motion.div>
              )}
           </div>
        </div>
      ) : selectedType === 'video' ? (
        <div className="flex flex-col lg:flex-row gap-8 w-full min-h-[500px]">
           {/* Controls panel */}
           <div className="w-full lg:w-[400px] shrink-0 space-y-6">
              <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] backdrop-blur-xl p-6 shadow-xl">
                 <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                       <Sparkles className="w-5 h-5 text-purple-400" />
                       Animation Settings
                    </h2>
                 </div>
                 
                 <div className="space-y-6">
                    {videoProvider === 'ffmpeg' ? (
                       <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Animation Style</label>
                          <select 
                              value={videoAnimation} 
                              onChange={(e) => setVideoAnimation(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-purple-500/50 appearance-none"
                          >
                             {VIDEO_ANIMATIONS.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                       </div>
                    ) : (
                       <>
                          <div>
                             <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">AI Motion Prompt</label>
                             <textarea 
                                value={videoPrompt}
                                onChange={(e) => setVideoPrompt(e.target.value)}
                                placeholder="Describe how the image should move...

Examples:
• Make the ocean waves move naturally while the camera slowly zooms in.
• The red sports car drives toward the sunset while the camera follows it."
                                className="w-full h-32 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-purple-500/50 resize-none custom-scrollbar"
                             />
                          </div>

                          <div className="pt-4 border-t border-white/5">
                             <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 block">Advanced Options</label>
                             
                             <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                   <label className="text-[10px] uppercase text-slate-500 mb-2 block">Motion Strength</label>
                                   <select 
                                       value={motionStrength} 
                                       onChange={(e) => setMotionStrength(e.target.value)}
                                       className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500/50 appearance-none"
                                   >
                                      {MOTION_STRENGTHS.map(v => <option key={v} value={v}>{v}</option>)}
                                   </select>
                                </div>
                                <div>
                                   <label className="text-[10px] uppercase text-slate-500 mb-2 block">Camera Motion</label>
                                   <select 
                                       value={cameraMotion} 
                                       onChange={(e) => setCameraMotion(e.target.value)}
                                       className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500/50 appearance-none"
                                   >
                                      {CAMERA_MOTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                                   </select>
                                </div>
                             </div>
                             
                             <div>
                                <label className="text-[10px] uppercase text-slate-500 mb-2 block">Seed (Optional)</label>
                                <input 
                                   type="number" 
                                   value={videoSeed}
                                   onChange={(e) => setVideoSeed(e.target.value)}
                                   placeholder="Random by default"
                                   className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500/50"
                                />
                             </div>
                          </div>
                       </>
                    )}

                    <div>
                       <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Duration</label>
                       <div className="grid grid-cols-4 gap-2">
                          {['3', '5', '8', '10'].map(d => (
                            <button
                              key={d}
                              onClick={() => setVideoDuration(d)}
                              className={cn(
                                "py-2 text-sm font-medium rounded-lg transition-colors border text-center",
                                videoDuration === d
                                   ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                   : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              {d}s
                            </button>
                          ))}
                       </div>
                    </div>
                    
                    <div>
                       <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Resolution & FPS</label>
                       <div className="grid grid-cols-2 gap-4">
                           <select 
                               value={videoResolution} 
                               onChange={(e) => setVideoResolution(e.target.value)}
                               className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-purple-500/50 appearance-none"
                           >
                              <option value="720p">720p</option>
                              <option value="1080p">1080p</option>
                           </select>
                           <select 
                               value={videoFps} 
                               onChange={(e) => setVideoFps(e.target.value)}
                               className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-purple-500/50 appearance-none"
                           >
                              <option value="24">24 FPS</option>
                              <option value="30">30 FPS</option>
                           </select>
                       </div>
                    </div>

                    <div>
                       <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Video Provider</label>
                       <div className="flex flex-col gap-3">
                          <button
                            onClick={() => setVideoProvider('ffmpeg')}
                            className={cn(
                              "p-4 rounded-xl border text-left transition-all",
                              videoProvider === 'ffmpeg'
                                ? "bg-purple-500/20 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                                : "bg-black/40 border-white/10 hover:border-white/20 hover:bg-black/60"
                            )}
                          >
                             <div className="flex justify-between items-center mb-1">
                                <span className={cn("font-medium", videoProvider === 'ffmpeg' ? "text-purple-300" : "text-slate-200")}>FFmpeg Cinematic</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white">FREE</span>
                             </div>
                             <p className="text-xs text-slate-500">Fast local cinematic animation. Always available.</p>
                          </button>
                          
                          <button
                            onClick={() => setVideoProvider('huggingface')}
                            className={cn(
                              "p-4 rounded-xl border text-left transition-all relative overflow-hidden",
                              videoProvider === 'huggingface'
                                ? "bg-purple-500/20 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                                : "bg-black/40 border-white/10 hover:border-white/20 hover:bg-black/60"
                            )}
                          >
                             {videoProvider === 'huggingface' && <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent pointer-events-none" />}
                             <div className="flex justify-between items-center mb-1 relative z-10">
                                <span className={cn("font-medium", videoProvider === 'huggingface' ? "text-purple-300" : "text-slate-200")}>Hugging Face AI</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">AI BETA</span>
                             </div>
                             <p className="text-xs text-slate-500 relative z-10">AI Image-to-Video generation powered by Hugging Face.</p>
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex-1 flex flex-col gap-6">
              <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] backdrop-blur-xl p-6 shadow-xl flex flex-col relative group transition-all focus-within:border-purple-500/50 focus-within:bg-white/[0.04]">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Select Source Image</label>
                 
                 <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                     {imageAssets.length === 0 ? (
                        <div className="w-full text-center p-8 text-slate-500 border border-dashed border-white/10 rounded-xl">
                            No generated images found in library. Generate an image first!
                        </div>
                     ) : (
                         imageAssets.map(asset => (
                             <button
                                 key={asset.id}
                                 onClick={() => setSelectedImageId(asset.id)}
                                 className={cn(
                                     "relative shrink-0 w-32 h-32 rounded-xl overflow-hidden border-2 transition-all",
                                     selectedImageId === asset.id ? "border-purple-500" : "border-transparent opacity-60 hover:opacity-100"
                                 )}
                             >
                                 <img src={asset.resultUrl} className="w-full h-full object-cover" />
                                 {selectedImageId === asset.id && (
                                     <div className="absolute top-2 right-2 bg-purple-500 text-white rounded-full p-1">
                                         <CheckCircle2 className="w-4 h-4" />
                                     </div>
                                 )}
                             </button>
                         ))
                     )}
                 </div>

                 <div className="flex justify-end items-center mt-4">
                    <button 
                       onClick={handleGenerateVideo}
                       disabled={!selectedImageId || ['thinking', 'generating', 'formatting'].includes(videoStatus)}
                       className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/20"
                    >
                       {['thinking', 'generating', 'formatting'].includes(videoStatus) ? (
                         <>
                           <Loader2 className="w-4 h-4 animate-spin" />
                           {videoStage || 'Processing...'}
                         </>
                       ) : (
                         <>
                           <Video className="w-4 h-4" />
                           Generate MP4
                         </>
                       )}
                    </button>
                 </div>
              </div>

              {videoErrorMsg && (
                 <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {videoErrorMsg}
                 </div>
              )}
              {fallbackMessage && selectedType === 'video' && (
                 <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> {fallbackMessage}
                 </div>
              )}

              {generatedVideoUrl && (
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#111827]/40 border border-white/5 rounded-[24px] backdrop-blur-xl shadow-xl overflow-hidden flex flex-col"
                 >
                    <div className="p-4 flex flex-col items-center justify-center gap-6 bg-black/20 relative">
                       <video controls src={generatedVideoUrl || undefined} className="w-full max-h-[500px] rounded-xl outline-none" autoPlay loop playsInline />
                    </div>
                    
                    <div className="p-4 border-t border-white/5 bg-black/40 flex items-center justify-end gap-3">
                       <a
                         href={generatedVideoUrl}
                         download={`animation-${Date.now()}.mp4`}
                         target="_blank" rel="noopener noreferrer"
                         className="p-2 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm mr-auto"
                       >
                         <Download className="w-4 h-4" /> Download MP4
                       </a>
                       
                       <button
                         onClick={handleGenerateVideo}
                         disabled={['thinking', 'generating', 'formatting'].includes(videoStatus)}
                         className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                         title="Regenerate"
                       >
                         <RotateCw className="w-4 h-4" />
                       </button>
                       <button
                         onClick={handleClearVideo}
                         className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                         title="Clear"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                 </motion.div>
              )}
           </div>
        </div>
      ) : selectedType === 'text' ? (
        <div className="flex flex-col lg:flex-row gap-8 w-full min-h-[500px]">
           {/* Controls panel */}
           <div className="w-full lg:w-[400px] shrink-0 space-y-6">
              <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] backdrop-blur-xl p-6 shadow-xl">
                 <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                       <Sparkles className="w-5 h-5 text-purple-400" />
                       Generation Settings
                    </h2>
                 </div>

                 <div className="space-y-6">
                    <div>
                       <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Category</label>
                       <div className="flex flex-wrap gap-2">
                          {CATEGORIES.map(c => (
                            <button
                              key={c}
                              onClick={() => setCategory(c)}
                              className={cn(
                                "px-3 py-1.5 text-sm rounded-lg transition-colors border",
                                category === c 
                                  ? "bg-purple-500/20 text-purple-300 border-purple-500/30" 
                                  : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              {c}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div>
                       <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Tone</label>
                       <div className="flex flex-wrap gap-2">
                          {TONES.map(t => (
                            <button
                              key={t}
                              onClick={() => setTone(t)}
                              className={cn(
                                "px-3 py-1.5 text-sm rounded-lg transition-colors border",
                                tone === t 
                                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" 
                                  : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              {t}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div>
                       <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Length</label>
                       <div className="flex gap-2">
                          {LENGTHS.map(l => (
                            <button
                              key={l}
                              onClick={() => setLength(l)}
                              className={cn(
                                "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors border text-center",
                                length === l 
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                                  : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              {l}
                            </button>
                          ))}
                       </div>
                    </div>
                    
                    <div className="pt-4 border-t border-white/5">
                       <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Model</span>
                          <span className="text-slate-300 font-medium flex items-center gap-1">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                             Gemini 2.5 Flash
                          </span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Main editor area */}
           <div className="flex-1 flex flex-col gap-6">
              <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] backdrop-blur-xl p-6 shadow-xl flex flex-col relative group transition-all focus-within:border-indigo-500/50 focus-within:bg-white/[0.04]">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Prompt</label>
                 <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to write..."
                    className="w-full h-32 bg-transparent text-lg text-white placeholder-slate-600 focus:outline-none resize-none custom-scrollbar"
                 />
                 <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-slate-500">{prompt.length} chars</span>
                    <button 
                       onClick={handleGenerateText}
                       disabled={!prompt.trim() || ['thinking', 'generating', 'formatting'].includes(textStatus)}
                       className="px-6 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                       {['thinking', 'generating', 'formatting'].includes(textStatus) ? (
                         <>
                           <Loader2 className="w-4 h-4 animate-spin" />
                           {textStatus === 'thinking' && 'Thinking...'}
                           {textStatus === 'generating' && 'Generating...'}
                           {textStatus === 'formatting' && 'Formatting...'}
                         </>
                       ) : (
                         <>
                           <Wand2 className="w-4 h-4" />
                           Generate Text
                         </>
                       )}
                    </button>
                 </div>
              </div>

              {textErrorMsg && (
                 <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {textErrorMsg}
                 </div>
              )}

              {generatedText && (
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#111827]/40 border border-white/5 rounded-[24px] backdrop-blur-xl shadow-xl overflow-hidden flex flex-col flex-1 min-h-[400px]"
                 >
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                       <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5"><Type className="w-3.5 h-3.5" /> {generatedText.split(/\s+/).filter(Boolean).length} words</span>
                          <span className="flex items-center gap-1.5"><AlignLeft className="w-3.5 h-3.5" /> {generatedText.length} chars</span>
                          <span className="flex items-center gap-1.5 text-indigo-400"><History className="w-3.5 h-3.5" /> {Math.max(1, Math.ceil(generatedText.split(/\s+/).filter(Boolean).length / 200))} min read</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <button 
                            onClick={handleCopyText}
                            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                            title="Copy to clipboard"
                          >
                            {textCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={handleDownloadText}
                            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                            title="Download .txt"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <div className="w-px h-4 bg-white/10 mx-1"></div>
                          <button 
                            onClick={handleClearText}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                            title="Clear"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                    
                    <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-[#09090B]/50">
                       <div className="max-w-none text-[15px]">
                          {generatedText.split('\n').map((paragraph, i) => (
                             <p key={i} className="mb-4 text-slate-300 leading-relaxed whitespace-pre-wrap">{paragraph}</p>
                          ))}
                       </div>
                    </div>
                    
                    <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-end gap-3">
                       <button
                         onClick={handleGenerateText}
                         disabled={['thinking', 'generating', 'formatting'].includes(textStatus)}
                         className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
                       >
                         <RotateCw className="w-4 h-4" />
                         Regenerate
                       </button>
                       <button
                         onClick={handleSaveTextToHistory}
                         disabled={textSaved}
                         className={cn(
                           "px-4 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 text-sm",
                           textSaved ? "bg-emerald-500/20 text-emerald-400" : "bg-indigo-500 hover:bg-indigo-600 text-white"
                         )}
                       >
                         {textSaved ? (
                           <>
                             <CheckCircle2 className="w-4 h-4" />
                             Saved to History
                           </>
                         ) : (
                           <>
                             <Save className="w-4 h-4" />
                             Save to History
                           </>
                         )}
                       </button>
                    </div>
                 </motion.div>
              )}
           </div>
        </div>
      ) : (

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[500px]">
        {/* Left Column - Prompt Editor & Settings */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col bg-[#111827]/40 border border-white/5 rounded-[24px] backdrop-blur-xl p-6 shadow-2xl flex-1 relative overflow-hidden"
          >
            {/* Editor Header */}
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-display font-semibold text-white">Prompt Canvas</h2>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
                  Genblaze SDK
                </span>
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                  {selectedProvider === 'huggingface' ? 'Flux.1' : 'Pollinations'}
                </span>
              </div>
            </div>

            {/* Prompt Input Area */}
            <div className="flex-1 flex flex-col relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your vision in high detail. Be specific about lighting, camera angles, colors, and mood..."
                className="w-full flex-1 min-h-[160px] bg-transparent border-none text-white placeholder:text-slate-500 focus:ring-0 focus:outline-none resize-none text-lg md:text-xl leading-relaxed h-full"
              />
            </div>
            
            {/* Action Bar */}
            <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <button className="p-2.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors tooltip-trigger" title="Randomize Seed">
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
                <button className="p-2.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors tooltip-trigger" title="Image to Image">
                  <ImagePlus className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={isGenerating || (selectedProvider === 'huggingface' && !isPremiumUnlocked) || !prompt.trim()}
                className={`relative overflow-hidden flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-xl
                  ${isGenerating 
                    ? 'bg-[#111827] border border-white/10 text-slate-400 cursor-wait' 
                    : (!prompt.trim() || (selectedProvider === 'huggingface' && !isPremiumUnlocked))
                      ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                      : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-[position:100%_0] text-white shadow-indigo-500/25 hover:-translate-y-0.5'
                  }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                    <span>Processing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Media</span>
                    <Sparkles className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Feedback & Progress Section (Appears conditionally) */}
          <AnimatePresence>
            {(workflow || uploadProgress > 0 || generatedImageUrl || error || success || fallbackMessage) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#111827]/60 border border-white/5 rounded-[24px] backdrop-blur-xl p-6 shadow-xl"
              >
                {error && <p className="text-red-400 text-sm font-medium flex items-center gap-2"><X className="w-4 h-4"/> {error}</p>}
                {success && <p className="text-emerald-400 text-sm font-medium flex items-center gap-2"><Check className="w-4 h-4"/> Generation saved successfully.</p>}
                {fallbackMessage && <p className="text-amber-400 text-sm font-medium flex items-center gap-2 mt-2"><Sparkles className="w-4 h-4"/> {fallbackMessage}</p>}

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full mt-4">
                    <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2 uppercase tracking-widest">
                      <span>Uploading to secure vault</span>
                      <span className="text-indigo-400">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/5">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}

                {workflow && (
                  <div className="w-full mt-4 bg-black/30 rounded-xl border border-white/5 p-4 shadow-inner">
                    <h4 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${workflow.status === 'active' ? 'bg-indigo-400 animate-pulse' : workflow.status === 'failed' ? 'bg-red-400' : 'bg-emerald-400'}`}></div>
                      Pipeline: {workflow.name}
                    </h4>
                    <div className="space-y-3">
                      {workflow.steps.map((step, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          key={step.id} 
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-3">
                            {step.status === 'completed' && <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center"><Check className="w-3 h-3 text-emerald-400" /></div>}
                            {step.status === 'running' && <div className="w-5 h-5 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />}
                            {step.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-white/10" />}
                            {step.status === 'failed' && <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center"><X className="w-3 h-3 text-red-400" /></div>}
                            
                            <span className={`font-medium ${step.status === 'completed' ? 'text-slate-300' : step.status === 'running' ? 'text-indigo-300' : 'text-slate-500'}`}>
                              {step.name}
                            </span>
                          </div>
                          {step.model && (
                            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded bg-white/5 text-slate-400 border border-white/5">
                              {step.model}
                            </span>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {generatedImageUrl && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full mt-6 rounded-[20px] overflow-hidden border border-white/10 relative shadow-2xl group"
                  >
                    <img src={generatedImageUrl || undefined} alt={prompt} className="w-full h-auto object-cover max-h-[600px] transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column - Model Selection & Parameters */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Provider Selection */}
          <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] backdrop-blur-xl p-6 shadow-xl">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-6">
              <Settings2 className="w-4 h-4" /> Provider
            </h3>
            
            <div className="space-y-3">
              <div 
                onClick={() => setSelectedProvider('pollinations')}
                className={`p-4 rounded-[16px] border cursor-pointer transition-all ${
                  selectedProvider === 'pollinations' 
                    ? 'border-indigo-500/50 bg-indigo-500/10' 
                    : 'border-white/5 bg-black/20 hover:bg-black/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white">Pollinations AI</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">Free</span>
                </div>
                <p className="text-xs text-slate-400">Fast, community-driven image generation.</p>
              </div>

              <div 
                onClick={() => setSelectedProvider('huggingface')}
                className={`p-4 rounded-[16px] border cursor-pointer transition-all ${
                  selectedProvider === 'huggingface' 
                    ? 'border-purple-500/50 bg-purple-500/10' 
                    : 'border-white/5 bg-black/20 hover:bg-black/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white flex items-center gap-2">
                    Hugging Face 
                    {isPremiumUnlocked ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/20">Premium</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">High-quality FLUX.1 models via Serverless APIs.</p>

                <AnimatePresence>
                  {selectedProvider === 'huggingface' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-black/40 p-4 rounded-xl border border-white/5 mt-3 backdrop-blur-md">
                        {isPremiumUnlocked ? (
                          <div className="flex items-center gap-2 text-emerald-400">
                            <Unlock className="w-4 h-4" />
                            <span className="text-sm font-medium">Premium Enabled</span>
                            <Check className="w-4 h-4 ml-auto" />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Access Key</label>
                            <div className="flex gap-2">
                              <input 
                                type="password" 
                                value={accessCode} 
                                onChange={(e) => setAccessCode(e.target.value)} 
                                placeholder="Enter code..."
                                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                              />
                              <button 
                                onClick={verifyAccessCode} 
                                disabled={isVerifyingCode || !accessCode.trim()} 
                                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                              >
                                {isVerifyingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unlock'}
                              </button>
                            </div>
                            {accessCodeError && (
                              <div className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
                                <X className="w-3.5 h-3.5" />
                                {accessCodeError}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Advanced Parameters */}
          <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] backdrop-blur-xl p-6 shadow-xl flex-1">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-6">
              <SlidersHorizontal className="w-4 h-4" /> Parameters
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                  {['1:1', '16:9', '9:16'].map(ratio => (
                    <button 
                      key={ratio} 
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-2 border rounded-xl text-sm font-medium transition-colors ${
                        aspectRatio === ratio
                          ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                          : 'border-white/10 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Negative Prompt</label>
                <input 
                  type="text" 
                  placeholder="ugly, blurry, low res..." 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Seed</label>
                <input 
                  type="number" 
                  placeholder="Random" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
      )}
    </div>
  );
};
