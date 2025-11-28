import React, { useState, useEffect } from 'react';
import { Controls } from './components/Controls';
import { ImageDisplay } from './components/ImageDisplay';
import { AspectRatio, AppMode, ImageModel, ImageResolution } from './types';
import { generateImage, editImage, generateVideo, animateImage } from './services/geminiService';
import { Github, Info } from 'lucide-react';

// Extend window for AI Studio API
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    }
  }
}

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.Square);
  const [currentContent, setCurrentContent] = useState<string | null>(null);
  const [isContentVideo, setIsContentVideo] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // New States
  const [mode, setMode] = useState<AppMode>(AppMode.TextToImage);
  const [imageModel, setImageModel] = useState<ImageModel>(ImageModel.Flash);
  const [imageResolution, setImageResolution] = useState<ImageResolution>(ImageResolution.Res1K);
  
  const [error, setError] = useState<string | null>(null);

  // Auto-switch mode logic based on content availability
  useEffect(() => {
    if (currentContent && !isContentVideo) {
      // If we have an image, enable image input modes
      // We don't force switch, just ensure UI handles it
    }
  }, [currentContent, isContentVideo]);

  const checkApiKey = async () => {
    // Veo and Pro models require paid API key selection
    if (imageModel === ImageModel.Pro || mode === AppMode.TextToVideo || mode === AppMode.ImageToVideo) {
       try {
         const hasKey = await window.aistudio.hasSelectedApiKey();
         if (!hasKey) {
            await window.aistudio.openSelectKey();
            // We assume success or user cancellation. 
            // If they cancel, the subsequent API call might fail or use default env if available, 
            // but the prompt requires this flow.
         }
       } catch (e) {
         console.warn("AI Studio key selection not available", e);
       }
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && mode !== AppMode.ImageToVideo) return; // Prompt optional for simple animation
    
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
          // Only Flash supports edit currently
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
      }

    } catch (err: any) {
      let msg = err.message || "Something went wrong.";
      if (msg.includes("Requested entity was not found")) {
        msg = "API Key issue. Please try selecting your key again.";
        // Reset key logic if possible or prompt user
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

  return (
    <div className="min-h-screen bg-indigo-50/50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Header Branding */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight mb-3">
          NanoGen
        </h1>
        <p className="text-slate-500 text-lg max-w-md mx-auto">
          Create images and videos with the power of <br/>
          <span className="font-semibold text-indigo-600">Gemini & Veo</span>.
        </p>
      </div>

      {/* Main UI */}
      <main className="w-full flex flex-col items-center gap-6 relative z-10">
        
        {/* Error Toast */}
        {error && (
          <div className="w-full max-w-2xl bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r shadow-md mb-4 flex items-start gap-2 animate-pulse">
            <Info className="shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

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
        />

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
