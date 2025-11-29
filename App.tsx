import React, { useState, useEffect } from 'react';
import { Controls } from './components/Controls';
import { ImageDisplay } from './components/ImageDisplay';
import { Dashboard } from './components/Dashboard';
import { ImageEditor } from './components/ImageEditor';
import { AspectRatio, AppMode, ImageModel, ImageResolution, GeneratedContent } from './types';
import { generateImage, editImage, generateVideo, animateImage, upscaleImage } from './services/geminiService';
import { Github, Info, LayoutGrid, PlusCircle, Sparkles } from 'lucide-react';

// Extend window for AI Studio API
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.Square);
  
  // Content State
  const [currentContent, setCurrentContent] = useState<string | null>(null);
  const [isContentVideo, setIsContentVideo] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // History & Navigation State
  const [history, setHistory] = useState<GeneratedContent[]>([]);
  const [view, setView] = useState<'generator' | 'dashboard'>('generator');
  const [isEditingInStudio, setIsEditingInStudio] = useState<boolean>(false);
  const [isEditorProcessing, setIsEditorProcessing] = useState<boolean>(false);
  
  // Config States
  const [mode, setMode] = useState<AppMode>(AppMode.TextToImage);
  const [imageModel, setImageModel] = useState<ImageModel>(ImageModel.Flash);
  const [imageResolution, setImageResolution] = useState<ImageResolution>(ImageResolution.Res1K);
  
  const [error, setError] = useState<string | null>(null);

  // Auto-switch mode logic based on content availability
  useEffect(() => {
    if (currentContent && !isContentVideo) {
      // If we have an image, we could enable image input modes, 
      // but let's keep user control unless they uploaded explicitly
    }
  }, [currentContent, isContentVideo]);

  const addToHistory = (data: string, isVideo: boolean, promptUsed: string) => {
     const newItem: GeneratedContent = {
       id: Date.now().toString(),
       data,
       mimeType: isVideo ? 'video/mp4' : 'image/png',
       prompt: promptUsed,
       timestamp: Date.now(),
       isVideo
     };
     setHistory(prev => [newItem, ...prev]);
  };

  const checkApiKey = async () => {
    // Veo and Pro models require paid API key selection
    if (imageModel === ImageModel.Pro || mode === AppMode.TextToVideo || mode === AppMode.ImageToVideo) {
       try {
         const hasKey = await window.aistudio.hasSelectedApiKey();
         if (!hasKey) {
            await window.aistudio.openSelectKey();
         }
       } catch (e) {
         console.warn("AI Studio key selection not available", e);
       }
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && mode !== AppMode.ImageToVideo) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      await checkApiKey();

      let result;
      
      switch (mode) {
        case AppMode.TextToImage:
          result = await generateImage(prompt, aspectRatio, imageModel, imageResolution);
          setIsContentVideo(false);
          break;
          
        case AppMode.ImageToImage:
          if (!currentContent || isContentVideo) throw new Error("No valid image to edit.");
          result = await editImage(currentContent, prompt);
          setIsContentVideo(false);
          break;

        case AppMode.TextToVideo:
          result = await generateVideo(prompt, aspectRatio);
          setIsContentVideo(true);
          break;

        case AppMode.ImageToVideo:
          if (!currentContent || isContentVideo) throw new Error("No valid image to animate.");
          result = await animateImage(currentContent, prompt, aspectRatio);
          setIsContentVideo(true);
          break;
      }

      if (result) {
        setCurrentContent(result.data);
        addToHistory(result.data, !!(mode === AppMode.TextToVideo || mode === AppMode.ImageToVideo), prompt);
      }

    } catch (err: any) {
      console.error(err);
      let msg = err.message || "Something went wrong.";
      if (msg.includes("Requested entity was not found")) {
        msg = "API Key issue. Please try selecting your key again.";
        try { await window.aistudio.openSelectKey(); } catch {}
      }
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        setCurrentContent(base64Data);
        setIsContentVideo(false);
        setMode(AppMode.ImageToImage); // Auto switch to edit mode
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearCanvas = () => {
    setCurrentContent(null);
    setIsContentVideo(false);
    setMode(AppMode.TextToImage);
    setPrompt('');
    setError(null);
  };

  // Studio Handlers
  const openStudio = () => setIsEditingInStudio(true);
  const closeStudio = () => setIsEditingInStudio(false);
  
  const saveStudioEdit = (newData: string) => {
    setCurrentContent(newData);
    // Add edited version to history as a new item
    addToHistory(newData, false, `${prompt} (Edited)`);
    closeStudio();
  };

  // Handle AI edits inside the studio (e.g. Remove Background)
  const handleAiEdit = async (currentImageData: string, magicPrompt: string): Promise<string> => {
    setIsEditorProcessing(true);
    try {
      await checkApiKey();
      const result = await editImage(currentImageData, magicPrompt);
      return result.data;
    } catch (error: any) {
      console.error("AI Edit Failed", error);
      throw error;
    } finally {
      setIsEditorProcessing(false);
    }
  };

  // Handle AI Upscaling
  const handleAiUpscale = async (currentImageData: string, resolution: ImageResolution): Promise<string> => {
    setIsEditorProcessing(true);
    try {
      // Upscaling uses Pro model, so mandatory key check
      try {
         const hasKey = await window.aistudio.hasSelectedApiKey();
         if (!hasKey) {
            await window.aistudio.openSelectKey();
         }
       } catch (e) {
         console.warn("AI Studio key selection not available", e);
       }

      const result = await upscaleImage(currentImageData, resolution);
      return result.data;
    } catch (error: any) {
      console.error("AI Upscale Failed", error);
      throw error;
    } finally {
      setIsEditorProcessing(false);
    }
  };

  // Dashboard Handlers
  const selectFromHistory = (item: GeneratedContent) => {
    setCurrentContent(item.data);
    setIsContentVideo(!!item.isVideo);
    setPrompt(item.prompt);
    setView('generator');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
         <div className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl opacity-60"></div>
         <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl opacity-60"></div>
         <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-pink-100/40 rounded-full blur-3xl opacity-60"></div>
      </div>

      {/* Navigation Header */}
      <header className="w-full max-w-6xl flex items-center justify-between mb-8 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl shadow-xl flex items-center justify-center text-white">
            <Sparkles size={20} className="text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight hidden sm:block">
            NanoGen <span className="text-indigo-600">AI</span>
          </h1>
        </div>

        <div className="flex bg-white/80 backdrop-blur-md p-1.5 rounded-xl shadow-sm border border-slate-200/60">
          <button 
            onClick={() => setView('generator')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${view === 'generator' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
          >
            <PlusCircle size={16} /> <span className="hidden sm:inline">Generator</span>
          </button>
          <button 
            onClick={() => setView('dashboard')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${view === 'dashboard' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
          >
            <LayoutGrid size={16} /> <span className="hidden sm:inline">Dashboard</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full flex flex-col items-center gap-8 relative z-10 flex-1 max-w-7xl mx-auto transition-all duration-300">
        
        {isEditingInStudio && currentContent && (
          <ImageEditor 
            imageData={currentContent} 
            onSave={saveStudioEdit} 
            onCancel={closeStudio}
            onAiEdit={handleAiEdit}
            onAiUpscale={handleAiUpscale}
            isProcessing={isEditorProcessing}
          />
        )}

        {view === 'dashboard' ? (
          <Dashboard 
            history={history} 
            onSelect={selectFromHistory} 
            onBack={() => setView('generator')}
          />
        ) : (
          <div className="w-full flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {error && (
              <div className="w-full max-w-2xl bg-red-50/90 backdrop-blur border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-sm flex items-start gap-3">
                <Info className="shrink-0 mt-0.5" size={18} />
                <p className="text-sm font-medium leading-tight">{error}</p>
              </div>
            )}

            <div className="text-center space-y-2">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                Create with Speed.
              </h2>
              <p className="text-slate-500 text-lg max-w-lg mx-auto">
                Generate visuals with Gemini 2.5 & Veo, then refine with professional tools.
              </p>
            </div>

            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="w-full">
                <Controls 
                  prompt={prompt}
                  setPrompt={setPrompt}
                  aspectRatio={aspectRatio}
                  setAspectRatio={setAspectRatio}
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                  mode={mode}
                  setMode={setMode}
                  imageModel={imageModel}
                  setImageModel={setImageModel}
                  imageResolution={imageResolution}
                  setImageResolution={setImageResolution}
                  hasReferenceImage={!!currentContent && !isContentVideo}
                  onClearImage={clearCanvas}
                />
              </div>

              <div className="w-full sticky top-8">
                <ImageDisplay 
                  contentData={currentContent}
                  isVideo={isContentVideo}
                  isLoading={isGenerating}
                  onImageUpload={handleImageUpload}
                  onEditInStudio={!isContentVideo && currentContent ? openStudio : undefined}
                />
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-20 pb-8 text-center text-slate-400 text-sm flex flex-col items-center gap-4">
        <div className="h-px w-full max-w-xs bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-slate-700 transition-colors flex items-center gap-2">
            <Github size={16} />
            <span>Source Code</span>
          </a>
          <span>&copy; {new Date().getFullYear()} NanoGen AI</span>
        </div>
      </footer>
    </div>
  );
};

export default App;