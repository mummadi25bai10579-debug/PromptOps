import { WorkflowTemplate } from '../types/workflow';

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'template-youtube-thumbnail',
    name: 'YouTube Thumbnail Creator',
    description: 'Generates high-CTR 16:9 thumbnail concepts, upscales resolution, and backs up directly to Backblaze B2.',
    category: 'Video & Creator',
    iconName: 'Youtube',
    nodes: [
      {
        id: 'node-1',
        type: 'promptInput',
        position: { x: 50, y: 150 },
        data: {
          title: 'Thumbnail Concept',
          description: 'Initial video topic & title idea',
          nodeType: 'promptInput',
          status: 'idle',
          params: {
            promptText: 'Cyberpunk Sci-Fi Podcast Episode 42: The Future of Quantum AI',
            systemPrompt: 'High CTR thumbnail concept'
          }
        }
      },
      {
        id: 'node-2',
        type: 'textGen',
        position: { x: 380, y: 150 },
        data: {
          title: 'Visual Prompt Optimizer',
          description: 'Converts topic into FLUX image prompt',
          nodeType: 'textGen',
          status: 'idle',
          params: {
            textCategory: 'Summary',
            textTone: 'Creative',
            textLength: 'Short'
          }
        }
      },
      {
        id: 'node-3',
        type: 'imageGen',
        position: { x: 710, y: 150 },
        data: {
          title: 'FLUX Thumbnail Render',
          description: 'Generates 16:9 ultra-detail graphic',
          nodeType: 'imageGen',
          status: 'idle',
          params: {
            imageAspect: '16:9',
            imageProvider: 'pollinations',
            imageStyle: 'Cinematic'
          }
        }
      },
      {
        id: 'node-4',
        type: 'imageUpscale',
        position: { x: 1040, y: 150 },
        data: {
          title: '2x Resolution Upscale',
          description: 'Sharpens details and removes noise',
          nodeType: 'imageUpscale',
          status: 'idle',
          params: {
            upscaleFactor: '2x',
            enhanceDetail: true
          }
        }
      },
      {
        id: 'node-5',
        type: 'storage',
        position: { x: 1370, y: 150 },
        data: {
          title: 'B2 Cloud Backup',
          description: 'Saves directly to Backblaze B2 Bucket',
          nodeType: 'storage',
          status: 'idle',
          params: {
            storageTarget: 'backblaze_b2',
            autoShare: true
          }
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
      { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
      { id: 'e3-4', source: 'node-3', target: 'node-4', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
      { id: 'e4-5', source: 'node-4', target: 'node-5', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } }
    ]
  },
  {
    id: 'template-social-campaign',
    name: 'Social Media Campaign',
    description: 'Creates marketing post copy and matching 1:1 promo visual in parallel.',
    category: 'Marketing',
    iconName: 'Share2',
    nodes: [
      {
        id: 'node-1',
        type: 'promptInput',
        position: { x: 50, y: 200 },
        data: {
          title: 'Campaign Objective',
          description: 'Product feature or release highlight',
          nodeType: 'promptInput',
          status: 'idle',
          params: {
            promptText: 'Announcing PromptOps AI Workflow Builder: Drag & Drop Multi-Model AI Pipelines',
          }
        }
      },
      {
        id: 'node-2',
        type: 'textGen',
        position: { x: 380, y: 80 },
        data: {
          title: 'LinkedIn & Post Copy',
          description: 'Engaging social media caption',
          nodeType: 'textGen',
          status: 'idle',
          params: {
            textCategory: 'Social',
            textTone: 'Professional',
            textLength: 'Medium'
          }
        }
      },
      {
        id: 'node-3',
        type: 'imageGen',
        position: { x: 380, y: 320 },
        data: {
          title: '1:1 Campaign Banner',
          description: 'Square high-tech promotional graphic',
          nodeType: 'imageGen',
          status: 'idle',
          params: {
            imageAspect: '1:1',
            imageProvider: 'pollinations'
          }
        }
      },
      {
        id: 'node-4',
        type: 'storage',
        position: { x: 720, y: 320 },
        data: {
          title: 'Save to B2 Vault',
          description: 'Stores banner image in cloud storage',
          nodeType: 'storage',
          status: 'idle',
          params: {
            storageTarget: 'backblaze_b2'
          }
        }
      },
      {
        id: 'node-5',
        type: 'notification',
        position: { x: 720, y: 80 },
        data: {
          title: 'Team Notification',
          description: 'Alerts marketing channel',
          nodeType: 'notification',
          status: 'idle',
          params: {
            notificationChannel: 'in_app',
            notificationMessage: 'New Social Campaign Copy & Visual Ready for Review!'
          }
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
      { id: 'e1-3', source: 'node-1', target: 'node-3', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
      { id: 'e3-4', source: 'node-3', target: 'node-4', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
      { id: 'e2-5', source: 'node-2', target: 'node-5', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } }
    ]
  },
  {
    id: 'template-product-ad',
    name: 'Product Advertisement',
    description: 'Generates product photography and transforms static image into cinematic video animation.',
    category: 'Advertising',
    iconName: 'Sparkles',
    nodes: [
      {
        id: 'node-1',
        type: 'promptInput',
        position: { x: 50, y: 180 },
        data: {
          title: 'Product Vision',
          description: 'Detailed description of product shot',
          nodeType: 'promptInput',
          status: 'idle',
          params: {
            promptText: 'Luxury matte black wireless headphones rest on smooth wet river stones with soft rim lighting'
          }
        }
      },
      {
        id: 'node-2',
        type: 'imageGen',
        position: { x: 380, y: 180 },
        data: {
          title: 'Master Photo Render',
          description: 'High-end 16:9 product render',
          nodeType: 'imageGen',
          status: 'idle',
          params: {
            imageAspect: '16:9',
            imageProvider: 'pollinations'
          }
        }
      },
      {
        id: 'node-3',
        type: 'videoGen',
        position: { x: 710, y: 180 },
        data: {
          title: 'Motion Video Synthesis',
          description: 'Applies FFmpeg cinematic slow zoom',
          nodeType: 'videoGen',
          status: 'idle',
          params: {
            videoAnimation: 'Zoom In',
            videoDuration: 5,
            videoResolution: '1080p',
            videoFps: 30
          }
        }
      },
      {
        id: 'node-4',
        type: 'storage',
        position: { x: 1040, y: 180 },
        data: {
          title: 'B2 Video Vault',
          description: 'Persists mp4 asset in Backblaze B2',
          nodeType: 'storage',
          status: 'idle',
          params: {
            storageTarget: 'backblaze_b2'
          }
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
      { id: 'e2-3', source: 'node-3', target: 'node-3', animated: true, style: { stroke: '#a855f7', strokeWidth: 2 } },
      { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true, style: { stroke: '#a855f7', strokeWidth: 2 } },
      { id: 'e3-4', source: 'node-3', target: 'node-4', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } }
    ]
  },
  {
    id: 'template-podcast-generator',
    name: 'Podcast Generator',
    description: 'Generates intro monologue with Gemini, converts script into natural voice audio, and uploads mp3/wav.',
    category: 'Audio & Voices',
    iconName: 'Mic',
    nodes: [
      {
        id: 'node-1',
        type: 'promptInput',
        position: { x: 50, y: 180 },
        data: {
          title: 'Podcast Topic',
          description: 'Theme & guest introduction',
          nodeType: 'promptInput',
          status: 'idle',
          params: {
            promptText: 'Welcome to FutureTech Daily. Today we examine neural architectures and autonomous AI workflows.'
          }
        }
      },
      {
        id: 'node-2',
        type: 'textGen',
        position: { x: 380, y: 180 },
        data: {
          title: 'Script Writer (Gemini)',
          description: 'Generates spoken dialogue script',
          nodeType: 'textGen',
          status: 'idle',
          params: {
            textCategory: 'Script',
            textTone: 'Professional',
            textLength: 'Short'
          }
        }
      },
      {
        id: 'node-3',
        type: 'audioGen',
        position: { x: 710, y: 180 },
        data: {
          title: 'Gemini Voice Synthesis',
          description: 'Converts script into natural speech',
          nodeType: 'audioGen',
          status: 'idle',
          params: {
            audioVoice: 'Female',
            audioLanguage: 'English'
          }
        }
      },
      {
        id: 'node-4',
        type: 'storage',
        position: { x: 1040, y: 180 },
        data: {
          title: 'Save Audio File',
          description: 'Stores audio stream to B2 bucket',
          nodeType: 'storage',
          status: 'idle',
          params: {
            storageTarget: 'backblaze_b2'
          }
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
      { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } },
      { id: 'e3-4', source: 'node-3', target: 'node-4', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } }
    ]
  },
  {
    id: 'template-ai-video-creator',
    name: 'AI Video Creator',
    description: 'Complete text-to-image-to-video workflow: script generation -> image prompt -> video animation -> cloud storage.',
    category: 'Video Production',
    iconName: 'Video',
    nodes: [
      {
        id: 'node-1',
        type: 'promptInput',
        position: { x: 50, y: 180 },
        data: {
          title: 'Movie Scene Concept',
          description: 'Storyline & key visual motif',
          nodeType: 'promptInput',
          status: 'idle',
          params: {
            promptText: 'A futuristic samurai standing atop a skyscraper overlooking a neon glowing city during a monsoon rain'
          }
        }
      },
      {
        id: 'node-2',
        type: 'textGen',
        position: { x: 380, y: 180 },
        data: {
          title: 'Cinematic Prompt Enhancer',
          description: 'Enriches lighting, camera angle, and detail',
          nodeType: 'textGen',
          status: 'idle',
          params: {
            textCategory: 'Blog',
            textTone: 'Creative',
            textLength: 'Short'
          }
        }
      },
      {
        id: 'node-3',
        type: 'imageGen',
        position: { x: 710, y: 180 },
        data: {
          title: 'Keyframe Image Generation',
          description: 'Renders 16:9 8K base frame',
          nodeType: 'imageGen',
          status: 'idle',
          params: {
            imageAspect: '16:9',
            imageProvider: 'pollinations'
          }
        }
      },
      {
        id: 'node-4',
        type: 'videoGen',
        position: { x: 1040, y: 180 },
        data: {
          title: 'FFmpeg Motion Animator',
          description: 'Pan Right camera movement at 30 fps',
          nodeType: 'videoGen',
          status: 'idle',
          params: {
            videoAnimation: 'Pan Right',
            videoDuration: 5,
            videoResolution: '1080p'
          }
        }
      },
      {
        id: 'node-5',
        type: 'storage',
        position: { x: 1370, y: 180 },
        data: {
          title: 'Cloud Vault Storage',
          description: 'Persists MP4 in Backblaze B2',
          nodeType: 'storage',
          status: 'idle',
          params: {
            storageTarget: 'backblaze_b2'
          }
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
      { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
      { id: 'e3-4', source: 'node-3', target: 'node-4', animated: true, style: { stroke: '#a855f7', strokeWidth: 2 } },
      { id: 'e4-5', source: 'node-4', target: 'node-5', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } }
    ]
  },
  {
    id: 'template-blog-pipeline',
    name: 'Blog Content Pipeline',
    description: 'Generates article outline, writes full text, creates featured header artwork, and stores assets.',
    category: 'Publishing',
    iconName: 'FileText',
    nodes: [
      {
        id: 'node-1',
        type: 'promptInput',
        position: { x: 50, y: 200 },
        data: {
          title: 'Article Topic',
          description: 'Core theme and target audience',
          nodeType: 'promptInput',
          status: 'idle',
          params: {
            promptText: 'Mastering Multi-Model AI Workflows for Modern Content Creators in 2026'
          }
        }
      },
      {
        id: 'node-2',
        type: 'textGen',
        position: { x: 380, y: 80 },
        data: {
          title: 'Outline Generator',
          description: 'Structured section outline',
          nodeType: 'textGen',
          status: 'idle',
          params: {
            textCategory: 'Blog',
            textTone: 'Professional',
            textLength: 'Short'
          }
        }
      },
      {
        id: 'node-3',
        type: 'textGen',
        position: { x: 710, y: 80 },
        data: {
          title: 'Full Article Writer',
          description: 'Writes complete engaging blog post',
          nodeType: 'textGen',
          status: 'idle',
          params: {
            textCategory: 'Blog',
            textTone: 'Professional',
            textLength: 'Medium'
          }
        }
      },
      {
        id: 'node-4',
        type: 'imageGen',
        position: { x: 380, y: 320 },
        data: {
          title: 'Header Graphic',
          description: 'Featured 16:9 blog banner',
          nodeType: 'imageGen',
          status: 'idle',
          params: {
            imageAspect: '16:9',
            imageProvider: 'pollinations'
          }
        }
      },
      {
        id: 'node-5',
        type: 'storage',
        position: { x: 710, y: 320 },
        data: {
          title: 'Store Header Image',
          description: 'Backup image to B2 storage',
          nodeType: 'storage',
          status: 'idle',
          params: {
            storageTarget: 'backblaze_b2'
          }
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
      { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
      { id: 'e1-4', source: 'node-1', target: 'node-4', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
      { id: 'e4-5', source: 'node-4', target: 'node-5', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } }
    ]
  }
];
