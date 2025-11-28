import React, { useState, useEffect } from 'react';
import { Controls } from './components/Controls';
import { ImageDisplay } from './components/ImageDisplay';
import { Dashboard } from './components/Dashboard';
import { ImageEditor } from './components/ImageEditor';
import { AspectRatio, AppMode, ImageModel, ImageResolution, GeneratedContent } from './types';
import { generateImage, editImage, generateVideo, animateImage } from './services/geminiService';
import { Github, Info, LayoutGrid, PlusCircle } from 'lucide-react';

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
      // If we have an image, enable image input modes
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

  // Dashboard Handlers
  const selectFromHistory = (item: GeneratedContent) => {
    setCurrentContent(item.data);
    setIsContentVideo(!!item.isVideo);
    setPrompt(item.prompt);
    setView('generator');
  };

  return (
    <div className="min-h-screen bg-indigo-50/50 flex flex-col items-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Navigation Header */}
      <header className="w-full max-w-6xl flex items-center justify-between mb-8 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-xl shadow-lg flex items-center justify-center text-white font-bold text-xl">
            N
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight hidden sm:block">
            NanoGen
          </h1>
        </div>

        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          <button 
            onClick={() => setView('generator')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${view === 'generator' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <PlusCircle size={16} /> Generator
          </button>
          <button 
            onClick={() => setView('dashboard')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${view === 'dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LayoutGrid size={16} /> Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full flex flex-col items-center gap-6 relative z-10 flex-1">
        
        {isEditingInStudio && currentContent && (
          <ImageEditor 
            imageData={currentContent} 
            onSave={saveStudioEdit} 
            onCancel={closeStudio}
            onAiEdit={handleAiEdit}
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
          <>
            {error && (
              <div className="w-full max-w-2xl bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r shadow-md mb-4 flex items-start gap-2 animate-pulse">
                <Info className="shrink-0 mt-0.5" size={18} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="text-center mb-6">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-2">
                What will you create?
              </h2>
              <p className="text-slate-500">
                Generate visuals with Gemini 2.5 & Veo, then refine in Studio.
              </p>
            </div>

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

            <ImageDisplay 
              contentData={currentContent}
              isVideo={isContentVideo}
              isLoading={isGenerating}
              onImageUpload={handleImageUpload}
              onEditInStudio={!isContentVideo && currentContent ? openStudio : undefined}
            />
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-16 text-center text-slate-400 text-sm flex items-center gap-6">
        <a href="#" className="hover:text-indigo-500 transition-colors flex items-center gap-1">
          <Github size={16} />
          <span>Source</span>
        </a>
        <span>&copy; {new Date().getFullYear()} NanoGen AI</span>
      </footer>

      {/* Decorative Background Blobs */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob pointer-events-none -z-10"></div>
      <div className="fixed top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 pointer-events-none -z-10"></div>
      <div className="fixed -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 pointer-events-none -z-10 transform -translate-x-1/2"></div>
    </div>
  );
};

export default App;