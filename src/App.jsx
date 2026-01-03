import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Upload, 
  FileImage, 
  FileVideo, 
  PenTool, 
  Check, 
  Copy, 
  RefreshCw, 
  Trash2, 
  Download, 
  Wand2, 
  HelpCircle, 
  Moon, 
  Sun,
  X,
  Loader2,
  AlertCircle,
  LayoutGrid,
  Maximize2,
  Info,
  Zap,
  ZapOff,
  Plus,
  Brain,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Server,
  Sparkles,
  Scale,
  FileText,
  Bell,
  BellOff,
  Shield,
  Tags,
  Lock,
  ArrowRightLeft,
  Cpu,
  Bot
} from 'lucide-react';

/**
 * Hacky MetaGen 3.9 - Adobe Stock Metadata Generator
 * Built with React + Tailwind CSS + Gemini API + Groq API + ChatGPT API
 * Optimized for Client-Side Preview
 */

// --- CONFIGURATION HELPER ---
const getEnvBool = (key, defaultVal) => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] === 'true';
    }
  } catch (e) {
    return defaultVal;
  }
  return defaultVal;
};

// --- CONFIGURATION ---
// 1. MANUAL_CONFIG: Set these to true to force backend usage locally or in specific builds.
const MANUAL_USE_BACKEND = true; 
const MANUAL_REQUIRE_USER_API_KEY = true;

// 2. LOGIC: Checks Environment Variable first, then Manual toggle.
const USE_BACKEND = getEnvBool('NEXT_PUBLIC_USE_BACKEND', false) || MANUAL_USE_BACKEND;
const REQUIRE_USER_API_KEY = getEnvBool('NEXT_PUBLIC_REQUIRE_USER_API_KEY', false) || MANUAL_REQUIRE_USER_API_KEY;

// --- Constants ---
const MAX_TITLE_LENGTH = 120;
const MIN_TITLE_LENGTH = 100; 
const TARGET_KEYWORD_COUNT = 49;
const BATCH_SIZE = 3; 
const apiKey = ""; 

// --- API CONSTANTS ---
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o-mini";

const ADOBE_CATEGORIES = [
  { id: 1, name: "Animals" },
  { id: 2, name: "Buildings and Architecture" },
  { id: 3, name: "Business" },
  { id: 4, name: "Drinks" },
  { id: 5, name: "The Environment" },
  { id: 6, name: "States of Mind" },
  { id: 7, name: "Food" },
  { id: 8, name: "Graphic Resources" },
  { id: 9, name: "Hobbies and Leisure" },
  { id: 10, name: "Industry" },
  { id: 11, name: "Landscape" },
  { id: 12, name: "Lifestyle" },
  { id: 13, name: "People" },
  { id: 14, name: "Plants and Flowers" },
  { id: 15, name: "Culture and Religion" },
  { id: 16, name: "Science" },
  { id: 17, name: "Social Issues" },
  { id: 18, name: "Sports" },
  { id: 19, name: "Technology" },
  { id: 20, name: "Transport" },
  { id: 21, name: "Travel" },
];

const LEGAL_CONTENT = {
  disclaimer: {
    title: "Disclaimer",
    icon: <AlertTriangle size={24} className="text-amber-500" />,
    content: (
      <div className="space-y-4 text-left">
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400 text-xs font-semibold">
           IMPORTANT: Hacky MetaGen is an independent tool and is NOT affiliated with Adobe Inc.
        </div>
        <p><strong>1. No Affiliation:</strong> Hacky MetaGen is an independent software tool developed to assist stock contributors. It is <strong>not</strong> affiliated with, endorsed by, sponsored by, or in any way officially connected with Adobe Inc., Adobe Stock, or any of their subsidiaries or affiliates. The official Adobe Stock website can be found at <a href="https://stock.adobe.com" target="_blank" className="underline">stock.adobe.com</a>.</p>
        <p><strong>2. AI Prediction Accuracy:</strong> The "AI Approval Result Prediction" feature is currently in <strong>Beta (v0.5)</strong>. This feature uses artificial intelligence to analyze images against general stock photography standards. <strong>This is an estimation only and does not guarantee acceptance or rejection.</strong> The Adobe Stock review process involves human moderation and subjective criteria that AI cannot fully predict.</p>
        <p><strong>3. Limitation of Liability:</strong> We are not responsible for any assets rejected by Adobe Stock, nor for any account warnings, suspensions, or terminations resulting from the upload of content generated or processed by this tool. Users are solely responsible for reviewing all metadata (titles, keywords) for accuracy, trademark issues, and relevance before submission.</p>
        <p><strong>4. "As Is" Service:</strong> This service is provided "as is" without any representations or warranties, express or implied. Hacky MetaGen makes no representations or warranties in relation to the availability, accuracy, or completeness of the information and materials provided.</p>
      </div>
    )
  },
  privacy: {
    title: "Privacy Policy",
    icon: <Shield size={24} className="text-green-500" />,
    content: (
      <div className="space-y-4 text-left">
        <p><strong>1. Data Processing Model:</strong> Hacky MetaGen operates primarily as a client-side interface. When you upload files for processing:</p>
        <ul className="list-disc pl-5 space-y-1 opacity-90">
            <li>Images/Videos are processed in your browser's memory to extract frames or thumbnails.</li>
            <li>Data is transmitted directly from your browser to the Google Gemini API, Groq API, or OpenAI API (depending on selection).</li>
            <li>We <strong>do not</strong> permanently store, save, or claim ownership of your uploaded assets.</li>
        </ul>
        <p><strong>2. API Keys & Local Storage:</strong> If you provide your own API Keys, they are stored locally in your browser's <code>localStorage</code> on your device. It is not saved to our databases. You retain full control over your key and can delete it at any time by clearing the input field.</p>
        <p><strong>3. Third-Party Data Sharing:</strong> This tool utilizes third-party AI APIs (Google Gemini or Groq) to generate metadata. By using this tool, you acknowledge that your input data (image frames and prompts) is sent to these providers for processing. Please refer to their respective Privacy Policies.</p>
        <p><strong>4. Usage Analytics:</strong> We may collect anonymous, non-identifiable usage statistics (e.g., number of generations) to improve service stability, but this does not include the content of your uploads.</p>
      </div>
    )
  },
  terms: {
    title: "Terms of Service",
    icon: <Scale size={24} className="text-blue-500" />,
    content: (
      <div className="space-y-4 text-left">
        <p><strong>1. Acceptance of Terms:</strong> By accessing and using Hacky MetaGen, you accept and agree to be bound by the terms and provision of this agreement.</p>
        <p><strong>2. Use License:</strong> Permission is granted to use Hacky MetaGen for personal or commercial purposes to generate metadata for stock assets. You may not:</p>
        <ul className="list-disc pl-5 space-y-1 opacity-90">
            <li>Use the service to generate metadata for illegal, harmful, sexually explicit, or violent content.</li>
            <li>Attempt to reverse engineer any part of the service.</li>
            <li>Use the service to spam or overload the API.</li>
        </ul>
        <p><strong>3. Intellectual Property:</strong> You retain all rights to the images and videos you process. We claim no intellectual property rights over the content you upload or the metadata generated.</p>
        <p><strong>4. API Usage:</strong> You agree to comply with the Acceptable Use Policies of the respective AI providers when using the integrated AI features.</p>
        <p><strong>5. Modifications:</strong> We reserve the right to revise these terms of service at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.</p>
      </div>
    )
  }
};

// --- HELPER COMPONENTS AND FUNCTIONS (OUTSIDE APP) ---

const StatCard = ({ icon, label, value, accent }) => {
  const accents = {
    blue: 'text-blue-400 bg-blue-500/10',
    green: 'text-green-400 bg-green-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
    orange: 'text-orange-400 bg-orange-500/10',
    red: 'text-red-400 bg-red-500/10',
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-slate-800/60 border-slate-700 flex-1 min-w-0">
      <div className={`w-8 h-8 rounded-md flex items-center justify-center ${accents[accent]}`}>
        {React.cloneElement(icon, { size: 14 })}
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[9px] uppercase tracking-wider text-slate-400">{label}</span>
        <span className="text-lg font-semibold text-white">{value}</span>
      </div>
    </div>
  );
};

const compressImage = async (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1500;
        if (width > maxDim || height > maxDim) {
          const ratio = width / height;
          if (width > height) { width = maxDim; height = maxDim / ratio; }
          else { height = maxDim; width = maxDim * ratio; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        URL.revokeObjectURL(img.src);
        resolve(dataUrl.split(',')[1]); 
      };
      img.onerror = () => {
         URL.revokeObjectURL(img.src);
         resolve(null);
      };
    });
};

const extractVideoFrames = (file, frameCount = 5) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const url = URL.createObjectURL(file);
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";
      const frames = [];
      let currentFrame = 0;
      const videoTimeout = setTimeout(() => {
             reject(new Error("Video parsing timed out. Format might be unsupported."));
      }, 15000); 

      video.onloadedmetadata = () => {
        const duration = video.duration;
        const step = duration / frameCount;
        const captureFrame = () => {
          if (currentFrame >= frameCount) {
            clearTimeout(videoTimeout);
            URL.revokeObjectURL(url);
            resolve(frames);
            return;
          }
          const time = (step * currentFrame) + (step / 2);
          video.currentTime = Math.min(time, duration - 0.1); 
        };
        video.onseeked = () => {
          let width = video.videoWidth;
          let height = video.videoHeight;
          const maxDim = 1280;
          if (width > maxDim || height > maxDim) {
            const ratio = width / height;
            if (width > height) { width = maxDim; height = maxDim / ratio; } 
            else { height = maxDim; width = maxDim * ratio; }
          }
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(video, 0, 0, width, height);
          frames.push(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
          currentFrame++;
          captureFrame(); 
        };
        captureFrame();
      };
      video.onerror = () => {
        clearTimeout(videoTimeout);
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load video for frame extraction"));
      };
    });
};

const generateThumbnail = async (file) => {
  const isVideo = file.type.startsWith('video/') || /\.(mov|mp4|avi|webm|mkv|mpg|mpeg)$/i.test(file.name);
  if (isVideo) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 1;
      const videoTimeout = setTimeout(() => resolve(null), 5000);
      video.onloadeddata = () => { if (video.duration < 1) video.currentTime = 0; };
      video.onseeked = () => {
        clearTimeout(videoTimeout);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          URL.revokeObjectURL(video.src);
          resolve(dataUrl);
        } catch(e) { resolve(null); }
      };
      video.onerror = () => {
        clearTimeout(videoTimeout);
        URL.revokeObjectURL(video.src);
        resolve(null);
      };
    });
  } else {
    return URL.createObjectURL(file);
  }
};

