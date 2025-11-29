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
  Settings2,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Monitor
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
      case AppMode.TextToImage: return "Describe the image you want to generate in detail...";
      case AppMode.ImageToImage: return "Describe how you want to modify the uploaded image...";
      case AppMode.TextToVideo: return "Describe a scene to generate a video...";
      case AppMode.ImageToVideo: return "Describe how to animate this image...";
      default: return "Enter prompt...";
    }
  };

  const getAspectRatioIcon = (ratio: AspectRatio) => {
    if (ratio === AspectRatio.Square) return <Square size={16} />;
    if (ratio.startsWith("16:9") || ratio.startsWith("21:9") || ratio.startsWith("4:3") || ratio.startsWith("3:2")) return <RectangleHorizontal size={16} />;
    return <RectangleVertical size={16} />;
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 md:p-8 w-full border border-slate-100">
      
      {/* Mode Switcher */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 p-1 bg-slate-50/80 rounded-2xl border border-slate-100">
        {[
          { id: AppMode.TextToImage, label: 'Image', icon: Sparkles },
          { id: AppMode.ImageToImage, label: 'Edit', icon: Edit },
          { id: AppMode.TextToVideo, label: 'Video', icon: Video },
          { id: AppMode.ImageToVideo, label: 'Animate', icon: PlayCircle },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            disabled={(!hasReferenceImage && (m.id === AppMode.ImageToImage || m.id === AppMode.ImageToVideo))}
            className={`
              flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${mode === m.id 
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 disabled:opacity-40 disabled:hover:bg-transparent'
              }
            `}
          >
            <m.icon size={16} /> {m.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="relative mb-6 group">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          className="w-full h-36 p-5 bg-slate-50/50 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none text-slate-800 placeholder-slate-400 transition-all text-lg leading-relaxed"
        />
        <div className="absolute bottom-4 right-4 text-xs font-medium text-slate-400 pointer-events-none bg-white/80 px-2 py-1 rounded border border-slate-100 backdrop-blur-sm">
          Return to generate
        </div>
      </div>

      {/* Advanced Settings Container */}
      <div className="border-t border-slate-100 pt-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 size={16} className="text-indigo-500" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Model Selection */}
          {mode === AppMode.TextToImage && (
             <div className="space-y-2">
               <label className="text-sm font-medium text-slate-700">Model</label>
               <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => setImageModel(ImageModel.Flash)}
                   className={`
                     p-3 rounded-xl text-sm font-medium border text-left transition-all
                     ${imageModel === ImageModel.Flash 
                       ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                       : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                     }
                   `}
                 >
                   <div className="flex items-center gap-2 mb-1">
                     <Wand2 size={16} /> <span>Flash</span>
                   </div>
                   <div className="text-xs opacity-70 font-normal">Fast & Efficient</div>
                 </button>

                 <button 
                   onClick={() => setImageModel(ImageModel.Pro)}
                   className={`
                     p-3 rounded-xl text-sm font-medium border text-left transition-all
                     ${imageModel === ImageModel.Pro 
                       ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                       : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                     }
                   `}
                 >
                   <div className="flex items-center gap-2 mb-1">
                     <Crown size={16} /> <span>Pro</span>
                   </div>
                   <div className="text-xs opacity-70 font-normal">High Quality</div>
                 </button>
               </div>
             </div>
          )}

          {/* Resolution Selection */}
          {mode === AppMode.TextToImage && imageModel === ImageModel.Pro && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Resolution</label>
              <div className="flex bg-slate-100 rounded-lg p-1">
                 {Object.values(ImageResolution).map(res => (
                   <button
                     key={res}
                     onClick={() => setImageResolution(res)}
                     className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${imageResolution === res ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     {res}
                   </button>
                 ))}
              </div>
            </div>
          )}

          {/* Aspect Ratio */}
          <div className="space-y-2 col-span-1 md:col-span-2">
             <label className="text-sm font-medium text-slate-700">Aspect Ratio</label>
             <div className="flex flex-wrap gap-2">
               {availableAspectRatios.map((ratio) => (
                 <button
                   key={ratio}
                   onClick={() => setAspectRatio(ratio)}
                   className={`
                      px-3 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2
                      ${aspectRatio === ratio 
                        ? 'bg-slate-900 border-slate-900 text-white' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }
                   `}
                   title={ratio}
                 >
                   {getAspectRatioIcon(ratio)}
                   {ratio}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-slate-100 pt-6">
        {hasReferenceImage && (mode === AppMode.ImageToImage || mode === AppMode.ImageToVideo) && (
           <button 
              onClick={onClearImage}
              className="w-full sm:w-auto text-slate-500 hover:text-red-500 hover:bg-red-50 text-sm font-semibold px-6 py-3.5 rounded-xl transition-all border border-slate-200 hover:border-red-200"
           >
              Reset Image
           </button>
        )}
        
        <button
          onClick={onGenerate}
          disabled={isGenerating || !prompt.trim()}
          className={`
            flex-1 w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20 
            transition-all transform active:scale-[0.99] flex items-center justify-center gap-2.5 text-base
            ${isGenerating || !prompt.trim() 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
              : 'bg-indigo-600 hover:bg-indigo-700'
            }
          `}
        >
          {isGenerating ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>{isVideoMode ? 'Rendering Video...' : 'Generating...'}</span>
            </>
          ) : (
            <>
              <Sparkles size={20} className={isVideoMode ? 'hidden' : 'block'} />
              <Video size={20} className={isVideoMode ? 'block' : 'hidden'} />
              <span>
                 {isGenerating 
                   ? 'Processing...' 
                   : (mode === AppMode.TextToImage 
                       ? 'Generate Art' 
                       : mode === AppMode.ImageToImage 
                         ? 'Remix Image' 
                         : mode === AppMode.TextToVideo 
                           ? 'Create Video' 
                           : 'Animate Image')
                 }
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};