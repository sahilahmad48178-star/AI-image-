import React, { useState, useRef, useEffect } from 'react';
import { X, Check, RotateCw, FlipHorizontal, Sun, Contrast, Droplet, Sliders, Undo2 } from 'lucide-react';

interface ImageEditorProps {
  imageData: string; // Base64
  onSave: (newData: string) => void;
  onCancel: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageData, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [grayscale, setGrayscale] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  
  // Load and draw image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = `data:image/png;base64,${imageData}`;
    img.onload = () => {
      // Handle canvas sizing based on rotation
      if (rotation % 180 !== 0) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      // Clear and Setup Context
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Move to center for rotation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      if (flipH) ctx.scale(-1, 1);
      
      // Draw image centered
      // Note: When rotated 90/270, width/height are swapped in context
      if (rotation % 180 !== 0) {
         ctx.drawImage(img, -img.height / 2, -img.width / 2);
      } else {
         ctx.drawImage(img, -img.width / 2, -img.height / 2);
      }

      ctx.restore();
    };
  }, [imageData, rotation, flipH]);

  // Apply filters via CSS for preview, but we need to apply them to canvas for save
  // Actually, for saving, we must apply filters to the context before extracting data.
  // The above effect handles geometry. Let's add a separate effect or function to get the data with filters.
  
  const getProcessedData = () => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    
    // To apply filters for export, we need to redraw with filter property
    // But since `ctx.filter` is supported, we can just update the drawing logic above
    // However, React effect dependencies might cause flicker.
    // Let's rely on CSS for preview performance, and doing a final draw for Save.
    
    // Temporary canvas for final render
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return '';
    
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    const filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%)`;
    ctx.filter = filterString;
    
    // Draw the current visible canvas onto the temp canvas with filters
    ctx.drawImage(canvas, 0, 0);
    
    return tempCanvas.toDataURL('image/png').split(',')[1];
  };

  const handleSave = () => {
    const data = getProcessedData();
    onSave(data);
  };

  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setGrayscale(0);
    setRotation(0);
    setFlipH(false);
  };

  const filterStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%)`
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl h-[85vh] bg-slate-800 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl border border-slate-700">
        
        {/* Preview Area */}
        <div className="flex-1 bg-slate-900/50 relative overflow-hidden flex items-center justify-center p-8">
           <canvas 
             ref={canvasRef} 
             className="max-w-full max-h-full object-contain shadow-2xl transition-all duration-200"
             style={filterStyle}
           />
        </div>

        {/* Controls Sidebar */}
        <div className="w-full md:w-80 bg-slate-800 p-6 flex flex-col border-l border-slate-700 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-white font-bold text-xl flex items-center gap-2">
              <Sliders size={20} className="text-indigo-400" /> Studio
            </h3>
            <button 
              onClick={handleReset}
              className="text-slate-400 hover:text-white text-xs uppercase font-bold tracking-wider flex items-center gap-1 transition-colors"
            >
              <Undo2 size={12} /> Reset
            </button>
          </div>

          <div className="space-y-6 flex-1">
            {/* Filters */}
            <div className="space-y-4">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Sun size={14} /> Brightness ({brightness}%)
              </label>
              <input 
                type="range" min="0" max="200" value={brightness} 
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-4">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Contrast size={14} /> Contrast ({contrast}%)
              </label>
              <input 
                type="range" min="0" max="200" value={contrast} 
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-4">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Droplet size={14} /> Saturation ({saturation}%)
              </label>
              <input 
                type="range" min="0" max="200" value={saturation} 
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
             <div className="space-y-4">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Sliders size={14} /> Grayscale ({grayscale}%)
              </label>
              <input 
                type="range" min="0" max="100" value={grayscale} 
                onChange={(e) => setGrayscale(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Transform */}
            <div className="pt-6 border-t border-slate-700 grid grid-cols-2 gap-3">
               <button 
                 onClick={() => setRotation((r) => r + 90)}
                 className="flex items-center justify-center gap-2 p-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-colors font-medium text-sm"
               >
                 <RotateCw size={16} /> Rotate
               </button>
               <button 
                 onClick={() => setFlipH(!flipH)}
                 className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-colors font-medium text-sm ${flipH ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}
               >
                 <FlipHorizontal size={16} /> Flip
               </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-8 mt-4 border-t border-slate-700 flex gap-3">
            <button 
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/50 transition-all flex items-center justify-center gap-2"
            >
              <Check size={18} /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};