const checkApiKeyValidity = async (key, model) => {
    if (!key) return false;
    if (model === 'groq') {
        if (key.trim().startsWith('gsk_') && key.length > 20) return true;
        try {
            const response = await fetch("https://api.groq.com/openai/v1/models", {
                method: "GET",
                headers: { "Authorization": `Bearer ${key}` }
            });
            return response.ok;
        } catch (e) {
            return key.trim().startsWith('gsk_');
        }
    } else if (model === 'chatgpt') {
        if (key.trim().startsWith('sk-') && key.length > 20) return true;
         try {
            const response = await fetch("https://api.openai.com/v1/models", {
                method: "GET",
                headers: { "Authorization": `Bearer ${key}` }
            });
            return response.ok;
        } catch (e) {
            return key.trim().startsWith('sk-');
        }
    } else {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=1`);
            return response.ok;
        } catch (e) {
            return false;
        }
    }
  };

const App = () => {
  // 1. State Declarations
  const [theme, setTheme] = useState(() => localStorage.getItem('hackymetagen_theme') || 'dark');
  const [files, setFiles] = useState([]);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('hackymetagen_notify');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const hasNotifiedRef = useRef(false);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [contentType, setContentType] = useState('image'); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState('batch'); 
  const [copiedId, setCopiedId] = useState(null); 
  
  const [newKeyword, setNewKeyword] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);

  const [isAutoGenerate, setIsAutoGenerate] = useState(() => {
    const saved = localStorage.getItem('hackymetagen_auto_generate');
    return saved !== null ? JSON.parse(saved) : false;
  });
  
  const [useAiCategory, setUseAiCategory] = useState(() => {
    const saved = localStorage.getItem('hackymetagen_use_ai_category');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [csvExtension, setCsvExtension] = useState(() => localStorage.getItem('hackymetagen_csv_extension') || 'ai');
  const [preserveExtension, setPreserveExtension] = useState(() => {
    const saved = localStorage.getItem('hackymetagen_preserve_extension');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [defaultKeywords, setDefaultKeywords] = useState('');
  
  const [isKeywordsLocked, setIsKeywordsLocked] = useState(() => {
    const saved = localStorage.getItem('hackymetagen_keywords_locked');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [aiModel, setAiModel] = useState(() => localStorage.getItem('hackymetagen_ai_model') || 'gemini');

  const [userApiKey, setUserApiKey] = useState(''); 
  const [isKeySaved, setIsKeySaved] = useState(false); 
  const [isKeyInvalid, setIsKeyInvalid] = useState(false); 
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); 
  const [showErrorMessage, setShowErrorMessage] = useState(false); 
  const [showTutorial, setShowTutorial] = useState(false); 
  const [showUnsupportedError, setShowUnsupportedError] = useState(false); 
  const [activeLegalModal, setActiveLegalModal] = useState(null); 
  const [isVerifying, setIsVerifying] = useState(false); 

  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const [featureIndex, setFeatureIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState('opacity-100 translate-y-0');

  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);
  const sessionId = useRef(0);
  const processingMutex = useRef(Promise.resolve());
  
  const csvExtensionRef = useRef(csvExtension);
  const preserveExtensionRef = useRef(preserveExtension);
  const filesRef = useRef(files); 
  const apiKeyRef = useRef(userApiKey); 
  const defaultKeywordsRef = useRef(defaultKeywords);
  const aiModelRef = useRef(aiModel);

  // Derived State
  const activeFile = files.find(f => f.id === selectedFileId);
  const completeFiles = files.filter(f => f.status === 'complete');
  const allFilesComplete = files.length > 0 && files.every(f => f.status === 'complete');
  const totalFiles = files.length;
  const progressPercent = totalFiles > 0 ? (completeFiles.length / totalFiles) * 100 : 0;

  // Defined as mixed content array using useMemo
  const features = useMemo(() => [
    {type: 'jsx', content: (<span className="flex items-center gap-2 whitespace-nowrap truncate max-w-full">Custom Keywords (Appended) Supports<span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-black font-bold uppercase">New</span></span>)},
    {type: 'jsx', content: (<span className="flex items-center gap-2 whitespace-nowrap truncate max-w-full">Smart Batch Processing (Quota Saver)<span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-black font-bold uppercase">New</span></span>)},
    {type: 'jsx', content: (<span className="flex items-center gap-2 whitespace-nowrap truncate max-w-full">Files Statistics Panel<span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-black font-bold uppercase">New</span></span>)},
    {type: 'jsx', content: (<span className="flex items-center gap-2 whitespace-nowrap truncate max-w-full">Notification Sound On Batch Completed<span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-black font-bold uppercase animate-pulse">New</span></span>)},
    {type: 'jsx', content: (<span className="flex items-center gap-2 whitespace-nowrap truncate max-w-full">AI Approval Result Prediction Beta 0.5<span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-black font-bold uppercase animate-pulse">New</span></span>)},
    { type: 'text', content: " CSV FileName Extension Selection Support" },
    { type: 'text', content: " Video Metadata Support" }
  ], []);

  // Effects
  useEffect(() => { localStorage.setItem('hackymetagen_theme', theme); }, [theme]);
  useEffect(() => {localStorage.setItem('hackymetagen_notify',JSON.stringify(notificationsEnabled));}, [notificationsEnabled]);
  useEffect(() => { localStorage.setItem('hackymetagen_auto_generate', JSON.stringify(isAutoGenerate)); }, [isAutoGenerate]);
  useEffect(() => { localStorage.setItem('hackymetagen_use_ai_category', JSON.stringify(useAiCategory)); }, [useAiCategory]);
  useEffect(() => { localStorage.setItem('hackymetagen_csv_extension', csvExtension); }, [csvExtension]);
  useEffect(() => { localStorage.setItem('hackymetagen_preserve_extension', JSON.stringify(preserveExtension)); }, [preserveExtension]);
  useEffect(() => { localStorage.setItem('hackymetagen_keywords_locked', JSON.stringify(isKeywordsLocked)); }, [isKeywordsLocked]);
  useEffect(() => { localStorage.setItem('hackymetagen_ai_model', aiModel); aiModelRef.current = aiModel; }, [aiModel]);
  
  useEffect(() => { csvExtensionRef.current = csvExtension; }, [csvExtension]);
  useEffect(() => { preserveExtensionRef.current = preserveExtension; }, [preserveExtension]);
  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => { apiKeyRef.current = userApiKey; }, [userApiKey]);
  useEffect(() => { defaultKeywordsRef.current = defaultKeywords; }, [defaultKeywords]);

  useEffect(() => {
    let keyKey;
    if (aiModel === 'groq') keyKey = 'hackymetagen_groq_api_key';
    else if (aiModel === 'chatgpt') keyKey = 'hackymetagen_openai_api_key';
    else keyKey = 'hackymetagen_api_key';

    const savedKey = localStorage.getItem(keyKey);
    if (savedKey) {
      setIsKeySaved(true);
      setUserApiKey('');
      apiKeyRef.current = savedKey;
    } else {
      setIsKeySaved(false);
      setUserApiKey('');
      apiKeyRef.current = '';
    }
    setIsKeyInvalid(false);
  }, [aiModel]);

  useEffect(() => { document.title = "Hacky MetaGen"; }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeClass('opacity-0 -translate-y-2');
      setTimeout(() => {
        setFeatureIndex((prev) => (prev + 1) % features.length);
        setFadeClass('opacity-100 translate-y-0');
      }, 300);
    }, 5000); 
    return () => clearInterval(interval);
  }, [features.length]);

  useEffect(() => {
    if (!notificationsEnabled) return;
    if (allFilesComplete && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      const audio = new Audio('https://www.myinstants.com/media/sounds/rzhd-pribytie-poezda.mp3');
      audio.volume = 0.35;
      audio.play().catch(() => {});
    }
    if (!allFilesComplete) {
      hasNotifiedRef.current = false;
    }
  }, [allFilesComplete, notificationsEnabled]);

  // --- INTERNAL HELPER FUNCTIONS AND HANDLERS (DEFINED IN ORDER OF DEPENDENCY) ---

  const handleApplyKey = async () => {
    const keyToTest = userApiKey.trim();
    if (!keyToTest) return;
    setIsVerifying(true);
    const isValid = await checkApiKeyValidity(keyToTest, aiModel);
    setIsVerifying(false);
    if (isValid) {
        let keyKey;
        if (aiModel === 'groq') keyKey = 'hackymetagen_groq_api_key';
        else if (aiModel === 'chatgpt') keyKey = 'hackymetagen_openai_api_key';
        else keyKey = 'hackymetagen_api_key';

        localStorage.setItem(keyKey, keyToTest);
        setIsKeySaved(true);
        setIsKeyInvalid(false);
        setUserApiKey('');
        apiKeyRef.current = keyToTest;
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 5000);
    } else {
        setIsKeyInvalid(true);
        setIsKeySaved(false);
        setUserApiKey(''); 
        setShowErrorMessage(true);
        setTimeout(() => setShowErrorMessage(false), 5000);
    }
  };

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleCategoryMode = () => {
    const newMode = !useAiCategory;
    setUseAiCategory(newMode);
    setFiles(prev => prev.map(f => {
      let newCategoryId = 8;
      if (newMode) {
        newCategoryId = f.aiCategoryId || 8; 
      }
      return { ...f, categoryId: newCategoryId };
    }));
  };

  const updateFileKeywords = (fileId, newKeywordsString) => {
    const kwArray = newKeywordsString.split(',').map(k => k.trim()).filter(k => k);
    const stats = {
      short: kwArray.filter(k => k.split(' ').length <= 2).length,
      mid: kwArray.filter(k => k.split(' ').length === 3).length,
      long: kwArray.filter(k => k.split(' ').length >= 4).length,
      total: kwArray.length
    };
    
    setFiles(prev => prev.map(f => f.id === fileId ? {
        ...f,
        metadata: { ...f.metadata, keywords: newKeywordsString },
        keywordAnalysis: stats
    } : f));
  };
  
  const updateFileCategory = (fileId, newCategoryId) => {
    setFiles(prev => prev.map(f => f.id === fileId ? {
        ...f,
        categoryId: parseInt(newCategoryId, 10)
    } : f));
  };

  const handleGlobalExtensionChange = (newExt) => {
    setCsvExtension(newExt);
    setPreserveExtension(false);
    const isVideoExt = ['mov', 'mp4', 'mpg'].includes(newExt);

    setFiles(prev => prev.map(f => {
      const isVideoFile = f.type === 'video';
      if (isVideoFile === isVideoExt) {
         const originalName = f.file.name;
         const newName = originalName.replace(/\.[^/.]+$/, "") + "." + newExt;
         return { ...f, name: newName };
      }
      return f;
    }));
  };

  const handlePreserveExtension = () => {
    const nextState = !preserveExtension;
    setPreserveExtension(nextState);
    if (nextState) {
        setFiles(prev => prev.map(f => {
            return { ...f, name: f.file.name };
        }));
    } else {
        setFiles(prev => prev.map(f => {
            const isVideoFile = f.type === 'video';
            const isVideoExt = ['mov', 'mp4', 'mpg'].includes(csvExtension);
            if (isVideoFile === isVideoExt) {
               const originalName = f.file.name;
               const newName = originalName.replace(/\.[^/.]+$/, "") + "." + csvExtension;
               return { ...f, name: newName };
            }
            return f;
        }));
    }
  };

  const mergeKeywords = (aiKeywordsStr, specificDefaults = null) => {
    const currentDefaults = specificDefaults !== null ? specificDefaults : defaultKeywordsRef.current;
    if (!currentDefaults || !currentDefaults.trim()) {
       let list = aiKeywordsStr.split(',').map(s => s.trim()).filter(s => s);
       if (list.length > TARGET_KEYWORD_COUNT) {
           return list.slice(0, TARGET_KEYWORD_COUNT).join(', ');
       }
       return aiKeywordsStr;
    }
    const defaultsList = currentDefaults.split(',').map(s => s.trim()).filter(s => s);
    let aiList = aiKeywordsStr.split(',').map(s => s.trim()).filter(s => s);
    if (defaultsList.length === 0) return aiKeywordsStr;
    const maxAiCount = Math.max(0, TARGET_KEYWORD_COUNT - defaultsList.length);
    while (aiList.length > maxAiCount) {
        let indexToRemove = -1;
        for (let i = aiList.length - 1; i >= 0; i--) {
            const wordCount = aiList[i].split(/\s+/).length;
            if (wordCount <= 2) {
                indexToRemove = i;
                break;
            }
        }
        if (indexToRemove === -1) {
            indexToRemove = aiList.length - 1;
        }
        aiList.splice(indexToRemove, 1);
    }
    const combined = [...aiList, ...defaultsList];
    return combined.join(', ');
  };

  const prepareAssetData = async (fileObj) => {
    let mimeType = '';
    let base64Data = null;
    const ext = fileObj.file.name.split('.').pop().toLowerCase();
    const isVideo = fileObj.file.type.startsWith('video/') || /\.(mov|mp4|avi|webm|mkv|mpg|mpeg)$/i.test(fileObj.file.name);

    if (isVideo) {
        try {
            base64Data = await extractVideoFrames(fileObj.file, 5);
            mimeType = 'image/jpeg'; 
        } catch (err) {
            throw new Error(`Video processing error: ${err.message}`);
        }
    } else {
        if (fileObj.file.size > 20 * 1024 * 1024) {
             throw new Error("File too large. Images/Vectors must be under 20MB.");
        }
        const compressed = await compressImage(fileObj.file);
        if (compressed) {
            base64Data = compressed;
            mimeType = 'image/jpeg';
        } else {
             base64Data = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                if (reader.result) {
                    const result = reader.result;
                    const base64 = result.includes(',') ? result.split(',')[1] : result;
                    resolve(base64);
                } else {
                    reject(new Error("Failed to read file"));
                }
              };
              reader.onerror = () => reject(new Error("File reading error"));
              reader.readAsDataURL(fileObj.file);
            });
            if (['jpg', 'jpeg'].includes(ext)) mimeType = 'image/jpeg';
            else if (ext === 'png') mimeType = 'image/png';
            else if (ext === 'webp') mimeType = 'image/webp';
            else if (['ai', 'eps', 'svg'].includes(ext)) mimeType = 'image/png'; 
            else mimeType = 'image/jpeg';
        }
        // Force valid mime type if empty
        if (!mimeType || mimeType === '') mimeType = 'image/jpeg';
    }
    return { mimeType, data: base64Data, isVideo };
  };

  const generateBatchMetadata = async (fileObjs) => {
    let keyKey;
    if (aiModel === 'groq') keyKey = 'hackymetagen_groq_api_key';
    else if (aiModel === 'chatgpt') keyKey = 'hackymetagen_openai_api_key';
    else keyKey = 'hackymetagen_api_key';
    
    let activeKey = apiKeyRef.current || localStorage.getItem(keyKey) || userApiKey || apiKey;

    if (REQUIRE_USER_API_KEY && !activeKey) {
        throw new Error(`Missing ${aiModel === 'groq' ? 'Groq' : aiModel === 'chatgpt' ? 'ChatGPT' : 'Gemini'} API Key. Please click the Info icon.`);
    }

    const assets = await Promise.all(fileObjs.map(async (file) => {
        try {
            const data = await prepareAssetData(file);
            return { id: file.id, ...data, success: true };
        } catch (e) {
            return { id: file.id, error: e.message, success: false };
        }
    }));

    const validAssets = assets.filter(a => a.success);
    if (validAssets.length === 0) {
        throw new Error("Failed to prepare any files for API transmission.");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
        let parsedResult;

        if (USE_BACKEND) {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey: activeKey,
                    assets: validAssets,
                    modelProvider: aiModel
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                let errorMsg = `API Error: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    if (errorData.error) errorMsg = `API Error: ${JSON.stringify(errorData.error)}`;
                } catch (e) {}
                
                if (response.status === 404) {
                    errorMsg = "Backend endpoint /api/generate not found. (If testing in Canvas, set USE_BACKEND = false)";
                }
                throw new Error(errorMsg);
            }
            parsedResult = await response.json();
        } else {
            const categoriesString = ADOBE_CATEGORIES.map(c => `${c.id}. ${c.name}`).join('\n');
            const systemPromptText = `
              You are Hacky MetaGen 3.9, a senior SEO expert for Adobe Stock.
              You are processing a batch of ${validAssets.length} distinct assets.
              YOUR GOAL: Generate metadata for EACH of the ${validAssets.length} input assets.
              STRICT RULES FOR EACH ASSET:
              1. **Title**: EXACTLY 100-120 characters. Natural, readable, descriptive. Include high-value keywords. NO keyword stuffing.
              2. **Keywords**: Generate EXACTLY 49 keywords. Comma-separated string.
                 - **CRITICAL:** Do NOT generate more than or less than 49 keywords. Stop exactly at 49.
                 - **Priority:** First 5-10 keywords must be most relevant, most impactful...
                 This primarily determines search ranking.
                 - **Distribution:** Short-tail (1-2 words): ~30%, Mid-tail (2-3 words): ~45%, Long-tail (3-4 words): ~25%.
                 - **Content:** NO brand names, trademarks, or personal names.
              3. **Category**: Choose the single most appropriate category ID (1-21) from the list below:
              ${categoriesString}
              4. **Approval Prediction**: Status ("Accepted" or "Rejected") and Reason.
              OUTPUT FORMAT (JSON ARRAY ONLY):
              Return a JSON Array containing exactly ${validAssets.length} objects.
              [
                {
                  "title": "string",
                  "keywords": "string (comma separated)",
                  "category_id": integer,
                  "approval_status": "Accepted" or "Rejected",
                  "approval_reason": "string"
                },
                ...
              ]
            `;

            if (aiModel === 'groq' || aiModel === 'chatgpt') {
                const endpoint = aiModel === 'chatgpt' ? OPENAI_API_URL : GROQ_API_URL;
                const modelName = aiModel === 'chatgpt' ? OPENAI_MODEL : GROQ_MODEL;

                const messages = [
                    { role: "user", content: [{ type: "text", text: systemPromptText }] }
                ];
                validAssets.forEach((asset, index) => {
                    messages[0].content.push({ type: "text", text: `\n\n--- INPUT ASSET ${index + 1} ---` });
                    if (asset.isVideo && Array.isArray(asset.data)) {
                        asset.data.forEach(frameData => {
                             messages[0].content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${frameData}` } });
                        });
                    } else {
                         messages[0].content.push({ type: "image_url", image_url: { url: `data:${asset.mimeType};base64,${asset.data}` } });
                    }
                });

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${activeKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: modelName, messages: messages, temperature: 0.7, max_tokens: 4096, response_format: { type: "json_object" } }),
                    signal: controller.signal
                });

                if (!response.ok) {
                    let errorMsg = `${aiModel === 'chatgpt' ? 'OpenAI' : 'Groq'} API Error: ${response.status}`;
                    try { const err = await response.json(); errorMsg += ` - ${JSON.stringify(err)}`; } catch(e){}
                    throw new Error(errorMsg);
                }
                const data = await response.json();
                let resultText = data.choices[0].message.content;
                resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
                let rawParse = JSON.parse(resultText);
                if (Array.isArray(rawParse)) {
                    parsedResult = rawParse;
                } else if (typeof rawParse === 'object') {
                    const arrayVal = Object.values(rawParse).find(v => Array.isArray(v));
                    if (arrayVal) parsedResult = arrayVal;
                    else parsedResult = [rawParse];
                } else {
                    throw new Error(`Unexpected JSON format from ${aiModel}`);
                }
            } else {
                const contentParts = [{ text: systemPromptText }];
                validAssets.forEach((asset, index) => {
                    contentParts.push({ text: `\n\n--- INPUT ASSET ${index + 1} ---` });
                    if (asset.isVideo && Array.isArray(asset.data)) {
                        asset.data.forEach(frameData => {
                            contentParts.push({ inlineData: { mimeType: asset.mimeType, data: frameData } });
                        });
                    } else {
                        contentParts.push({ inlineData: { mimeType: asset.mimeType, data: asset.data } });
                    }
                });
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${activeKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ role: "user", parts: contentParts }], generationConfig: { responseMimeType: "application/json" } }),
                    signal: controller.signal
                });
                if (!response.ok) {
                    let errorMsg = `API Error: ${response.status} ${response.statusText}`;
                    try { const errorData = await response.json(); if (errorData.error) errorMsg = `API Error: ${JSON.stringify(errorData.error)}`; } catch (e) {}
                    throw new Error(errorMsg);
                }
                const data = await response.json();
                let resultText = data.candidates[0].content.parts[0].text;
                resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
                parsedResult = JSON.parse(resultText);
            }
        }
        if (!Array.isArray(parsedResult)) {
            if (typeof parsedResult === 'object') parsedResult = [parsedResult];
            else throw new Error("AI did not return a JSON Array");
        }
        const finalResults = {};
        validAssets.forEach((asset, idx) => {
            if (parsedResult[idx]) {
                if (parsedResult[idx].keywords && typeof parsedResult[idx].keywords === 'string') {
                    let kws = parsedResult[idx].keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
                    if (kws.length > 49) kws = kws.slice(0, 49);
                    parsedResult[idx].keywords = kws.join(', ');
                }
                finalResults[asset.id] = parsedResult[idx];
            }
        });
        return finalResults;
    } catch (e) {
        throw e;
    } finally {
        clearTimeout(timeoutId);
    }
  };

  const handleUpdateCompletedFiles = () => {
    const currentDefaults = defaultKeywordsRef.current;
    if (!currentDefaults) return;
    setFiles(prev => prev.map(f => {
        if (f.status === 'complete') {
            const sourceKeywords = f.originalAiKeywords || f.metadata.keywords;
            const finalKeywords = mergeKeywords(sourceKeywords, currentDefaults);
            const kwArray = finalKeywords.split(',').map(k => k.trim());
            const analysis = {
                short: kwArray.filter(k => k.split(' ').length <= 2).length,
                mid: kwArray.filter(k => k.split(' ').length === 3).length,
                long: kwArray.filter(k => k.split(' ').length >= 4).length,
                total: kwArray.length
            };
            return { ...f, metadata: { ...f.metadata, keywords: finalKeywords }, keywordAnalysis: analysis };
        }
        return f;
    }));
  };

  const runBatchGeneration = async (filesToProcess) => {
     const nextChain = processingMutex.current.catch(() => {}).then(async () => {
         const chunks = [];
         for (let i = 0; i < filesToProcess.length; i += BATCH_SIZE) {
             chunks.push(filesToProcess.slice(i, i + BATCH_SIZE));
         }
         for (const chunk of chunks) {
            const currentFiles = filesRef.current;
            const validChunk = chunk.filter(f => currentFiles.find(cf => cf.id === f.id));
            if (validChunk.length === 0) continue;
            let retries = 1; 
            let success = false;
            let lastError = null;

            while (retries > 0 && !success) {
                try {
                    const batchResults = await generateBatchMetadata(validChunk);
                    setFiles(prev => prev.map(f => {
                        const result = batchResults[f.id];
                        if (result) {
                            const finalKeywords = mergeKeywords(result.keywords);
                            const kwArray = finalKeywords.split(',').map(k => k.trim());
                            const analysis = {
                                short: kwArray.filter(k => k.split(' ').length <= 2).length,
                                mid: kwArray.filter(k => k.split(' ').length === 3).length,
                                long: kwArray.filter(k => k.split(' ').length >= 4).length,
                                total: kwArray.length
                            };
                            const predictedCategory = result.category_id || 8;
                            const finalCategory = useAiCategory ? predictedCategory : 8;
                            const currentCsvExt = csvExtensionRef.current;
                            const currentPreserve = preserveExtensionRef.current;
                            let finalName = f.name;
                            if (!currentPreserve) {
                                const isVideoFile = f.type === 'video';
                                const isVideoExt = ['mov', 'mp4', 'mpg'].includes(currentCsvExt);
                                if (isVideoFile === isVideoExt) {
                                    finalName = f.file.name.replace(/\.[^/.]+$/, "") + "." + currentCsvExt;
                                } else if (!isVideoFile && !isVideoExt) {
                                    finalName = f.file.name.replace(/\.[^/.]+$/, "") + "." + currentCsvExt;
                                }
                            }
                            return { 
                                ...f, 
                                status: 'complete', 
                                originalAiKeywords: result.keywords, 
                                metadata: { ...result, keywords: finalKeywords },
                                keywordAnalysis: analysis,
                                aiCategoryId: predictedCategory, 
                                categoryId: finalCategory,
                                name: finalName
                            };
                        }
                        return f;
                    }));
                    success = true;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error(`Error processing batch:`, error);
                    lastError = error;
                    const errorStr = error.toString();
                    if (errorStr.includes("API Key") || errorStr.includes("403") || errorStr.includes("400") || errorStr.includes("Invalid") || errorStr.includes("Quota")) {
                         setIsKeyInvalid(true);
                         setIsKeySaved(false);
                         setUserApiKey('');
                         retries = 0;
                    } else {
                        retries--;
                    }
                }
            }
            if (!success) {
                let displayError = "Failed to generate metadata.";
                if (lastError) {
                   const errStr = lastError.toString();
                   if (errStr.includes("insufficient_quota")) {
                      displayError = "OpenAI Quota Exceeded. Check billing.";
                   } else if (errStr.includes("API Key")) {
                      displayError = "Invalid API Key.";
                   } else {
                       displayError = errStr.length > 50 ? errStr.substring(0, 50) + "..." : errStr;
                   }
                }
                setFiles(prev => prev.map(f => {
                    if (validChunk.find(vf => vf.id === f.id)) {
                        return { ...f, status: 'error', errorMessage: displayError };
                    }
                    return f;
                }));
            }
         }
     });
     processingMutex.current = nextChain;
     return nextChain;
  };
  
  const handleGenerateAll = async () => {
    setIsProcessing(true);
    const pendingFiles = files.filter(f => f.status !== 'complete');
    if (pendingFiles.length === 0) {
      setIsProcessing(false);
      return;
    }
    setFiles(prev => prev.map(f => f.status !== 'complete' ? { ...f, status: 'processing' } : f));
    try {
      await runBatchGeneration(pendingFiles);
    } catch (err) {
      console.error("Batch processing error", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCSV = (filesToExport = files) => {
    const csvHeader = "Filename,Title,Keywords,Category\n";
    const csvRows = filesToExport.map(f => {
      if (f.status === 'pending' || f.status === 'processing' || f.status === 'error') return null;

      const title = `"${f.metadata.title ? f.metadata.title.replace(/"/g, '""') : ''}"`;
      const keywords = `"${f.metadata.keywords ? f.metadata.keywords.replace(/"/g, '""') : ''}"`;
      const filename = f.name; 
      const category = f.categoryId || 8; 
      return `${filename},${title},${keywords},${category}`;
    }).filter(row => row !== null).join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metagen_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const copyToClipboard = (text, id = null) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
    document.body.removeChild(textArea);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim() || !activeFile) return;
    const currentKeywords = activeFile.metadata.keywords ? activeFile.metadata.keywords.split(',').map(k => k.trim()).filter(k => k) : [];
    const updatedKeywordsString = [...currentKeywords, newKeyword.trim()].join(', ');
    updateFileKeywords(activeFile.id, updatedKeywordsString);
    setNewKeyword('');
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropKeyword = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex || !activeFile) return;
    const currentKeywords = activeFile.metadata.keywords.split(',').map(k => k.trim()).filter(k => k);
    const itemToMove = currentKeywords[draggedIndex];
    currentKeywords.splice(draggedIndex, 1);
    currentKeywords.splice(targetIndex, 0, itemToMove);
    const updatedKeywordsString = currentKeywords.join(', ');
    updateFileKeywords(activeFile.id, updatedKeywordsString);
    setDraggedIndex(null);
  };
  
  const handleApplyKeyClick = () => handleApplyKey();

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFiles(Array.from(e.target.files));
    }
  };

  const processUploadedFiles = useCallback(async (uploadedFiles) => {
    let keyKey;
    if (aiModel === 'groq') keyKey = 'hackymetagen_groq_api_key';
    else if (aiModel === 'chatgpt') keyKey = 'hackymetagen_openai_api_key';
    else keyKey = 'hackymetagen_api_key';
    
    // Check key
    let activeKey = apiKeyRef.current || localStorage.getItem(keyKey) || userApiKey || apiKey;

    if (REQUIRE_USER_API_KEY && !activeKey) {
      setShowTutorial(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const supportedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'ai', 'eps', 'svg', 'mov', 'mp4', 'avi', 'webm', 'mkv', 'mpg', 'mpeg'];
    let hasUnsupported = false;
    for (const file of uploadedFiles) {
       const ext = file.name.split('.').pop().toLowerCase();
       if (!supportedExtensions.includes(ext)) {
          hasUnsupported = true;
          break;
       }
    }

    if (hasUnsupported) {
        setShowUnsupportedError(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return; 
    }

    const currentSession = sessionId.current;
    const newFilesPromises = uploadedFiles.map(async (file) => {
      let fileName = file.name; 
      const isMov = fileName.toLowerCase().endsWith('.mov');
      const ext = fileName.split('.').pop().toLowerCase();
      let determinedType = contentType;
      if (['mov', 'mp4', 'avi', 'webm', 'mkv', 'mpg', 'mpeg'].includes(ext) || file.type.startsWith('video/')) {
        determinedType = 'video';
      } else if (['ai', 'eps', 'svg'].includes(ext)) {
        determinedType = 'vector';
      } else {
        determinedType = 'image';
      }
      const previewUrl = await generateThumbnail(file);
      return {
        id: crypto.randomUUID(),
        file,
        name: fileName,
        preview: previewUrl,
        type: determinedType,
        status: isAutoGenerate ? 'processing' : 'pending',
        categoryId: 8, 
        aiCategoryId: null, 
        metadata: { title: '', keywords: '' },
        keywordAnalysis: { short: 0, mid: 0, long: 0, total: 0 }
      };
    });

    const newFiles = await Promise.all(newFilesPromises);
    if (currentSession !== sessionId.current) return; 

    setFiles(prev => {
        const updated = [...prev, ...newFiles];
        return updated;
    });
    
    if (files.length === 0 && newFiles.length > 0) {
        setSelectedFileId(newFiles[0].id);
    }
    if (isAutoGenerate) {
        runBatchGeneration(newFiles);
    }
  }, [contentType, files.length, selectedFileId, isAutoGenerate, useAiCategory, preserveExtension, csvExtension, userApiKey, aiModel]);

  const removeFile = (id, e) => {
    e.stopPropagation();
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFileId === id) setSelectedFileId(null);
  };

  const handleResetUploads = () => {
    if (files.length === 0) return;
    sessionId.current += 1;
    files.forEach(file => { if (file.preview && file.preview.startsWith('blob:')) URL.revokeObjectURL(file.preview); });
    setFiles([]);
    setSelectedFileId(null);
    setViewMode('batch');
    setIsProcessing(false);
    setIsGlobalDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateFileExtension = (id, newExt) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== id) return f;
      const newName = f.name.replace(/\.[^/.]+$/, "") + "." + newExt;
      return { ...f, name: newName };
    }));
  };

  const generateMetadata = async (fileObj) => {
    if (!fileObj) return;
    setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'processing' } : f));
    try {
      const batchResults = await generateBatchMetadata([fileObj]);
      const jsonResult = batchResults[fileObj.id];
      
      if (!jsonResult) throw new Error("No result returned from AI");

      const finalKeywords = mergeKeywords(jsonResult.keywords);

      const kwArray = finalKeywords.split(',').map(k => k.trim());
      const analysis = {
        short: kwArray.filter(k => k.split(' ').length <= 2).length,
        mid: kwArray.filter(k => k.split(' ').length === 3).length,
        long: kwArray.filter(k => k.split(' ').length >= 4).length,
        total: kwArray.length
      };
      setFiles(prev => prev.map(f => {
        if (f.id !== fileObj.id) return f;
        const currentCsvExt = csvExtensionRef.current;
        const currentPreserve = preserveExtensionRef.current;
        let finalName = f.name;
        if (!currentPreserve) {
            const isVideoFile = f.type === 'video';
            const isVideoExt = ['mov', 'mp4', 'mpg'].includes(currentCsvExt);
            if (isVideoFile === isVideoExt) {
                finalName = f.file.name.replace(/\.[^/.]+$/, "") + "." + currentCsvExt;
            } else if (!isVideoFile && !isVideoExt) {
                finalName = f.file.name.replace(/\.[^/.]+$/, "") + "." + currentCsvExt;
            }
        }
        return { 
          ...f, 
          status: 'complete', 
          originalAiKeywords: jsonResult.keywords, // Store Raw AI Output
          metadata: { ...jsonResult, keywords: finalKeywords },
          keywordAnalysis: analysis,
          aiCategoryId: jsonResult.category_id,
          categoryId: useAiCategory ? (jsonResult.category_id || 8) : 8,
          name: finalName
        };
      }));
    } catch (error) {
      console.error("Generation Error:", error);
      let displayError = error.message || "Unknown error";
      if (displayError.includes("API Key") || displayError.includes("403") || displayError.includes("400") || displayError.includes("Invalid")) {
         displayError = "Check or replace to a new api key. (" + displayError + ")";
         setIsKeyInvalid(true);
         setIsKeySaved(false);
         setUserApiKey('');
      }
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'error', errorMessage: displayError } : f));
    }
  };

  return (
    <div 
      className={`min-h-screen w-full transition-colors duration-300 pb-20 ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}
      onDragOver={(e) => { 
        e.preventDefault(); 
        e.stopPropagation(); 
        if (!isGlobalDragging) setIsGlobalDragging(true); 
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsGlobalDragging(false);
        dragCounter.current = 0;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          processUploadedFiles(Array.from(e.dataTransfer.files));
        }
      }}
    >
      
      {/* GLOBAL DRAG OVERLAY */}
      {isGlobalDragging && (
        <div 
          className={`fixed inset-0 z-50 bg-indigo-900/90 backdrop-blur-sm border-4 border-indigo-500 border-dashed m-4 rounded-2xl flex flex-col items-center justify-center animate-in fade-in duration-200`}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsGlobalDragging(false);
            dragCounter.current = 0;
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              processUploadedFiles(Array.from(e.dataTransfer.files));
            }
          }}
          onDragLeave={(e) => {
             e.preventDefault();
             e.stopPropagation();
             if (e.target === e.currentTarget) {
                 setIsGlobalDragging(false);
                 dragCounter.current = 0;
             }
          }}
        >
          <Upload size={64} className="text-white mb-4 animate-bounce pointer-events-none" />
          <h2 className="text-3xl font-bold text-white mb-2 pointer-events-none">Drop files anywhere!</h2>
          <p className="text-indigo-200 text-lg pointer-events-none">Support for Images, Videos, and Vectors</p>
        </div>
      )}

      {/* UNSUPPORTED FILE MODAL */}
      {showUnsupportedError && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className={`max-w-md w-full rounded-2xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} p-6 text-center`}>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Unsupported File Type</h3>
              <p className={`mb-6 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                Please re check and remove unsupported file types. Only Images, Videos, and Vectors are allowed.
              </p>
              <button 
                  onClick={() => setShowUnsupportedError(false)}
                  className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
              >
                  Close
              </button>
           </div>
        </div>
      )}

      {/* LEGAL MODAL (DISCLAIMER / PRIVACY / TERMS) */}
      {activeLegalModal && LEGAL_CONTENT[activeLegalModal] && (
         <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className={`max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} max-h-[85vh] flex flex-col`}>
                 {/* Modal Header */}
                 <div className="p-6 border-b border-slate-200/10 flex justify-between items-center bg-gradient-to-r from-transparent to-indigo-500/5">
                     <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50`}>
                             {LEGAL_CONTENT[activeLegalModal].icon}
                         </div>
                         <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                             {LEGAL_CONTENT[activeLegalModal].title}
                         </h3>
                     </div>
                     <button 
                         onClick={() => setActiveLegalModal(null)} 
                         className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                     >
                         <X size={20} />
                     </button>
                 </div>
                 
                 {/* Modal Content - Scrollable */}
                 <div className={`p-6 overflow-y-auto text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                     {LEGAL_CONTENT[activeLegalModal].content}
                 </div>
                 
                 {/* Modal Footer */}
                 <div className={`p-6 border-t border-slate-200/10 ${theme === 'dark' ? 'bg-slate-900/30' : 'bg-slate-50'}`}>
                     <button 
                         onClick={() => setActiveLegalModal(null)}
                         className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors shadow-lg shadow-indigo-500/20"
                     >
                         Close
                     </button>
                 </div>
             </div>
         </div>
      )}

      {/* TUTORIAL MODAL */}
      {showTutorial && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`max-w-md w-full rounded-2xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">How to get your API Key</h3>
                    <button onClick={() => setShowTutorial(false)} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
                  </div>
                  
                  <ol className={`list-decimal list-inside space-y-3 mb-6 text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      {aiModel === 'groq' ? (
                          <>
                           <li>Go to <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="font-semibold text-indigo-500 hover:underline">Groq Cloud Console</a>.</li>
                           <li>Log in or Sign up.</li>
                           <li>Navigate to API Keys and create a new key.</li>
                          </>
                      ) : aiModel === 'chatgpt' ? (
                          <>
                           <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="font-semibold text-indigo-500 hover:underline">OpenAI Platform</a>.</li>
                           <li>Log in or Sign up.</li>
                           <li>Create a new secret key.</li>
                          </>
                      ) : (
                          <>
                           <li>Go to <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="font-semibold text-indigo-500 hover:underline">Google AI Studio</a>.</li>
                           <li>Log in with your Google account.</li>
                           <li>Click the blue <span className="font-semibold">"Get API Key"</span> button.</li>
                          </>
                      )}
                      <li>Copy the key and paste it into the box above.</li>
                  </ol>
                  
                  <div className="flex gap-3">
                    <a 
                        href={aiModel === 'groq' ? "https://console.groq.com/keys" : aiModel === 'chatgpt' ? "https://platform.openai.com/api-keys" : "https://aistudio.google.com/app/api-keys"} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 py-3 text-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                        Get API Key Now
                        <Maximize2 size={16} />
                    </a>
                    <button 
                        onClick={() => setShowTutorial(false)}
                        className={`px-4 py-3 rounded-xl border font-medium transition-colors ${theme === 'dark' ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-300 hover:bg-slate-100'}`}
                    >
                        Close
                    </button>
                  </div>
              </div>
          </div>
        </div>
      )}

