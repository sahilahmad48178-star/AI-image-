import React from 'react';
import { Download, Upload, Sliders, Image as ImageIcon } from 'lucide-react';

interface ImageDisplayProps {
  contentData: string | null;
  isVideo: boolean;
  isLoading: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditInStudio?: () => void;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ 
  contentData, 
  isVideo,
  isLoading,
  onImageUpload,
  onEditInStudio
}) => {
  const downloadContent = () => {
    if (!contentData) return;
    const link = document.createElement('a');
    if (isVideo) {
      link.href = `data:video/mp4;base64,${contentData}`;
      link.download = `gemini-video-${Date.now()}.mp4`;
    } else {
      link.href = `data:image/png;base64,${contentData}`;
      link.download = `gemini-art-${Date.now()}.png`;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full">
      <div className={`
        relative w-full rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm border-2 border-dashed
        ${contentData ? 'border-transparent shadow-2xl shadow-indigo-200/50' : 'border-slate-300 hover:border-indigo-400/50'}
        min-h-[400px] md:min-h-[500px] flex items-center justify-center transition-all duration-300 group
      `}>
        
        {/* Placeholder / Upload State */}
        {!contentData && !isLoading && (
          <div className="text-center p-10 max-w-sm mx-auto">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-300 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 group-hover:rotate-6 transition-transform duration-300">
              <ImageIcon size={40} />
            </div>
            <h3 className="text-slate-800 font-bold text-2xl mb-2">Ready Canvas</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Your generated masterpiece will appear here. Start by typing a prompt or upload an image to begin editing.
            </p>
            <label className="cursor-pointer inline-flex items-center gap-2 bg-white text-slate-700 font-semibold py-3 px-8 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-all">
              <Upload size={18} />
              <span>Upload Reference</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={onImageUpload}
              />
            </label>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="text-indigo-900 font-bold text-lg animate-pulse">
              Dreaming...
            </p>
            <p className="text-indigo-400 text-sm mt-1">AI is generating your content</p>
          </div>
        )}

        {/* Content Render */}
        {contentData && (
          <div className="relative w-full h-full flex items-center justify-center bg-checkerboard">
            {isVideo ? (
               <video 
                 controls 
                 autoPlay 
                 loop 
                 className={`w-full h-auto max-h-[600px] object-contain shadow-lg transition-opacity duration-500 ${isLoading ? 'opacity-20 blur-sm' : 'opacity-100'}`}
                 src={`data:video/mp4;base64,${contentData}`}
               />
            ) : (
               <img 
                 src={`data:image/png;base64,${contentData}`} 
                 alt="Generated Art" 
                 className={`w-full h-auto object-contain max-h-[600px] shadow-lg transition-opacity duration-500 ${isLoading ? 'opacity-20 blur-sm' : 'opacity-100'}`} 
               />
            )}
            
            {/* Overlay Actions */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20">
               {/* Studio Edit Button - Only for images */}
              {!isVideo && onEditInStudio && (
                <button 
                  onClick={onEditInStudio}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-white rounded-full shadow-lg backdrop-blur-sm transition-transform hover:scale-105 font-medium text-sm"
                >
                  <Sliders size={16} /> Edit in Studio
                </button>
              )}
              
              <button 
                onClick={downloadContent}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-lg backdrop-blur-sm transition-transform hover:scale-105 font-medium text-sm"
              >
                <Download size={16} /> Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};