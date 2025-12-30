import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Plus,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Shield,
  Activity,
  Scale,
  ZapOff
} from 'lucide-react';

/**
 * Hacky MetaGen 3.7 - Adobe Stock Metadata Generator
 * Built with React + Tailwind CSS + Gemini API
 */

// --- Constants ---
const MAX_TITLE_LENGTH = 125;
const MIN_TITLE_LENGTH = 100; 
const TARGET_KEYWORD_COUNT = 49;

const ADOBE_CATEGORIES = [
  { id: 1, name: "Animals" }, { id: 2, name: "Buildings and Architecture" },
  { id: 3, name: "Business" }, { id: 4, name: "Drinks" },
  { id: 5, name: "The Environment" }, { id: 6, name: "States of Mind" },
  { id: 7, name: "Food" }, { id: 8, name: "Graphic Resources" },
  { id: 9, name: "Hobbies and Leisure" }, { id: 10, name: "Industry" },
  { id: 11, name: "Landscape" }, { id: 12, name: "Lifestyle" },
  { id: 13, name: "People" }, { id: 14, name: "Plants and Flowers" },
  { id: 15, name: "Culture and Religion" }, { id: 16, name: "Science" },
  { id: 17, name: "Social Issues" }, { id: 18, name: "Sports" },
  { id: 19, name: "Technology" }, { id: 20, name: "Transport" },
  { id: 21, name: "Travel" },
];

const LEGAL_CONTENT = {
  disclaimer: {
    title: "Disclaimer",
    icon: <AlertTriangle size={24} className="text-amber-500" />,
    content: (
      <div className="space-y-4 text-left">
        <p><strong>1. No Affiliation:</strong> Hacky MetaGen is an independent tool and is NOT affiliated with Adobe Inc.</p>
        <p><strong>2. AI Accuracy:</strong> Prediction results are estimations and do not guarantee acceptance.</p>
      </div>
    )
  },
  privacy: {
    title: "Privacy Policy",
    icon: <Shield size={24} className="text-green-500" />,
    content: (
      <div className="space-y-4 text-left">
        <p><strong>1. Data:</strong> Images are processed in your browser memory. We do not store your assets.</p>
        <p><strong>2. Keys:</strong> API keys are stored in your browser's local storage only.</p>
      </div>
    )
  },
  terms: {
    title: "Terms of Service",
    icon: <Scale size={24} className="text-blue-500" />,
    content: (
      <div className="space-y-4 text-left">
        <p><strong>1. Use:</strong> You agree to use the service for legal stock metadata generation only.</p>
        <p><strong>2. Rights:</strong> You retain all ownership of your uploaded content.</p>
      </div>
    )
  }
};

// --- Sub-Components ---
const StatCard = ({ label, value, icon, color, bgColor, theme }) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
    theme === 'dark' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
  }`}>
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bgColor}`}>
      <span className={color}>{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate leading-none mb-1">{label}</p>
      <p className={`text-xl font-bold leading-none ${color}`}>{value}</p>
    </div>
  </div>
);

