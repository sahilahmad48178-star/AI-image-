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
      <div className="w-full max-w-4xl mx-auto text-center py-20">
        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <ImageIcon className="text-indigo-300" size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-700 mb-2">No History Yet</h2>
        <p className="text-slate-500 mb-8">Start generating images and videos to see them here.</p>
        <button 
          onClick={onBack}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Start Creating
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Your Creations</h2>
        <button 
          onClick={onBack}
          className="text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-2"
        >
          Back to Generator <ArrowRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all cursor-pointer"
            onClick={() => onSelect(item)}
          >
            <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
              {item.isVideo ? (
                <video 
                  src={`data:video/mp4;base64,${item.data}`} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <img 
                  src={`data:image/png;base64,${item.data}`} 
                  alt={item.prompt} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-white font-medium text-sm truncate w-full">
                  {item.prompt}
                </span>
              </div>
              {item.isVideo && (
                <div className="absolute top-3 right-3 bg-black/50 text-white p-1.5 rounded-full backdrop-blur-sm">
                  <PlayCircle size={16} />
                </div>
              )}
            </div>
            
            <div className="p-4">
              <p className="text-slate-600 text-sm line-clamp-2 mb-3 h-10 leading-relaxed">
                {item.prompt || "No prompt provided"}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};