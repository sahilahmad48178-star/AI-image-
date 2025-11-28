import React from 'react';
import { AspectRatio, AppMode, ImageModel, ImageResolution } from '../types';
import { 
  Sparkles,
  Edit,
  Video,
  PlayCircle,
  Wand2, 
  Crown,
  Loader2,
  Settings2
} from 'lucide-react';

interface ControlsProps {
  prompt: string;
  setPrompt: (val: string) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (val: AspectRatio) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  imageModel: ImageModel;
  setImageModel: (val: ImageModel) => void;
  imageResolution: ImageResolution;
  setImageResolution: (val: ImageResolution) => void;
  hasReferenceImage: boolean;
  onClearImage: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  prompt,
  setPrompt,
  aspectRatio,
  setAspectRatio,
  onGenerate,
  isGenerating,
  mode,
  setMode,
  imageModel,
  setImageModel,
  imageResolution,
  setImageResolution,
  hasReferenceImage,
  onClearImage
}) => {
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim() && !isGenerating) {
        onGenerate();
      }
    }
  };

  const isVideoMode = mode === AppMode.TextToVideo || mode === AppMode.ImageToVideo;
  
  // Filter aspect ratios for Veo (only 16:9 and 9:16 supported)
  const availableAspectRatios = isVideoMode 
    ? [AspectRatio.Wide, AspectRatio.Tall]
    : Object.values(AspectRatio);

  const getPlaceholder = () => {
    switch(mode) {
      case AppMode.TextToImage: return "Describe the image you want to generate...";
      case AppMode.ImageToImage: return "Describe how to modify the image...";
      case AppMode.TextToVideo: return "Describe the video you want to create...";
      case AppMode.ImageToVideo: return "Describe how to animate this image...";
      default: return "Enter prompt...";
    }
  };

  const getButtonText = () => {
    if (isGenerating) {
      return isVideoMode ? "Generating Video..." : "Generating...";
    }
    switch(mode) {
      case AppMode.TextToImage: return "Generate Image";
      case AppMode.ImageToImage: return "Edit Image";
      case AppMode.TextToVideo: return "Generate Video";
      case AppMode.ImageToVideo: return "Animate Image";
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-2xl border border-indigo-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 pointer-events-none"></div>
      
      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-100 pb-4">
        <button
          onClick={() => setMode(AppMode.TextToImage)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mode === AppMode.TextToImage ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-50 text-slate-500'}`}
        >
          <Sparkles size={16} /> Text to Image
        </button>
        <button
          onClick={() => setMode(AppMode.ImageToImage)}
          disabled={!hasReferenceImage}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mode === AppMode.ImageToImage ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-50 text-slate-500 disabled:opacity-50'}`}
        >
          <Edit size={16} /> Image to Image
        </button>
        <button
          onClick={() => setMode(AppMode.TextToVideo)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mode === AppMode.TextToVideo ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-50 text-slate-500'}`}
        >
          <Video size={16} /> Text to Video
        </button>
        <button
          onClick={() => setMode(AppMode.ImageToVideo)}
          disabled={!hasReferenceImage}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mode === AppMode.ImageToVideo ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-50 text-slate-500 disabled:opacity-50'}`}
        >
          <PlayCircle size={16} /> Image to Video
        </button>
      </div>

      {/* Input Area */}
      <div className="relative mb-4 group">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          className="w-full h-28 p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none text-slate-700 placeholder-slate-400 transition-all shadow-inner text-base"
        />
        <div className="absolute bottom-3 right-3 text-xs text-slate-400 pointer-events-none bg-slate-50/80 px-2 py-1 rounded-md">
          Enter to generate
        </div>
      </div>

      {/* Advanced Controls Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
        
        {/* Model Selection (Only visible for Text To Image) */}
        {mode === AppMode.TextToImage && (
           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
               <Settings2 size={12} /> Model
             </label>
             <div className="flex gap-2">
               <button 
                 onClick={() => setImageModel(ImageModel.Flash)}
                 className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-1 ${imageModel === ImageModel.Flash ? 'bg-white border-indigo-200 text-indigo-700 shadow-sm' : 'border-transparent text-slate-500 hover:bg-white/50'}`}
               >
                 <Wand2 size={14} /> Flash
               </button>
               <button 
                 onClick={() => setImageModel(ImageModel.Pro)}
                 className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-1 ${imageModel === ImageModel.Pro ? 'bg-white border-indigo-200 text-indigo-700 shadow-sm' : 'border-transparent text-slate-500 hover:bg-white/50'}`}
               >
                 <Crown size={14} /> Pro
               </button>
             </div>
           </div>
        )}

        {/* Resolution Selection (Only for Pro Model) */}
        {mode === AppMode.TextToImage && imageModel === ImageModel.Pro && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolution</label>
            <select 
              value={imageResolution}
              onChange={(e) => setImageResolution(e.target.value as ImageResolution)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-500"
            >
              {Object.values(ImageResolution).map(res => (
                <option key={res} value={res}>{res}</option>
              ))}
            </select>
          </div>
        )}

        {/* Aspect Ratio Selection */}
        <div className="space-y-2 col-span-2">
           <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aspect Ratio</label>
           <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
             {availableAspectRatios.map((ratio) => (
               <button
                 key={ratio}
                 onClick={() => setAspectRatio(ratio)}
                 className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap
                    ${aspectRatio === ratio 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                    }
                 `}
               >
                 {ratio}
               </button>
             ))}
           </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {hasReferenceImage && (mode === AppMode.ImageToImage || mode === AppMode.ImageToVideo) && (
           <button 
              onClick={onClearImage}
              className="text-slate-400 hover:text-red-500 text-sm font-medium px-4 py-2 transition-colors"
           >
              Clear Image
           </button>
        )}
        
        <button
          onClick={onGenerate}
          disabled={isGenerating || !prompt.trim()}
          className={`
            flex-1 w-full py-3 rounded-xl font-bold text-white shadow-lg shadow-indigo-200 
            transition-all transform active:scale-[0.98] flex items-center justify-center gap-2
            ${isGenerating || !prompt.trim() 
              ? 'bg-slate-300 cursor-not-allowed shadow-none' 
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700'
            }
          `}
        >
          {isGenerating ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>{isVideoMode ? 'Creating Video (may take 1-2m)...' : 'Generating...'}</span>
            </>
          ) : (
            <>
              {isVideoMode ? <Video size={20} /> : <Sparkles size={20} />}
              <span>{getButtonText()}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
