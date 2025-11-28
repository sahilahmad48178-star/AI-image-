import React from 'react';
import { Download, Upload, Sliders } from 'lucide-react';

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
    <div className="w-full max-w-2xl mt-8">
      <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl bg-slate-200 min-h-[300px] flex items-center justify-center border-4 border-white group">
        
        {/* Placeholder / Upload State */}
        {!contentData && !isLoading && (
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload size={32} />
            </div>
            <h3 className="text-slate-600 font-semibold text-lg mb-2">Ready to Create</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
              Generate an image or video above, or upload a starting image.
            </p>
            <label className="cursor-pointer bg-white text-indigo-600 font-bold py-2 px-6 rounded-full shadow-md hover:shadow-lg transition-all border border-indigo-100 hover:bg-indigo-50">
              Upload Image
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
          <div className="absolute inset-0 z-10 bg-slate-900/10 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
              </div>
            </div>
            <p className="mt-4 text-indigo-700 font-bold bg-white/80 px-4 py-1 rounded-full text-sm animate-pulse">
              Creating Masterpiece...
            </p>
          </div>
        )}

        {/* Content Render */}
        {contentData && (
          <>
            {isVideo ? (
               <video 
                 controls 
                 autoPlay 
                 loop 
                 className={`w-full h-auto max-h-[600px] object-contain bg-black transition-opacity duration-500 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
                 src={`data:video/mp4;base64,${contentData}`}
               />
            ) : (
               <img 
                 src={`data:image/png;base64,${contentData}`} 
                 alt="Generated Art" 
                 className={`w-full h-auto object-contain max-h-[600px] transition-opacity duration-500 ${isLoading ? 'opacity-50' : 'opacity-100'}`} 
               />
            )}
            
            {/* Overlay Actions */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
               {/* Studio Edit Button - Only for images */}
              {!isVideo && onEditInStudio && (
                <button 
                  onClick={onEditInStudio}
                  className="p-3 bg-white/90 hover:bg-indigo-500 hover:text-white text-slate-700 rounded-full shadow-lg backdrop-blur-sm transition-transform hover:scale-110"
                  title="Edit in Studio"
                >
                  <Sliders size={20} />
                </button>
              )}
              
              <button 
                onClick={downloadContent}
                className="p-3 bg-white/90 hover:bg-white text-slate-700 rounded-full shadow-lg backdrop-blur-sm transition-transform hover:scale-110"
                title="Download"
              >
                <Download size={20} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};