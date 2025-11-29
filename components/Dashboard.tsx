import React from 'react';
import { GeneratedContent } from '../types';
import { PlayCircle, Image as ImageIcon, Calendar, Clock, ArrowRight } from 'lucide-react';

interface DashboardProps {
  history: GeneratedContent[];
  onSelect: (item: GeneratedContent) => void;
  onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ history, onSelect, onBack }) => {
  if (history.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto text-center py-20 animate-in fade-in duration-700">
        <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <ImageIcon className="text-slate-300" size={56} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-3">No History Yet</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">Start generating images and videos to build your personal gallery.</p>
        <button 
          onClick={onBack}
          className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:bg-indigo-700 transition-all transform hover:-translate-y-1"
        >
          Start Creating
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">Your Gallery</h2>
        <button 
          onClick={onBack}
          className="text-slate-500 font-medium hover:text-indigo-600 flex items-center gap-2 transition-colors"
        >
          Back to Generator <ArrowRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            onClick={() => onSelect(item)}
          >
            <div className="aspect-[4/3] w-full bg-checkerboard relative overflow-hidden">
              {item.isVideo ? (
                <video 
                  src={`data:video/mp4;base64,${item.data}`} 
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  muted
                />
              ) : (
                <img 
                  src={`data:image/png;base64,${item.data}`} 
                  alt={item.prompt} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5">
                <span className="text-white font-medium text-sm line-clamp-2">
                  {item.prompt}
                </span>
              </div>
              {item.isVideo && (
                <div className="absolute top-3 right-3 bg-black/40 text-white p-2 rounded-full backdrop-blur-md border border-white/20">
                  <PlayCircle size={20} />
                </div>
              )}
            </div>
            
            <div className="p-4 bg-white">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wide">
                <span>{item.isVideo ? 'Video' : 'Image'}</span>
                <span>{new Date(item.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};