{/* 1. HEADER */}
<header
  className={`px-6 py-4 flex items-center justify-between border-b ${
    theme === 'dark'
      ? 'border-slate-800 bg-slate-900/50'
      : 'border-slate-200 bg-white'
  }`}
>
  {/* LEFT: LOGO + TITLE (REFRESH) */}
  <div
    onClick={() => window.location.reload()}
    className="flex items-center gap-3 cursor-pointer select-none hover:opacity-90 transition-opacity"
    title="Refresh page"
  >
    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
      H
    </div>
    <h1 className="font-bold text-lg tracking-tight hidden sm:inline">
      <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>
        Hacky
      </span>{' '}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
        MetaGen
      </span>
      <span className="text-xs align-top bg-indigo-500/20 text-indigo-500 px-1.5 py-0.5 rounded ml-1">
        3.9
      </span>
    </h1>
  </div>

  {/* RIGHT: CONTROLS */}
  <div className="flex items-center gap-2">
    {/* Messages */}
    <div className="relative h-4 hidden md:flex items-center justify-end w-64 overflow-hidden pointer-events-none">
      <span
        className={`absolute right-0 text-xs font-semibold text-green-500 transition-all duration-500 ${
          showSuccessMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        Key Inserted
      </span>
      <span
        className={`absolute right-0 text-xs font-semibold text-red-500 transition-all duration-500 ${
          showErrorMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        Invalid API Key
      </span>
    </div>

    {/* Model Toggle */}
    <div className={`flex rounded-lg p-0.5 border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-300'}`}>
        <button
            onClick={() => setAiModel('gemini')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                aiModel === 'gemini'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
        >
            Gemini
        </button>
        <button
            onClick={() => setAiModel('groq')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                aiModel === 'groq'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
        >
            Groq <span className="text-[9px] uppercase opacity-75">Beta</span>
        </button>
        <button
            onClick={() => setAiModel('chatgpt')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                aiModel === 'chatgpt'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
        >
            ChatGPT
        </button>
    </div>

    {/* API Key Input */}
    <div className="flex items-center gap-2">
      <input
        type="text"
        placeholder={
          isKeyInvalid
            ? 'Check Key'
            : isKeySaved
            ? 'Ready'
            : aiModel === 'groq' ? 'Enter Groq API Key' : aiModel === 'chatgpt' ? 'Enter OpenAI Key' : 'Enter Gemini API Key'
        }
        value={userApiKey}
        onChange={(e) => {
          const val = e.target.value;
          setUserApiKey(val);

          // Clear stored key if user clears input
          if (val === '') {
            let keyKey;
            if (aiModel === 'groq') keyKey = 'hackymetagen_groq_api_key';
            else if (aiModel === 'chatgpt') keyKey = 'hackymetagen_openai_api_key';
            else keyKey = 'hackymetagen_api_key';
            localStorage.removeItem(keyKey);
            apiKeyRef.current = '';
            setIsKeySaved(false);
          } else {
            setIsKeySaved(false);
          }
          setIsKeyInvalid(false);
        }}
        className={`text-xs px-3 py-2 rounded-lg border transition-all w-24 focus:w-48 sm:w-32 sm:focus:w-64 ${
          isKeyInvalid
            ? 'bg-red-500/10 border-red-500 text-red-500 placeholder:text-red-500'
            : isKeySaved
            ? 'bg-blue-500/10 border-blue-500 text-blue-500 placeholder:text-blue-500 text-center'
            : theme === 'dark'
            ? 'bg-slate-800 border-slate-700 text-white'
            : 'bg-slate-100 border-slate-300 text-slate-900'
        }`}
      />

      <button
        onClick={handleApplyKey}
        disabled={isVerifying}
        className="p-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400"
      >
        {isVerifying ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
      </button>

      <button
        onClick={() => setShowTutorial(true)}
        className="p-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400"
        title="How to get API Key"
      >
        <Info size={14} />
      </button>
    </div>

    <div className="w-px h-6 mx-2 hidden sm:block bg-slate-700" />

    {/* Notification Toggle */}
    <button
      onClick={() => setNotificationsEnabled((p) => !p)}
      className="p-2 rounded-full hover:bg-slate-800 text-slate-400"
      title={notificationsEnabled ? 'Notification sound ON' : 'Notification sound OFF'}
    >
      {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
    </button>

    {/* Theme Toggle */}
    <button
      onClick={handleToggleTheme}
      className="p-2 rounded-full hover:bg-slate-800 text-slate-400"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>

    {/* Help */}
    <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-slate-800/50 hover:bg-slate-800 rounded-full border border-slate-700 transition-all">
      <HelpCircle size={16} className="text-indigo-400" />
      <span>Help</span>
    </button>
  </div>
</header>

      {/* 2. HERO SECTION */}
      {files.length === 0 ? (
        <div className="max-w-4xl mx-auto mt-12 px-6 text-center mb-12">
          {/* Animated Feature Badge */}
          {/* Animated Feature Badge */}
<span
  className={`inline-flex items-center gap-2 px-3 py-1 mb-4
  text-xs font-semibold tracking-wider text-indigo-400 uppercase
  bg-indigo-500/10 rounded-full border border-indigo-500/20
  transition-all duration-300 transform
  whitespace-nowrap truncate max-w-full ${fadeClass}`}
>
  New Feature :
  {features[featureIndex].type === 'jsx'
    ? features[featureIndex].content
    : features[featureIndex].content}
</span>

          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>Adobe Stock</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Metadata Generator</span>
          </h2>
          <p className={`text-lg max-w-2xl mx-auto mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Smart</span> All In One SEO-optimized AI automation for images, videos for Adobe Stock.
          </p>
          <p className={`text-xs max-w-2xl mx-auto font-semibold mb-8 ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>
            Important: Upload at least 3 images per batch and Keep Disable Auto Generate Button to maximize your API key value or you have to replace your key to new one after every 20-30 processed images.
          </p>
            
        </div>
      ) : (
         /* CONDITIONAL HERO: Shows progress on the Title when files exist */
         <div className="max-w-7xl mx-auto mt-8 px-4 mb-6">
            <h2 className="text-3xl font-extrabold tracking-tight">
              <span 
                className="bg-clip-text text-transparent transition-all duration-700 ease-out"
                style={{
                  backgroundImage: `linear-gradient(to right, #16a34a ${
                    files.length > 0 ? (completeFiles.length / files.length) * 100 : 0
                  }%, ${theme === 'dark' ? '#ffffff' : '#0f172a'} ${
                    files.length > 0 ? (completeFiles.length / files.length) * 100 : 0
                  }%)`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text'
                }}
              >
                Adobe Stock
              </span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Metadata Generator</span>
            </h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
               {completeFiles.length} of {files.length} assets processed
            </p>
         </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <main className="max-w-7xl mx-auto px-4 pb-24 flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-200px)]">
        
        {/* LEFT COLUMN: Upload & Batch List */}
        <div className={`w-full ${viewMode === 'batch' ? 'lg:w-1/4' : 'lg:w-1/3'} flex flex-col gap-4 transition-all duration-300`}>
          
          {/* Content Type Tabs */}
          <div className={`p-1 rounded-xl flex ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}>
            {['image', 'video', 'vector'].map((type) => (
              <button
                key={type}
                onClick={() => setContentType(type)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
                  contentType === type 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {type === 'image' && <FileImage size={16} />}
                {type === 'video' && <FileVideo size={16} />}
                {type === 'vector' && <PenTool size={16} />}
                <span className="capitalize">{type}</span>
              </button>
            ))}
          </div>

          {/* Upload Area */}
          <div 
            onClick={() => fileInputRef.current.click()}
            className={`flex-1 min-h-[120px] max-h-[160px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group relative overflow-hidden ${
              theme === 'dark' 
                ? 'border-slate-700 hover:border-indigo-500 hover:bg-slate-800/50' 
                : 'border-slate-300 hover:border-indigo-500 hover:bg-slate-50'
            }`}
          >
            <input 
              type="file" 
              multiple 
              // Dynamically set accept attribute based on content type
              accept={contentType === 'video' ? "video/*,.mov,.mp4" : contentType === 'vector' ? ".ai,.eps,.svg" : "image/*,.jpg,.png"}
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            
            <Upload size={32} className="mb-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <p className="font-medium text-slate-300 group-hover:text-indigo-400">
              {contentType === 'video' ? 'Drop videos here' : contentType === 'vector' ? 'Drop vectors here' : 'Drop images here'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              <span className="underline decoration-dashed underline-offset-4 group-hover:text-indigo-400 transition-colors">Click to browse</span> files on your PC
            </p>
          </div>

          {/* Reset Uploads Button */}
          {files.length > 0 && (
            <button
              onClick={handleResetUploads}
              className={`w-full py-2 text-xs font-medium rounded-lg border flex items-center justify-center gap-2 transition-colors ${
                theme === 'dark' 
                  ? 'border-red-900/50 text-red-400 hover:bg-red-900/20' 
                  : 'border-red-200 text-red-600 hover:bg-red-50'
              }`}
            >
              <RefreshCw size={14} />
              Reset to default
            </button>
          )}

          {/* Default Keywords Input (Moved Here) */}
          <div className="mt-1">
            <div className="flex items-center gap-1 mb-1 pl-1">
                <Tags size={12} className={theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} />
                <label className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Custom Keywords (Appended)
                </label>
            </div>
            <div className="flex gap-2">
                <textarea
                    value={defaultKeywords}
                    onChange={(e) => setDefaultKeywords(e.target.value)}
                    disabled={isKeywordsLocked}
                    placeholder="e.g. vector, illustration, abstract (comma separated)"
                    rows={2}
                    className={`flex-1 text-xs p-2 rounded-xl border font-medium transition-all resize-none ${
                    theme === 'dark' 
                        ? 'bg-slate-800 border-slate-700 text-slate-300 focus:border-indigo-500 focus:bg-slate-800 disabled:opacity-50' 
                        : 'bg-white border-slate-300 text-slate-600 focus:border-indigo-500 disabled:bg-slate-100'
                    }`}
                />
                <div className="flex flex-col gap-1">
                    <button
                        onClick={() => setIsKeywordsLocked(!isKeywordsLocked)}
                        className={`flex-1 px-3 rounded-xl border font-medium text-[10px] uppercase tracking-wide transition-colors flex flex-col items-center justify-center gap-0.5 ${
                            isKeywordsLocked
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/50 hover:bg-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/50 hover:bg-indigo-500/20'
                        }`}
                        title={isKeywordsLocked ? "Unlock to edit" : "Lock keywords for generation"}
                    >
                        {isKeywordsLocked ? <Lock size={12} /> : <Plus size={12} />}
                        {isKeywordsLocked ? 'Edit' : 'Add'}
                    </button>
                    <button
                        onClick={handleUpdateCompletedFiles}
                        className={`flex-1 px-3 rounded-xl border font-medium text-[10px] uppercase tracking-wide transition-colors flex flex-col items-center justify-center gap-0.5 ${
                            theme === 'dark'
                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                            : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                        }`}
                        title="Update all completed files with these keywords"
                    >
                        <ArrowRightLeft size={12} />
                        Update
                    </button>
                </div>
            </div>
            <p className="text-[10px] text-slate-500 pl-1 mt-0.5">
                {isKeywordsLocked 
                    ? <span className="text-green-500 flex items-center gap-1"><Check size={10}/> Keywords locked and ready for generation.</span> 
                    : "Automatically removes short-tail keywords to make room."}
            </p>
          </div>

{/* Auto Generate & Default Category (Flat Compact Style) */}
<div className="flex gap-2 mt-1">

  {/* Auto Generate */}
  <button
    onClick={() => setIsAutoGenerate(!isAutoGenerate)}
    className={`flex-1 h-10 px-3 rounded-lg
               flex items-center justify-center gap-2
               text-xs font-medium whitespace-nowrap
               transition-colors
               ${isAutoGenerate 
                 ? 'bg-green-600 hover:bg-green-700 text-white' 
                 : 'bg-slate-200 hover:bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
               }`}
  >
    {isAutoGenerate ? <Zap size={14} className="relative top-[1px]" /> : <ZapOff size={14} className="relative top-[1px]" />}
    {isAutoGenerate ? 'Auto Gen: ON' : 'Auto Gen: OFF'}
  </button>

  {/* Default / AI Category */}
  <button
    onClick={toggleCategoryMode}
    className={`flex-1 h-10 px-3 rounded-lg
                flex items-center justify-center gap-2
                text-xs font-medium whitespace-nowrap
                transition-colors
                ${
                  useAiCategory
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
  >
    <LayoutGrid size={14} className="relative top-[1px]" />
    {useAiCategory ? 'AI Category' : 'Default Category'}
  </button>

</div>
          
          {/* Replace All Filename Extensions in CSV */}
          <div className="mt-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block pl-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Replace All Filename Extensions in CSV
            </label>
            <div className="flex gap-2">
              <button
                onClick={handlePreserveExtension}
                className={`flex-1 text-xs py-2.5 px-2 rounded-xl border font-medium transition-all ${
                  !preserveExtension
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                    : theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-300 text-slate-600'
                }`}
              >
                {preserveExtension ? "Default Filename" : "Change Extension"}
              </button>
              <select
                value={csvExtension}
                onChange={(e) => handleGlobalExtensionChange(e.target.value)}
                disabled={preserveExtension}
                className={`w-1/2 text-xs p-2.5 rounded-xl border font-medium transition-all cursor-pointer ${
                  preserveExtension ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-slate-300 focus:border-indigo-500 hover:bg-slate-700' 
                    : 'bg-white border-slate-300 text-slate-600 focus:border-indigo-500 hover:bg-slate-50'
                }`}
              >
                 <optgroup label="Image / Vector">
                  {['jpg', 'png', 'ai', 'eps', 'svg'].map(ext => (
                    <option key={ext} value={ext}>.{ext}</option>
                  ))}
                </optgroup>
                <optgroup label="Video">
                   {['mov', 'mp4', 'mpg'].map(ext => (
                    <option key={ext} value={ext}>.{ext}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Batch List */}
          <div className={`flex-1 overflow-y-auto rounded-xl border h-48 lg:h-full lg:flex-1 ${theme === 'dark' ? 'bg-slate-800/30 border-slate-800' : 'bg-white border-slate-200'} p-2 space-y-2 mt-2`}>
            {files.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                <p className="text-sm">No files uploaded yet</p>
              </div>
            ) : (
              files.map((file) => (
                <div 
                  key={file.id}
                  onClick={() => {
                    setSelectedFileId(file.id);
                    setViewMode('editor');
                  }}
                  className={`p-2 rounded-lg flex items-center gap-3 cursor-pointer border transition-all ${
                    selectedFileId === file.id && viewMode === 'editor'
                      ? 'border-indigo-500 bg-indigo-500/10' 
                      : 'border-transparent hover:bg-slate-700/50'
                  }`}
                >
                  <div className="w-12 h-12 rounded overflow-hidden bg-slate-900 shrink-0 relative">
                    <img src={file.preview} alt="preview" className="w-full h-full object-cover" />
                    {file.status === 'processing' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 size={16} className="animate-spin text-white" />
                      </div>
                    )}
                    {file.status === 'complete' && (
                      <div className="absolute bottom-0 right-0 p-0.5 bg-green-500 rounded-tl-md">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                    {file.status === 'error' && (
                      <div className="absolute bottom-0 right-0 p-0.5 bg-red-500 rounded-tl-md">
                        <X size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p> {/* Updated to use file.name */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        file.status === 'complete' ? 'border-green-500/30 text-green-400' :
                        file.status === 'processing' ? 'border-yellow-500/30 text-yellow-400' :
                        file.status === 'error' ? 'border-red-500/30 text-red-400' :
                        'border-slate-600 text-slate-500'
                      }`}>
                        {file.status.toUpperCase()}
                      </span>
                      {file.status === 'complete' && (
                        <span className="text-[10px] text-slate-500">{file.keywordAnalysis.total} KWs</span>
                      )}
                    </div>
                  </div>
                  <button onClick={(e) => removeFile(file.id, e)} className="p-1.5 hover:bg-red-500/20 hover:text-red-400 text-slate-500 rounded transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Bulk Actions */}
          {files.length > 0 && (
            <div className="flex flex-col gap-2">
               {/* VIEW TOGGLE */}
               <button
                  onClick={() => setViewMode(prev => prev === 'editor' ? 'batch' : 'editor')}
                  className={`w-full py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all ${
                    viewMode === 'batch' 
                      ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                      : theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-600'
                  }`}
                >
                  {viewMode === 'batch' ? <PenTool size={18}/> : <LayoutGrid size={18} />}
                  {viewMode === 'batch' ? 'Open Editor' : 'Multi-File Review'}
                </button>

              <div className="flex gap-2">
                <button 
                  onClick={handleGenerateAll}
                  disabled={isProcessing}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                  {isProcessing ? 'Processing...' : 'Generate'}
                </button>
                <button 
                  onClick={() => handleExportCSV()}
                  className={`px-4 rounded-xl border flex items-center justify-center transition-colors ${
                    allFilesComplete
                      ? 'bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-lg shadow-green-500/20'
                      : theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
                  }`}
                  title="Export CSV manually"
                  disabled={completeFiles.length === 0}
                >
                  <Download size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: View Switcher (Editor OR Batch Review) */}
        <div className={`w-full ${viewMode === 'batch' ? 'lg:w-3/4' : 'lg:w-2/3'} flex flex-col rounded-xl transition-all duration-300 h-auto lg:h-full lg:overflow-hidden`}>
          

          {/* ======================= */
          /* BATCH REVIEW VIEW PART */
          /* ======================= */}

{viewMode === 'batch' ? (
  <div className="h-full flex flex-col">
    <div className="mb-6">
      <h3 className="text-2xl font-bold">Multi-File Review</h3>
      <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
        Review your metadata here
      </p>
{/* FILE STATISTICS CARDS */}
{files.length > 0 && (
  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">

    <StatCard
      label="Total Files"
      value={files.length}
      accent="blue"
      icon={<FileText size={18} />}
    />

    <StatCard
      label="Completed"
      value={files.filter(f => f.status === 'complete').length}
      accent={allFilesComplete ? 'green' : 'blue'}
      icon={<Check size={18} />}
    />

    <StatCard
      label="Processing"
      value={files.filter(f => f.status === 'processing').length}
      accent="yellow"
      icon={<Zap size={18} />}
    />

    <StatCard
      label="Likely Accepted"
      value={files.filter(
        f =>
          f.status === 'complete' &&
          f.metadata.approval_status !== 'Rejected'
      ).length}
      accent="green"
      icon={<ShieldCheck size={18} />}
    />

    <StatCard
      label="Likely Rejected"
      value={files.filter(
        f =>
          f.status === 'complete' &&
          f.metadata.approval_status === 'Rejected'
      ).length}
      accent="orange"
      icon={<ShieldAlert size={18} />}
    />

    <StatCard
      label="Errors"
      value={files.filter(f => f.status === 'error').length}
      accent="red"
      icon={<AlertCircle size={18} />}
    />

  </div>
)}
  
    </div>
              
              <div className="flex-1 lg:overflow-y-auto pr-2 pb-24">
                {files.length === 0 ? (
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className={`flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                      theme === 'dark' 
                        ? 'border-slate-700 bg-slate-800/30 hover:bg-slate-800/50' 
                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <Upload size={48} className="text-blue-500 animate-bounce mb-4" />
                    <p className={`text-lg font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Drop Images or Videos here</p>
                    <p className="text-sm text-indigo-500 font-medium mb-4 hover:underline">Click to browse on your PC</p>
                    
                    <div className={`text-xs text-center max-w-sm leading-relaxed ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                      <p className="font-semibold mb-1 uppercase tracking-wider text-slate-400">Supported Formats</p>
                      <p>
                        <span className="text-blue-500 font-medium">Image / Vector:</span> .jpg .png .ai .eps .svg
                      </p>
                      <p>
                        <span className="text-blue-500 font-medium">Video:</span> .mov .mp4 .mpg
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {files.map(file => {
                      const currentExt = file.name.split('.').pop().toLowerCase();
                      const extensions = file.type === 'video' 
                        ? ['mov', 'mp4', 'mpg'] 
                        : ['jpg', 'png', 'ai', 'eps', 'svg'];
                        
                      const displayFilename = file.name;

                      return (
                        <div key={file.id} className={`flex flex-col rounded-xl overflow-hidden border shadow-[0_8px_24px_rgba(0,0,0,0.06)] ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                          {/* Header */}
                          <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100/10">
                            <div className="flex items-center gap-2">
                              {file.status === 'complete' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                              {file.status === 'processing' && <Loader2 size={12} className="animate-spin text-yellow-500" />}
                              {file.status === 'pending' && <span className="w-2 h-2 rounded-full bg-slate-400"></span>}
                              {file.status === 'error' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                              
                              <span className={`text-xs font-semibold uppercase tracking-wide ${
                                file.status === 'complete' ? 'text-green-500' : 
                                file.status === 'processing' ? 'text-yellow-500' :
                                file.status === 'error' ? 'text-red-500' : 'text-slate-400'
                              }`}>
                                {file.status === 'complete' ? 'Done' : file.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={(e) => removeFile(file.id, e)} className="text-slate-400 hover:text-red-400 transition-colors" title="Delete">
                                <Trash2 size={14} />
                              </button>
                              <button onClick={() => { setSelectedFileId(file.id); setViewMode('editor'); }} className="text-slate-400 hover:text-indigo-400 transition-colors" title="Open Editor">
                                <PenTool size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Image */}
                          <div className="aspect-square bg-[#f6f7fb] w-full flex items-center justify-center p-4 relative overflow-hidden">
                            <img 
                              src={file.preview} 
                              alt="preview" 
                              className={`max-w-full max-h-full object-contain shadow-sm transition-all duration-300 ${
                                file.status === 'processing' ? 'blur-sm opacity-50 scale-95' : ''
                              }`} 
                            />
                            {file.status === 'processing' && (
                              <div className="absolute inset-0 flex items-center justify-center z-10">
                                <div className={`p-3 rounded-full shadow-lg border ${
                                  theme === 'dark' ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-slate-200'
                                }`}>
                                  <Loader2 size={24} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Fields */}
                          {file.status === 'error' ? (
                            <div className={`p-4 flex-1 flex flex-col justify-center items-center text-center ${theme === 'dark' ? 'bg-red-900/10' : 'bg-red-50'}`}>
                                <AlertCircle size={32} className="text-red-500 mb-2" />
                                <p className="text-red-500 font-bold text-sm mb-2">Generation Failed Recheck or Replace Your Key To New One</p>
                                <p className="text-xs text-red-500/80 leading-relaxed px-2">
                                  {file.errorMessage || "Unknown error occurred"}
                                </p>
                            </div>
                          ) : (
                            <div className="p-4 space-y-4 flex-1">
                            {/* Title */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Title</label>
                                <div className="flex items-center gap-2">
                                  {file.status === 'complete' && (
                                    <span className={`text-[10px] px-1.5 rounded font-medium ${
                                      file.metadata.title.length >= MIN_TITLE_LENGTH && file.metadata.title.length <= MAX_TITLE_LENGTH
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}>
                                      {file.metadata.title.length}
                                    </span>
                                  )}
                                  {file.status === 'complete' && (
                                    <button 
                                      onClick={() => copyToClipboard(file.metadata.title, `title-${file.id}`)} 
                                      className={`text-slate-400 hover:text-indigo-500 transition-colors ${copiedId === `title-${file.id}` ? 'text-green-500' : ''}`}
                                      title="Copy Title"
                                    >
                                      {copiedId === `title-${file.id}` ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                  )}
                                </div>
                              </div>
                              {file.status === 'complete' ? (
                                <p className="text-sm leading-snug line-clamp-2" title={file.metadata.title}>
                                  {file.metadata.title}
                                </p>
                              ) : (
                                <div className="h-10 bg-slate-700/10 rounded animate-pulse w-full"></div>
                              )}
                            </div>

                            {/* Keywords */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Keywords</label>
                                  {file.status === 'complete' && (
                                    <button 
                                      onClick={() => copyToClipboard(file.metadata.keywords, `kw-${file.id}`)} 
                                      className={`text-slate-400 hover:text-indigo-500 transition-colors ${copiedId === `kw-${file.id}` ? 'text-green-500' : ''}`}
                                      title="Copy Keywords"
                                    >
                                      {copiedId === `kw-${file.id}` ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                  )}
                                </div>
                                {file.status === 'complete' && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 rounded">{file.keywordAnalysis.total}</span>
                                )}
                              </div>
                              {file.status === 'complete' ? (
                                <div className="text-xs leading-relaxed max-h-24 overflow-y-auto text-slate-500 pr-1 scrollbar-thin">
                                  {file.metadata.keywords}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="h-4 bg-slate-700/10 rounded animate-pulse w-3/4"></div>
                                  <div className="h-4 bg-slate-700/10 rounded animate-pulse w-full"></div>
                                  <div className="h-4 bg-slate-700/10 rounded animate-pulse w-5/6"></div>
                                </div>
                              )}
                            </div>

                            {/* Category */}
                            <div>
                              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Category</label>
                              
                              <select
                                value={file.categoryId || 8}
                                onChange={(e) => updateFileCategory(file.id, e.target.value)}
                                className={`w-full text-xs p-2 rounded border bg-transparent cursor-pointer ${
                                  theme === 'dark' 
                                    ? 'border-slate-700 text-slate-300 focus:border-indigo-500' 
                                    : 'border-slate-300 text-slate-700 focus:border-indigo-500'
                                }`}
                              >
                                {ADOBE_CATEGORIES.map(cat => (
                                  <option key={cat.id} value={cat.id} className={theme === 'dark' ? 'bg-slate-800' : 'bg-white'}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* AI Approval Prediction */}
                            <div className="mt-3 pt-3 border-t border-slate-100/10">
                                <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                    AI Approval Result Prediction <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1 rounded ml-1">Beta 0.5</span>
                                </label>
                                <p className="text-[10px] text-blue-500 italic mb-2">This feature is in beta (prediction of similar content is up to you!)</p>
                                {file.status === 'complete' ? (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            {/* FIXED: Icon logic now matches text logic. If not 'Rejected', assume Accepted/Green. */}
                                            {file.metadata.approval_status !== 'Rejected' ? (
                                                <ShieldCheck size={14} className="text-green-500" />
                                            ) : (
                                                <ShieldAlert size={14} className="text-red-500" />
                                            )}
                                            <span className={`text-xs font-bold ${file.metadata.approval_status === 'Rejected' ? 'text-red-500' : 'text-green-500'}`}>
                                                {file.metadata.approval_status === 'Rejected' ? 'Likely to be Rejected' : 'Likely to be Accepted'}
                                            </span>
                                        </div>
                                        {file.metadata.approval_status === 'Rejected' && (
                                            <p className="text-[10px] text-slate-500 italic pl-5">
                                                Reason: {file.metadata.approval_reason}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-4 bg-slate-700/10 rounded animate-pulse w-1/2"></div>
                                )}
                            </div>
                          </div>
                          )}

                          {/* Footer & Extension Selection */}
                          <div className={`px-4 py-3 border-t flex flex-col gap-2 ${theme === 'dark' ? 'border-slate-700 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                            <div className="flex items-center gap-2 text-xs">
                              {extensions.map(ext => (
                                <button
                                  key={ext}
                                  onClick={() => updateFileExtension(file.id, ext)}
                                  className={`px-2 py-0.5 rounded uppercase font-semibold transition-colors border ${
                                    currentExt === ext 
                                      ? 'bg-indigo-500 text-white border-indigo-500' 
                                      : 'bg-transparent border-slate-300 hover:border-indigo-400'
                                  }`}
                                >
                                  .{ext}
                                </button>
                              ))}
                            </div>
                            <div className="text-xs truncate" title={displayFilename}>
                              {displayFilename}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* --- SINGLE EDITOR VIEW (Existing) --- */
            <div className={`h-full flex flex-col rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-800/30 border-slate-800' : 'bg-white border-slate-200'}`}>
               {!activeFile ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                      <PenTool size={32} className="text-slate-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No File Selected</h3>
                    <p className="text-slate-500 max-w-sm">Select a file from the list or upload new assets to start generating metadata.</p>
                  </div>
                ) : (
                  <>
                    {/* Editor Header */}
                    <div className={`px-6 py-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="flex items-center gap-4">
                        <h3 className="font-semibold text-lg">{activeFile.name}</h3> {/* Updated to use activeFile.name */}
                        {activeFile.status === 'complete' && (
                          <div className="flex gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                              Keywords: {activeFile.keywordAnalysis.total}/49
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => generateMetadata(activeFile)} 
                          className="p-2 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors" 
                          title="Regenerate"
                        >
                          <RefreshCw size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Editor Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {/* 1. TITLE */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium text-slate-400">Title</label>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${
                              activeFile.metadata.title.length > MAX_TITLE_LENGTH || activeFile.metadata.title.length < MIN_TITLE_LENGTH 
                              ? 'text-red-400' 
                              : 'text-green-400'
                            }`}>
                              {activeFile.metadata.title.length} chars
                            </span>
                            <button onClick={() => copyToClipboard(activeFile.metadata.title)} className="text-slate-500 hover:text-white"><Copy size={14}/></button>
                          </div>
                        </div>
                        <textarea 
                          value={activeFile.metadata.title}
                          onChange={(e) => {
                            const newTitle = e.target.value;
                            setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, metadata: { ...f.metadata, title: newTitle } } : f));
                          }}
                          className={`w-full p-3 rounded-lg border bg-transparent text-sm leading-relaxed transition-colors ${
                            theme === 'dark' ? 'border-slate-700 focus:border-indigo-500' : 'border-slate-300 focus:border-indigo-500'
                          }`}
                          rows={2}
                          placeholder="Waiting for generation..."
                        />
                        <p className="text-xs text-slate-500">
                          Target: 100-125 characters. Natural language, no stuffing.
                        </p>
                      </div>

                      {/* 3. KEYWORDS */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium text-slate-400">Keywords</label>
                          <div className="flex items-center gap-3">
                            {/* Keyword Stats */}
                            <div className="flex gap-1 text-[10px] uppercase font-bold tracking-wider">
                              <span title="Short Tail (1-2)" className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">S: {activeFile.keywordAnalysis.short}</span>
                              <span title="Mid Tail (2-3)" className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">M: {activeFile.keywordAnalysis.mid}</span>
                              <span title="Long Tail (4+)" className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">L: {activeFile.keywordAnalysis.long}</span>
                            </div>
                            <span className={`text-xs font-bold ${activeFile.keywordAnalysis.total > TARGET_KEYWORD_COUNT ? 'text-red-400' : 'text-slate-400'}`}>
                              {activeFile.keywordAnalysis.total}
                            </span>
                            <button onClick={() => copyToClipboard(activeFile.metadata.keywords)} className="text-slate-500 hover:text-white"><Copy size={14}/></button>
                          </div>
                        </div>

                        {/* Keyword Input Section */}
                        <div className="flex gap-2 mb-2">
                           <input 
                              type="text" 
                              value={newKeyword}
                              onChange={(e) => setNewKeyword(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                              placeholder="Add keyword..."
                              className={`flex-1 text-xs px-3 py-2 rounded-lg border bg-transparent outline-none transition-colors ${
                                theme === 'dark' 
                                  ? 'border-slate-700 focus:border-indigo-500 text-white placeholder-slate-500' 
                                  : 'border-slate-300 focus:border-indigo-500 text-slate-900'
                              }`}
                           />
                           <button 
                              onClick={handleAddKeyword}
                              className={`p-2 rounded-lg border transition-colors ${
                                theme === 'dark' 
                                  ? 'border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white' 
                                  : 'border-slate-300 hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                              }`}
                           >
                             <Plus size={14} />
                           </button>
                        </div>
                        
                        <div className={`w-full p-4 rounded-lg border min-h-[150px] ${
                          theme === 'dark' ? 'border-slate-700 bg-slate-900/30' : 'border-slate-300 bg-slate-50'
                        }`}>
                          {activeFile.metadata.keywords ? (
                            <div className="flex flex-wrap gap-2">
                              {activeFile.metadata.keywords.split(',').map((kw, idx) => {
                                const words = kw.trim().split(' ').length;
                                let colorClass = 'bg-slate-700 text-slate-300 border-slate-600'; // Default
                                if (words <= 2) colorClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                                else if (words === 3) colorClass = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                                else if (words >= 4) colorClass = 'bg-pink-500/10 text-pink-400 border-pink-500/20';

                                return (
                                  <span 
                                    key={idx} 
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, idx)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDropKeyword(e, idx)}
                                    className={`px-2 py-1 rounded text-xs border ${colorClass} flex items-center gap-1 group cursor-grab active:cursor-grabbing hover:border-opacity-100 transition-all ${
                                        draggedIndex === idx ? 'opacity-50' : 'opacity-100'
                                    }`}
                                  >
                                    {kw.trim()}
                                    <X size={10} className="opacity-0 group-hover:opacity-100 cursor-pointer" onClick={() => {
                                      // Remove logic using the centralized update function
                                      const currentKeywords = activeFile.metadata.keywords.split(',').map(k => k.trim()).filter(k => k);
                                      const newKws = currentKeywords.filter((_, i) => i !== idx).join(', ');
                                      updateFileKeywords(activeFile.id, newKws);
                                    }}/>
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-sm italic">Keywords will appear here...</span>
                          )}
                        </div>
                        
                        {activeFile.keywordAnalysis.total !== TARGET_KEYWORD_COUNT && activeFile.status === 'complete' && (
                          <div className="flex items-center gap-2 text-amber-500 text-xs mt-2">
                            <AlertCircle size={12} />
                            <span>Warning: Keyword count is {activeFile.keywordAnalysis.total} (Target: {TARGET_KEYWORD_COUNT}). Adobe allows up to 50.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
            </div>
          )}
        </div>

      </main>

      {/* 4. FOOTER */}
      <footer className={`py-6 text-center text-xs ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
        <div className="flex justify-center items-center gap-6 mb-2">
            <span className="font-bold cursor-default">Legal</span>
            <button onClick={() => setActiveLegalModal('disclaimer')} className="hover:text-indigo-500 transition-colors">Disclaimer</button>
            <button onClick={() => setActiveLegalModal('privacy')} className="hover:text-indigo-500 transition-colors">Privacy Policy</button>
            <button onClick={() => setActiveLegalModal('terms')} className="hover:text-indigo-500 transition-colors">Terms of Services</button>
        </div>
        <p className="mb-1">© 2025-2026 Hacky MetaGen. All rights reserved.</p>
        <p className="opacity-75">Hacky MetaGen is not affiliated with or endorsed by Adobe Inc.</p>
      </footer>

      {/* FIXED BOTTOM BAR (Only in Batch View) */}
      {viewMode === 'batch' && (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#0f172a] text-white shadow-[0_-8px_24px_rgba(0,0,0,0.2)] flex items-center justify-between px-6 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check size={18} className="text-green-500" />
            </div>
            <span className="font-medium">
              {completeFiles.length}/{files.length} files completed
            </span>
          </div>
          
          <button 
            onClick={() => handleExportCSV()}
            disabled={completeFiles.length === 0}
            className={`px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              completeFiles.length > 0 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            Download Adobe CSV
            <Download size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