const HackyMetaGenApp = () => {
  // 1. State Declarations
  const [theme, setTheme] = useState(() => localStorage.getItem('hackymetagen_theme') || 'dark');
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [contentType, setContentType] = useState('image'); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState('batch'); 
  const [copiedId, setCopiedId] = useState(null);  
  const [newKeyword, setNewKeyword] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);

  const [isAutoGenerate, setIsAutoGenerate] = useState(() => {
    const saved = localStorage.getItem('hackymetagen_auto_generate');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [useAiCategory, setUseAiCategory] = useState(() => {
    const saved = localStorage.getItem('hackymetagen_use_ai_category');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [csvExtension, setCsvExtension] = useState(() => localStorage.getItem('hackymetagen_csv_extension') || 'jpg');
  const [preserveExtension, setPreserveExtension] = useState(() => {
    const saved = localStorage.getItem('hackymetagen_preserve_extension');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [useCanvasKey, setUseCanvasKey] = useState(() => {
    const saved = localStorage.getItem('hackymetagen_use_canvas_key');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [userApiKey, setUserApiKey] = useState(''); 
  const [isKeySaved, setIsKeySaved] = useState(false); 
  const [isKeyInvalid, setIsKeyInvalid] = useState(false); 
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); 
  const [showErrorMessage, setShowErrorMessage] = useState(false); 
  const [showTutorial, setShowTutorial] = useState(false); 
  const [showUnsupportedError, setShowUnsupportedError] = useState(false); 
  const [activeLegalModal, setActiveLegalModal] = useState(null); 
  const [isVerifying, setIsVerifying] = useState(false); 

  // UI State
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const [featureIndex, setFeatureIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState('opacity-100 translate-y-0');

  // Refs
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);
  const sessionId = useRef(0);
  const processingMutex = useRef(Promise.resolve());
  
  const csvExtensionRef = useRef(csvExtension);
  const preserveExtensionRef = useRef(preserveExtension);
  const filesRef = useRef(files); 
  const apiKeyRef = useRef(userApiKey); 
  const useCanvasKeyRef = useRef(useCanvasKey);

  const features = [
    { type: 'text', content: "Video Metadata Support" },
    { type: 'text', content: "CSV FileName Extension Support" },
    { type: 'jsx', content: "AI Approval Prediction Beta 0.5" }
  ];

  // Derived Statistics
  const stats = {
    total: files.length,
    completed: files.filter(f => f.status === 'complete').length,
    processing: files.filter(f => f.status === 'processing').length,
    accepted: files.filter(f => f.status === 'complete' && f.metadata.approval_status !== 'Rejected').length,
    rejected: files.filter(f => f.status === 'complete' && f.metadata.approval_status === 'Rejected').length,
    error: files.filter(f => f.status === 'error').length
  };

  // 2. Effects
  useEffect(() => { localStorage.setItem('hackymetagen_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('hackymetagen_auto_generate', JSON.stringify(isAutoGenerate)); }, [isAutoGenerate]);
  useEffect(() => { localStorage.setItem('hackymetagen_use_ai_category', JSON.stringify(useAiCategory)); }, [useAiCategory]);
  useEffect(() => { localStorage.setItem('hackymetagen_csv_extension', csvExtension); }, [csvExtension]);
  useEffect(() => { localStorage.setItem('hackymetagen_preserve_extension', JSON.stringify(preserveExtension)); }, [preserveExtension]);
  useEffect(() => { localStorage.setItem('hackymetagen_use_canvas_key', JSON.stringify(useCanvasKey)); }, [useCanvasKey]);
  
  useEffect(() => { csvExtensionRef.current = csvExtension; }, [csvExtension]);
  useEffect(() => { preserveExtensionRef.current = preserveExtension; }, [preserveExtension]);
  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => { apiKeyRef.current = userApiKey; }, [userApiKey]);
  useEffect(() => { useCanvasKeyRef.current = useCanvasKey; }, [useCanvasKey]);

  useEffect(() => {
    const savedKey = localStorage.getItem('hackymetagen_api_key');
    if (savedKey) {
      setIsKeySaved(true);
      setUserApiKey(savedKey); 
      apiKeyRef.current = savedKey;
    }
  }, []);

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

  // 3. Logic Functions
  const checkApiKeyValidity = async (key) => {
    if (!key) return false;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=1`);
      return response.ok;
    } catch (e) { return false; }
  };

  const handleApplyKey = async () => {
    const keyToTest = userApiKey.trim();
    if (!keyToTest) return;
    setIsVerifying(true);
    const isValid = await checkApiKeyValidity(keyToTest);
    setIsVerifying(false);
    if (isValid) {
        localStorage.setItem('hackymetagen_api_key', keyToTest);
        setIsKeySaved(true);
        setIsKeyInvalid(false);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 5000);
    } else {
        setIsKeyInvalid(true);
        setIsKeySaved(false);
        setShowErrorMessage(true);
        setTimeout(() => setShowErrorMessage(false), 5000);
    }
  };

  const handleToggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const generateThumbnail = async (file) => {
    const isVideo = file.type.startsWith('video/') || /\.(mov|mp4|avi|webm|mkv|mpg|mpeg)$/i.test(file.name);
    if (isVideo) {
      return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(file);
        video.muted = true;
        video.currentTime = 1;
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          resolve(canvas.toDataURL('image/jpeg'));
        };
        video.onerror = () => resolve(null);
      });
    } else { return URL.createObjectURL(file); }
  };

  const updateFileKeywords = (fileId, newKeywordsString) => {
    const kwArray = newKeywordsString.split(',').map(k => k.trim()).filter(k => k);
    const kwStats = {
      short: kwArray.filter(k => k.split(' ').length <= 2).length,
      mid: kwArray.filter(k => k.split(' ').length === 3).length,
      long: kwArray.filter(k => k.split(' ').length >= 4).length,
      total: kwArray.length
    };
    setFiles(prev => prev.map(f => f.id === fileId ? {
        ...f,
        metadata: { ...f.metadata, keywords: newKeywordsString },
        keywordAnalysis: kwStats
    } : f));
  };

  const extractVideoFrames = (file, frameCount = 5) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const url = URL.createObjectURL(file);
      video.src = url;
      video.muted = true;
      const frames = [];
      let currentFrame = 0;
      video.onloadedmetadata = () => {
        const step = video.duration / frameCount;
        const capture = () => {
          if (currentFrame >= frameCount) {
            URL.revokeObjectURL(url);
            resolve(frames);
            return;
          }
          video.currentTime = step * currentFrame + (step / 2);
        };
        video.onseeked = () => {
          canvas.width = 1280; canvas.height = 720;
          ctx.drawImage(video, 0, 0, 1280, 720);
          frames.push(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
          currentFrame++; capture();
        };
        capture();
      };
      video.onerror = () => reject(new Error("Video parsing failed"));
    });
  };

  const performGeneration = async (fileObj) => {
    const isCanvasMode = useCanvasKeyRef.current;
    let activeKey = apiKeyRef.current || localStorage.getItem('hackymetagen_api_key');

    let mimeType = 'image/jpeg';
    let base64Data = null;
    const isVideo = fileObj.type === 'video';

    if (isVideo) {
        base64Data = await extractVideoFrames(fileObj.file, 5);
    } else {
        base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(fileObj.file);
        });
        mimeType = fileObj.file.type || 'image/jpeg';
    }

    const categoriesString = ADOBE_CATEGORIES.map(c => `${c.id}. ${c.name}`).join('\n');
    const systemPrompt = `You are an Adobe Stock metadata expert. Output ONLY JSON: { "title": "100-125 chars descriptive", "keywords": "49 comma separated keywords", "category_id": integer, "approval_status": "Accepted" or "Rejected", "approval_reason": "string" }. Categories: ${categoriesString}`;

    const contentParts = [{ text: systemPrompt }];
    if (isVideo) {
      base64Data.forEach(d => contentParts.push({ inlineData: { mimeType, data: d } }));
    } else {
      contentParts.push({ inlineData: { mimeType, data: base64Data } });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: contentParts }],
            generationConfig: { responseMimeType: "application/json" }
        })
    });

    if (!response.ok) throw new Error("API call failed");
    const data = await response.json();
    let textResult = data.candidates[0].content.parts[0].text;
    textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(textResult);
  };

  const runBatchGeneration = async (filesToProcess) => {
    const nextChain = processingMutex.current.then(async () => {
      for (const file of filesToProcess) {
        try {
          const result = await performGeneration(file);
          const kwArray = result.keywords.split(',').map(k => k.trim());
          setFiles(prev => prev.map(f => f.id === file.id ? {
            ...f,
            status: 'complete',
            metadata: result,
            keywordAnalysis: { total: kwArray.length, short: 0, mid: 0, long: 0 },
            categoryId: useAiCategory ? (result.category_id || 8) : 8
          } : f));
        } catch (e) {
          setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'error', errorMessage: e.message } : f));
        }
      }
    });
    processingMutex.current = nextChain;
  };

  const processUploadedFiles = useCallback(async (uploadedFiles) => {
    const newFilesPromises = uploadedFiles.map(async (file) => {
      const preview = await generateThumbnail(file);
      const ext = file.name.split('.').pop().toLowerCase();
      const type = ['mov', 'mp4', 'avi'].includes(ext) ? 'video' : 'image';
      return {
        id: crypto.randomUUID(),
        file, name: file.name, preview, type,
        status: isAutoGenerate ? 'processing' : 'pending',
        categoryId: 8, metadata: { title: '', keywords: '' },
        keywordAnalysis: { total: 0 }
      };
    });
    const newFiles = await Promise.all(newFilesPromises);
    setFiles(prev => [...prev, ...newFiles]);
    if (isAutoGenerate) runBatchGeneration(newFiles);
  }, [isAutoGenerate, useAiCategory]);

  const handleExportCSV = () => {
    const csvHeader = "Filename,Title,Keywords,Category\n";
    const rows = files.filter(f => f.status === 'complete').map(f => {
      return `"${f.name}","${f.metadata.title.replace(/"/g, '""')}","${f.metadata.keywords.replace(/"/g, '""')}",${f.categoryId}`;
    }).join("\n");
    const blob = new Blob([csvHeader + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `stock_metadata.csv`; a.click();
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 pb-20 ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* HEADER */}
      <header className={`px-6 py-4 flex items-center justify-between border-b ${theme === 'dark' ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">H</div>
          <h1 className="font-bold text-lg hidden sm:inline">Hacky <span className="text-indigo-400">MetaGen</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="password" 
            placeholder="Gemini API Key"
            value={userApiKey}
            onChange={(e) => setUserApiKey(e.target.value)}
            className={`text-xs px-3 py-2 rounded-lg border w-32 focus:w-64 transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}
          />
          <button onClick={handleApplyKey} className="p-2 bg-indigo-600 rounded-lg text-white"><Check size={14}/></button>
          <button onClick={handleToggleTheme} className="p-2 rounded-full">{theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 flex flex-col gap-6">
        
        {/* FILE STATISTICS PANEL */}
        {files.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard label="Total Files" value={stats.total} icon={<FileText size={20}/>} color="text-blue-500" bgColor="bg-blue-500/10" theme={theme} />
            <StatCard label="Completed" value={stats.completed} icon={<Check size={20}/>} color="text-indigo-500" bgColor="bg-indigo-500/10" theme={theme} />
            <StatCard label="Processing" value={stats.processing} icon={<Activity size={20}/>} color="text-yellow-500" bgColor="bg-yellow-500/10" theme={theme} />
            <StatCard label="Likely Accepted" value={stats.accepted} icon={<ShieldCheck size={20}/>} color="text-green-500" bgColor="bg-green-500/10" theme={theme} />
            <StatCard label="Likely Rejected" value={stats.rejected} icon={<ShieldAlert size={20}/>} color="text-orange-500" bgColor="bg-orange-500/10" theme={theme} />
            <StatCard label="Errors" value={stats.error} icon={<AlertCircle size={20}/>} color="text-red-500" bgColor="bg-red-500/10" theme={theme} />
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT COLUMN */}
          <div className="w-full lg:w-1/3 flex flex-col gap-4">
            <div 
              onClick={() => fileInputRef.current.click()}
              className={`p-10 border-2 border-dashed rounded-xl flex flex-col items-center cursor-pointer hover:bg-indigo-500/5 transition-all ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'}`}
            >
              <input type="file" multiple className="hidden" ref={fileInputRef} onChange={(e) => processUploadedFiles(Array.from(e.target.files))} />
              <Upload size={32} className="text-indigo-500 mb-2" />
              <p className="font-medium text-sm">Drop assets here</p>
            </div>

            <div className={`flex-1 overflow-y-auto min-h-[300px] rounded-xl border p-2 space-y-2 ${theme === 'dark' ? 'bg-slate-800/30 border-slate-800' : 'bg-white'}`}>
              {files.map(f => (
                <div key={f.id} onClick={() => setSelectedFileId(f.id)} className={`p-2 rounded-lg flex items-center gap-3 cursor-pointer border ${selectedFileId === f.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-transparent'}`}>
                  <img src={f.preview} className="w-10 h-10 rounded object-cover shrink-0" alt="thumb" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{f.name}</p>
                    <span className="text-[9px] uppercase font-bold opacity-60">{f.status}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter(file => file.id !== f.id)); }} className="text-slate-500 hover:text-red-500">
                    <Trash2 size={12}/>
                  </button>
                </div>
              ))}
            </div>
            
            <button onClick={handleExportCSV} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
              <Download size={18}/> Export CSV
            </button>
          </div>

          {/* RIGHT COLUMN: EDITOR */}
          <div className={`flex-1 rounded-xl border p-6 ${theme === 'dark' ? 'bg-slate-800/30 border-slate-800' : 'bg-white'}`}>
            {selectedFileId ? (
              <div className="space-y-6">
                <div className="aspect-video max-h-48 bg-black/20 rounded-lg overflow-hidden flex items-center justify-center">
                   <img src={files.find(f => f.id === selectedFileId)?.preview} className="max-h-full" alt="preview" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">TITLE</label>
                  <textarea 
                    value={files.find(f => f.id === selectedFileId)?.metadata.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFiles(prev => prev.map(f => f.id === selectedFileId ? {...f, metadata: {...f.metadata, title: val}} : f));
                    }}
                    className={`w-full p-3 rounded-lg border bg-transparent text-sm ${theme === 'dark' ? 'border-slate-700' : ''}`}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">KEYWORDS ({files.find(f => f.id === selectedFileId)?.metadata.keywords.split(',').length || 0})</label>
                  <div className={`w-full p-4 rounded-lg border min-h-[120px] ${theme === 'dark' ? 'border-slate-700 bg-slate-900/40' : 'bg-slate-50'}`}>
                    <div className="flex flex-wrap gap-2">
                      {files.find(f => f.id === selectedFileId)?.metadata.keywords.split(',').map((kw, i) => (
                        <span key={i} className="px-2 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[11px]">
                          {kw.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <LayoutGrid size={48} />
                <p className="mt-2">Select a file from the list</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-12 py-8 border-t border-slate-800/50 text-center opacity-40 text-[10px]">
        <div className="flex justify-center gap-4 mb-2">
           <button onClick={() => setActiveLegalModal('disclaimer')}>Disclaimer</button>
           <button onClick={() => setActiveLegalModal('privacy')}>Privacy</button>
           <button onClick={() => setActiveLegalModal('terms')}>Terms</button>
        </div>
        <p>© 2025 Hacky MetaGen • Non-official Adobe Stock tool</p>
      </footer>

      {/* MODALS */}
      {activeLegalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className={`max-w-md w-full p-6 rounded-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold">{LEGAL_CONTENT[activeLegalModal].title}</h3>
                 <button onClick={() => setActiveLegalModal(null)}><X size={20}/></button>
              </div>
              <div className="text-sm opacity-80">{LEGAL_CONTENT[activeLegalModal].content}</div>
           </div>
        </div>
      )}
    </div>
  );
};

export default HackyMetaGenApp;
