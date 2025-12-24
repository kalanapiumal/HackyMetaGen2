import React, { useState, useRef, useEffect } from 'react';
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
  Maximize2
} from 'lucide-react';

/**
 * Hacky MetaGen 1.1 - Adobe Stock Metadata Generator
 * Built with React + Tailwind CSS + Gemini API
 */

const HackyMetaGenApp = () => {
  // --- State Management ---
  const [theme, setTheme] = useState('dark');
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [contentType, setContentType] = useState('image'); // image, video, vector
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState('batch'); // Changed default to 'batch'
  const [copiedId, setCopiedId] = useState(null); // To track which element triggered copy
  
  // Animation State for Feature Badge
  const [featureIndex, setFeatureIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState('opacity-100 translate-y-0');
  
  const features = [
    "Batch Processing Support",
    "CSV FileName Extension Selection Support"
  ];

  // Feature Badge Animation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeClass('opacity-0 -translate-y-2');
      setTimeout(() => {
        setFeatureIndex((prev) => (prev + 1) % features.length);
        setFadeClass('opacity-100 translate-y-0');
      }, 300);
    }, 5000); // Increased from 3000 to 5000 for slower animation
    return () => clearInterval(interval);
  }, []);
  
  // API Key Handling: Support both environment injection and user input
  const [userApiKey, setUserApiKey] = useState(''); 
  const envApiKey = ""; // The execution environment provides the key at runtime
  
  const fileInputRef = useRef(null);

  // Load API Key from local storage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('hackymetagen_api_key');
    if (savedKey) setUserApiKey(savedKey);
  }, []);

  const handleApplyKey = () => {
    if (userApiKey.trim()) {
      localStorage.setItem('hackymetagen_api_key', userApiKey);
      alert("API Key saved to browser storage!");
    }
  };

  // --- Configuration & Constants ---
  const MAX_TITLE_LENGTH = 125;
  const MIN_TITLE_LENGTH = 100; // Soft limit for validation
  const TARGET_KEYWORD_COUNT = 49;

  // --- Helper: Toggle Theme ---
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // --- Helper: Handle File Upload ---
  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    
    const newFiles = uploadedFiles.map(file => {
      let fileName = file.name;
      const isMov = fileName.toLowerCase().endsWith('.mov');

      // Logic: If image, default to .ai extension
      // EXCEPTION: If the file is .mov, preserve it regardless of current tab (per user rule)
      if (contentType === 'image' && !isMov) {
        // Replace current extension with .ai for default selection
        fileName = fileName.replace(/\.[^/.]+$/, "") + ".ai";
      }

      return {
        id: crypto.randomUUID(),
        file,
        name: fileName, // Store the modified name
        preview: URL.createObjectURL(file),
        type: contentType,
        status: 'pending', // pending, processing, complete, error
        metadata: {
          title: '',
          keywords: ''
        },
        keywordAnalysis: { short: 0, mid: 0, long: 0, total: 0 }
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
    if (!selectedFileId && newFiles.length > 0) {
      setSelectedFileId(newFiles[0].id);
    }
  };

  // --- Helper: Remove File ---
  const removeFile = (id, e) => {
    e.stopPropagation();
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFileId === id) {
      setSelectedFileId(null);
    }
  };

  // --- Helper: Update File Extension ---
  const updateFileExtension = (id, newExt) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== id) return f;
      // Regex to replace the extension at the end of the string
      const newName = f.name.replace(/\.[^/.]+$/, "") + "." + newExt;
      return { ...f, name: newName };
    }));
  };

  // --- Helper: Extract Video Frame ---
  // This extracts a thumbnail from a video file to send to the AI instead of the whole video
  const extractVideoFrame = (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const url = URL.createObjectURL(file);

      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";

      // When metadata loads, seek to 1 second (or 10% if short) to catch action
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1.0, video.duration > 0 ? video.duration * 0.1 : 0);
      };

      // When seek completes, draw frame
      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64 jpeg (standard quality)
        // .split(',')[1] removes the "data:image/jpeg;base64," prefix
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        
        // Clean up
        URL.revokeObjectURL(url);
        resolve(base64);
      };

      video.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load video for frame extraction"));
      };
    });
  };

  // --- Core: API Call Logic ---
  const performGeneration = async (fileObj) => {
    // 1. Setup API Key
    const activeKey = userApiKey || envApiKey;
    
    // Note: Removed client-side validation for empty API key to allow environment variables/proxies to function.

    // 2. Determine File Type & Process Content
    let mimeType = '';
    let base64Data = '';
    const ext = fileObj.file.name.split('.').pop().toLowerCase();
    
    // Check if it's a video based on mime type or extension
    const isVideo = fileObj.file.type.startsWith('video/') || ['mov', 'mp4', 'avi', 'webm', 'mkv'].includes(ext);

    if (isVideo) {
        // Video Path: Extract Frame
        try {
            base64Data = await extractVideoFrame(fileObj.file);
            // We are sending a JPEG image of the video frame to the AI
            mimeType = 'image/jpeg'; 
        } catch (err) {
            console.error("Video processing failed:", err);
            throw new Error(`Video processing error: ${err.message}`);
        }
    } else {
        // Image/Vector Path: Direct Upload
        
        // 2a. Validation: File Size (Only for non-video files where we upload the whole file)
        if (fileObj.file.size > 20 * 1024 * 1024) {
            throw new Error("File too large. Images/Vectors must be under 20MB.");
        }

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

        // Detect Mime Type
        mimeType = fileObj.file.type;
        if (!mimeType || mimeType === '') {
            if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
            else if (ext === 'png') mimeType = 'image/png';
            else if (ext === 'webp') mimeType = 'image/webp';
            else if (ext === 'ai' || ext === 'eps') {
                // Warning: Browsers can't inherently parse AI/EPS. 
                // We'll try generic binary, but this might fail if model expects visual.
                // Best practice is uploading PNG previews for vectors.
                mimeType = 'image/png'; // Fallback hope
            }
        }
    }

    const systemPrompt = `
      You are Hacky MetaGen 1.0, a senior SEO expert for Adobe Stock.
      Your goal is to generate metadata for this ${fileObj.type} to maximize discoverability.
      ${isVideo ? "Note: The input provided is a representative visual frame extracted from a video file." : ""}
      
      STRICT RULES:
      1. **Title**: 100-125 characters. Natural, readable, descriptive. Include high-value keywords. NO keyword stuffing.
      
      2. **Keywords**: Generate EXACTLY 49 keywords. Comma-separated string.
         
         **ADOBE STOCK RANKING OPTIMIZATION (CRITICAL):**
         - **The first 5-10 keywords MUST be the most impactful, highly relevant, and descriptive terms.** This primarily determines search ranking.
         - Start with the absolute main subject, core concept, and primary visual elements.
         - Do NOT start with generic terms (like "vector", "illustration", "background") unless they are the primary intent.
         
         **DISTRIBUTION REQUIREMENTS (After the top 10 prioritized keywords):**
         - **Short-tail (1-2 words)**: ~12-13 keywords (25-30%)
         - **Mid-tail (2-3 words)**: ~21-22 keywords (40-45%)
         - **Long-tail (4+ words)**: ~15 keywords (30%)
         
         **CONTENT RULES:**
         - NO brand names, trademarks, or personal names.
         - Describe the subject, style, mood, lighting, and concept.
      
      OUTPUT FORMAT (JSON ONLY):
      {
        "title": "string",
        "keywords": "string (comma separated)"
      }
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${activeKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: systemPrompt },
            { inlineData: { mimeType: mimeType, data: base64Data } }
          ]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    // Robust API error check
    if (!response.ok) {
        let errorMsg = `API Error: ${response.status} ${response.statusText}`;
        try {
            const errorData = await response.json();
            if (errorData.error && errorData.error.message) {
                errorMsg = `API Error: ${errorData.error.message}`;
            }
        } catch (e) {
            // Ignore json parse error on error response
        }
        throw new Error(errorMsg);
    }

    // Safely parse JSON
    let data;
    try {
        data = await response.json();
    } catch (e) {
        throw new Error("Invalid JSON response from API");
    }

    if (data.error) throw new Error(data.error.message);
    
    // Safety check for candidates
    if (!data.candidates || !data.candidates[0]) {
       throw new Error("No candidates returned from AI");
    }

    const candidate = data.candidates[0];
    
    // Check for safety blocks
    if (candidate.finishReason === "SAFETY") {
        throw new Error("Generation blocked by safety settings");
    }

    // Check content parts
    if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
       throw new Error("No content generated");
    }

    let resultText = candidate.content.parts[0].text;
    
    if (!resultText) {
        throw new Error("Empty AI response text");
    }

    // Robust JSON parsing: Find the first '{' and last '}' to extract valid JSON
    const firstBrace = resultText.indexOf('{');
    const lastBrace = resultText.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      resultText = resultText.substring(firstBrace, lastBrace + 1);
    } else {
      // Fallback cleanup
      resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    
    if (!resultText.trim()) {
       throw new Error("No JSON found in response");
    }

    try {
      return JSON.parse(resultText);
    } catch (e) {
      console.error("JSON Parse Error. Raw Text:", resultText);
      throw new Error("Failed to parse AI response.");
    }
  };

  // --- Core: UI Triggered Generation ---
  const generateMetadata = async (fileObj) => {
    if (!fileObj) return;

    setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'processing' } : f));
    
    try {
      const jsonResult = await performGeneration(fileObj);

      // Analyze Keywords
      const kwArray = jsonResult.keywords.split(',').map(k => k.trim());
      const analysis = {
        short: kwArray.filter(k => k.split(' ').length <= 2).length,
        mid: kwArray.filter(k => k.split(' ').length === 3).length,
        long: kwArray.filter(k => k.split(' ').length >= 4).length,
        total: kwArray.length
      };

      setFiles(prev => prev.map(f => 
        f.id === fileObj.id ? { 
          ...f, 
          status: 'complete', 
          metadata: jsonResult,
          keywordAnalysis: analysis
        } : f
      ));

    } catch (error) {
      console.error("Generation Error:", error);
      // Removed generic alert to allow per-item error status
      // You can add a toast notification system here if desired
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'error' } : f));
    }
  };

  // --- Core: Batch Generation & Auto Export ---
  const handleGenerateAll = async () => {
    setIsProcessing(true);
    
    // 1. Identify files to process
    const pendingFiles = files.filter(f => f.status !== 'complete');
    
    // If no files to process, just return (removed auto-export)
    if (pendingFiles.length === 0) {
      setIsProcessing(false);
      return;
    }

    // Update status to processing visually
    setFiles(prev => prev.map(f => f.status !== 'complete' ? { ...f, status: 'processing' } : f));

    try {
      // 2. Process all pending files in parallel with incremental updates
      await Promise.all(pendingFiles.map(async (file) => {
        try {
          const jsonResult = await performGeneration(file);
          const kwArray = jsonResult.keywords.split(',').map(k => k.trim());
          const analysis = {
            short: kwArray.filter(k => k.split(' ').length <= 2).length,
            mid: kwArray.filter(k => k.split(' ').length === 3).length,
            long: kwArray.filter(k => k.split(' ').length >= 4).length,
            total: kwArray.length
          };
          
          // Update State Incrementally (Show complete ones first)
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { 
              ...f, 
              status: 'complete', 
              metadata: jsonResult,
              keywordAnalysis: analysis
            } : f
          ));

        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'error' } : f));
        }
      }));

    } catch (err) {
      console.error("Batch processing error", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Export Logic ---
  const handleExportCSV = (filesToExport = files) => {
    // Format: Filename,Title,Keywords,Category
    const csvHeader = "Filename,Title,Keywords,Category\n";
    
    const csvRows = filesToExport.map(f => {
      // We allow exporting even if error, but fields will be empty
      if (f.status === 'pending' || f.status === 'processing') return null;

      // Escape quotes for CSV
      const title = `"${f.metadata.title ? f.metadata.title.replace(/"/g, '""') : ''}"`;
      const keywords = `"${f.metadata.keywords ? f.metadata.keywords.replace(/"/g, '""') : ''}"`;
      const filename = f.name; // Updated to use the modified name (.ai or .mov)
      const category = 8; // Hardcoded
      
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
    // Create a temporary textarea element
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Ensure it's not visible but part of the DOM
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    
    // Select the text
    textArea.focus();
    textArea.select();
    
    try {
      // Execute the copy command
      document.execCommand('copy');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
    
    // Remove the textarea
    document.body.removeChild(textArea);

    // Trigger visual feedback
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  // --- Render Components ---

  const activeFile = files.find(f => f.id === selectedFileId);
  const completeFiles = files.filter(f => f.status === 'complete');
  const allFilesComplete = files.length > 0 && files.every(f => f.status === 'complete');

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 pb-20 ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* 1. HEADER */}
      <header className={`px-6 py-4 flex items-center justify-between border-b ${theme === 'dark' ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">H</div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Hacky MetaGen <span className="text-xs align-top bg-indigo-500/20 text-indigo-500 px-1.5 py-0.5 rounded ml-1">1.1</span></h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* API Key Input & Apply Button */}
          <div className="flex items-center gap-2">
            <input 
              type="password" 
              placeholder="Enter Gemini API Key" 
              value={userApiKey}
              onChange={(e) => setUserApiKey(e.target.value)}
              className={`text-xs px-3 py-2 rounded-lg border transition-all w-32 focus:w-64 ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500' 
                  : 'bg-slate-100 border-slate-300 text-slate-900 focus:border-indigo-500'
              }`}
            />
            <button 
              onClick={handleApplyKey}
              className={`p-2 rounded-lg border transition-colors ${
                theme === 'dark' 
                  ? 'border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-green-400' 
                  : 'border-slate-300 hover:bg-slate-100 text-slate-600 hover:text-green-600'
              }`}
              title="Apply & Save API Key"
            >
              <Check size={14} />
            </button>
          </div>

          <div className={`w-px h-6 mx-2 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-slate-800/50 hover:bg-slate-800 rounded-full border border-slate-700 transition-all">
            <HelpCircle size={16} className="text-indigo-400" />
            <span>Help</span>
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      {files.length === 0 && (
        <div className="max-w-4xl mx-auto mt-12 px-6 text-center mb-12">
          {/* Animated Feature Badge */}
          <span className={`inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-indigo-400 uppercase bg-indigo-500/10 rounded-full border border-indigo-500/20 transition-all duration-300 transform ${fadeClass}`}>
            New Feature: {features[featureIndex]}
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>Adobe Stock</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Metadata Generator</span>
          </h2>
          <p className={`text-lg max-w-2xl mx-auto mb-8 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Total automation for your image, video, & vector assets. Just upload, let AI handle the rest. 
            Optimized for Adobe Stock SEO.
          </p>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <main className="max-w-7xl mx-auto px-4 pb-12 flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
        
        {/* LEFT COLUMN: Upload & Batch List */}
        <div className={`w-full ${viewMode === 'batch' ? 'hidden lg:block lg:w-1/4' : 'lg:w-1/3'} flex flex-col gap-4 transition-all duration-300`}>
          
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
            className={`flex-1 min-h-[120px] max-h-[160px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group ${
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
            <p className="text-xs text-slate-500">or click to browse</p>
          </div>

          {/* Batch List */}
          <div className={`flex-1 overflow-y-auto rounded-xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-800' : 'bg-white border-slate-200'} p-2 space-y-2`}>
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
                  {viewMode === 'batch' ? 'Open Editor' : 'Batch Review'}
                </button>

              <div className="flex gap-2">
                <button 
                  onClick={handleGenerateAll}
                  disabled={isProcessing}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                  {isProcessing ? 'Processing...' : 'Generate All'}
                </button>
                <button 
                  onClick={() => handleExportCSV()}
                  className={`px-4 rounded-xl border flex items-center justify-center transition-colors ${
                    allFilesComplete
                      ? 'bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-lg shadow-green-500/20'
                      : theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
                  }`}
                  title="Export CSV manually"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: View Switcher (Editor OR Batch Review) */}
        <div className={`w-full ${viewMode === 'batch' ? 'lg:w-3/4' : 'lg:w-2/3'} flex flex-col rounded-xl overflow-hidden transition-all duration-300`}>
          
          {viewMode === 'batch' ? (
            /* --- BATCH REVIEW GRID (Review & Polish) --- */
            <div className="h-full flex flex-col">
              <div className="mb-6">
                <h3 className="text-2xl font-bold">Batch Review</h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Review metadata per image</p>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 pb-24">
                {files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl border-slate-700">
                    <p className="text-slate-500">No completed files to review yet.</p>
                    <p className="text-xs text-slate-600 mt-1">Click "Generate All" to start.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {files.map(file => {
                      const currentExt = file.name.split('.').pop().toLowerCase();
                      
                      // Determine available extensions based on file type
                      const extensions = file.type === 'video' 
                        ? ['mov', 'mp4'] 
                        : file.type === 'vector' 
                          ? ['ai', 'eps', 'svg'] 
                          : ['ai', 'png', 'jpg'];

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
                            <button onClick={() => { setSelectedFileId(file.id); setViewMode('editor'); }} className="text-slate-400 hover:text-indigo-400">
                              <Maximize2 size={14} />
                            </button>
                          </div>

                          {/* Image */}
                          <div className="aspect-square bg-[#f6f7fb] w-full flex items-center justify-center p-4 relative overflow-hidden">
                            <img 
                              src={file.preview} 
                              alt="preview" 
                              className={`max-w-full max-h-full object-contain shadow-sm transition-all duration-300 ${
                                file.status === 'processing' ? 'blur-md opacity-50 scale-105' : ''
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
                              <div className="text-sm font-medium">Graphic Resources</div>
                            </div>
                          </div>

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
                            <div className="text-xs truncate" title={file.name}>
                              {file.name}
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
                            <button onClick={() => copyToClipboard(activeFile.metadata.keywords)} className="text-slate-500 hover:text-white"><Copy size={14}/></button>
                          </div>
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
                                  <span key={idx} className={`px-2 py-1 rounded text-xs border ${colorClass} flex items-center gap-1 group cursor-pointer hover:border-opacity-100`}>
                                    {kw.trim()}
                                    <X size={10} className="opacity-0 group-hover:opacity-100" onClick={() => {
                                      // Simple remove logic for demo
                                      const newKws = activeFile.metadata.keywords.split(',').filter((_, i) => i !== idx).join(',');
                                      setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, metadata: { ...f.metadata, keywords: newKws } } : f));
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

export default HackyMetaGenApp;