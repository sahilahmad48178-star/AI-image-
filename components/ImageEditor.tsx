import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Check, RotateCw, FlipHorizontal, Sun, Contrast, Droplet, 
  Sliders, Undo2, Redo2, Wand2, Crop, Layers, Eraser, Loader2,
  Palette, Image as ImageIcon
} from 'lucide-react';

interface ImageEditorProps {
  imageData: string; // Base64
  onSave: (newData: string) => void;
  onCancel: () => void;
  onAiEdit: (currentData: string, prompt: string) => Promise<string>;
  isProcessing: boolean;
}

type EditorTab = 'adjust' | 'transform' | 'magic';

interface HistoryState {
  data: string; // Base64
  brightness: number;
  contrast: number;
  saturation: number;
  grayscale: number;
  rotation: number;
  flipH: boolean;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ 
  imageData, 
  onSave, 
  onCancel,
  onAiEdit,
  isProcessing
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>('adjust');

  // Editor State
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [grayscale, setGrayscale] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  
  // Magic State
  const [replaceBgPrompt, setReplaceBgPrompt] = useState("");
  
  // Base image data (updated after crop or AI edit)
  const [currentBaseImage, setCurrentBaseImage] = useState(imageData);

  // History Stack
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize history
  useEffect(() => {
    if (history.length === 0) {
      const initialState: HistoryState = {
        data: imageData,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        rotation: 0,
        flipH: false
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, []);

  const addToHistory = () => {
    const newState: HistoryState = {
      data: currentBaseImage,
      brightness,
      contrast,
      saturation,
      grayscale,
      rotation,
      flipH
    };

    // If we are in the middle of history, discard future
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    // Limit history size to 20
    if (newHistory.length > 20) newHistory.shift();
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      restoreState(prevState);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      restoreState(nextState);
    }
  };

  const restoreState = (state: HistoryState) => {
    setCurrentBaseImage(state.data);
    setBrightness(state.brightness);
    setContrast(state.contrast);
    setSaturation(state.saturation);
    setGrayscale(state.grayscale);
    setRotation(state.rotation);
    setFlipH(state.flipH);
  };

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = `data:image/png;base64,${currentBaseImage}`;
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
      if (rotation % 180 !== 0) {
         ctx.drawImage(img, -img.height / 2, -img.width / 2);
      } else {
         ctx.drawImage(img, -img.width / 2, -img.height / 2);
      }

      ctx.restore();
    };
  }, [currentBaseImage, rotation, flipH]);

  const getProcessedData = () => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return '';
    
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    const filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%)`;
    ctx.filter = filterString;
    ctx.drawImage(canvas, 0, 0);
    
    return tempCanvas.toDataURL('image/png').split(',')[1];
  };

  const handleSave = () => {
    const data = getProcessedData();
    onSave(data);
  };

  const handleCrop = (aspectRatio: number) => {
    // Basic crop implementation (center crop)
    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentWidth = canvas.width;
    const currentHeight = canvas.height;
    const currentRatio = currentWidth / currentHeight;

    let cropWidth, cropHeight;

    if (currentRatio > aspectRatio) {
      // Too wide, crop width
      cropHeight = currentHeight;
      cropWidth = currentHeight * aspectRatio;
    } else {
      // Too tall, crop height
      cropWidth = currentWidth;
      cropHeight = currentWidth / aspectRatio;
    }

    const startX = (currentWidth - cropWidth) / 2;
    const startY = (currentHeight - cropHeight) / 2;

    // We need to capture the current state (filters applied) before cropping
    const dataWithFilters = getProcessedData();
    
    // Create a new canvas to perform the crop
    const img = new Image();
    img.src = `data:image/png;base64,${dataWithFilters}`;
    img.onload = () => {
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;
      const cropCtx = cropCanvas.getContext('2d');
      if (!cropCtx) return;

      cropCtx.drawImage(
        img, 
        startX, startY, cropWidth, cropHeight, 
        0, 0, cropWidth, cropHeight
      );

      const croppedData = cropCanvas.toDataURL('image/png').split(',')[1];
      
      // Reset transforms since they are "baked" into the cropped image
      setCurrentBaseImage(croppedData);
      setRotation(0);
      setFlipH(false);
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setGrayscale(0);
      
      // Update history next tick
      setTimeout(addToHistory, 50);
    };
  };

  const handleMagicRemoveBg = async () => {
    // Bake current state before sending to AI
    const bakedImage = getProcessedData();
    
    try {
      const newImageData = await onAiEdit(bakedImage, "Remove the background and replace it with a solid white background. Isolate the main subject.");
      
      // Reset params for the new image
      setCurrentBaseImage(newImageData);
      setRotation(0);
      setFlipH(false);
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setGrayscale(0);
      
      setTimeout(addToHistory, 50);
    } catch (e) {
      console.error("BG Remove failed");
    }
  };

  const handleMagicColorize = async () => {
    // Bake current state before sending to AI
    const bakedImage = getProcessedData();
    
    try {
      const newImageData = await onAiEdit(bakedImage, "Colorize this black and white image. Make the colors look realistic and natural.");
      
      // Reset params for the new image
      setCurrentBaseImage(newImageData);
      setRotation(0);
      setFlipH(false);
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setGrayscale(0);
      
      setTimeout(addToHistory, 50);
    } catch (e) {
      console.error("Colorize failed");
    }
  };

  const handleMagicReplaceBg = async () => {
    if (!replaceBgPrompt.trim()) return;
    
    // Bake current state before sending to AI
    const bakedImage = getProcessedData();
    
    try {
      const prompt = `Replace the background with ${replaceBgPrompt}. Keep the foreground subject exactly as is.`;
      const newImageData = await onAiEdit(bakedImage, prompt);
      
      // Reset params for the new image
      setCurrentBaseImage(newImageData);
      setRotation(0);
      setFlipH(false);
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setGrayscale(0);
      
      setReplaceBgPrompt(""); // Clear prompt
      setTimeout(addToHistory, 50);
    } catch (e) {
      console.error("Replace BG failed");
    }
  };

  // Track slider changes for history
  const handleSliderChangeEnd = () => {
    addToHistory();
  };

  const filterStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%)`
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[90vh] bg-slate-900 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl border border-slate-800">
        
        {/* Preview Area */}
        <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-950 relative overflow-hidden flex items-center justify-center p-8 group">
           
           {isProcessing && (
             <div className="absolute inset-0 z-20 bg-slate-950/80 flex flex-col items-center justify-center backdrop-blur-sm">
                <Loader2 size={48} className="text-indigo-500 animate-spin mb-4" />
                <p className="text-indigo-400 font-bold animate-pulse">Applying Magic...</p>
             </div>
           )}

           <canvas 
             ref={canvasRef} 
             className="max-w-full max-h-full object-contain shadow-2xl transition-all duration-200"
             style={filterStyle}
           />
           
           {/* Top Bar controls */}
           <div className="absolute top-4 left-4 right-4 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-2 bg-slate-800/80 p-1 rounded-lg backdrop-blur">
                <button 
                  onClick={handleUndo} 
                  disabled={historyIndex <= 0}
                  className="p-2 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300"
                  title="Undo"
                >
                  <Undo2 size={20} />
                </button>
                <button 
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1} 
                  className="p-2 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300"
                  title="Redo"
                >
                  <Redo2 size={20} />
                </button>
              </div>
           </div>
        </div>

        {/* Controls Sidebar */}
        <div className="w-full md:w-80 bg-slate-900 p-0 flex flex-col border-l border-slate-800 overflow-y-auto">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-white font-bold text-xl flex items-center gap-2">
              <Sliders size={20} className="text-indigo-500" /> Studio
            </h3>
            <div className="text-xs text-slate-500 font-mono">
               {historyIndex + 1}/{history.length}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-800">
             <button 
               onClick={() => setActiveTab('adjust')}
               className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === 'adjust' ? 'border-indigo-500 text-white bg-slate-800' : 'border-transparent text-slate-500 hover:bg-slate-800/50'}`}
             >
               <Sliders size={16} /> Adjust
             </button>
             <button 
               onClick={() => setActiveTab('transform')}
               className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === 'transform' ? 'border-indigo-500 text-white bg-slate-800' : 'border-transparent text-slate-500 hover:bg-slate-800/50'}`}
             >
               <Crop size={16} /> Transform
             </button>
             <button 
               onClick={() => setActiveTab('magic')}
               className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === 'magic' ? 'border-indigo-500 text-white bg-slate-800' : 'border-transparent text-slate-500 hover:bg-slate-800/50'}`}
             >
               <Wand2 size={16} /> Magic
             </button>
          </div>

          <div className="p-6 space-y-8 flex-1">
            
            {/* ADJUST TAB */}
            {activeTab === 'adjust' && (
              <>
                <div className="space-y-4">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 justify-between">
                    <span className="flex items-center gap-2"><Sun size={14} /> Brightness</span>
                    <span className="text-indigo-400">{brightness}%</span>
                  </label>
                  <input 
                    type="range" min="0" max="200" value={brightness} 
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    onMouseUp={handleSliderChangeEnd}
                    onTouchEnd={handleSliderChangeEnd}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 justify-between">
                    <span className="flex items-center gap-2"><Contrast size={14} /> Contrast</span>
                    <span className="text-indigo-400">{contrast}%</span>
                  </label>
                  <input 
                    type="range" min="0" max="200" value={contrast} 
                    onChange={(e) => setContrast(Number(e.target.value))}
                    onMouseUp={handleSliderChangeEnd}
                    onTouchEnd={handleSliderChangeEnd}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 justify-between">
                    <span className="flex items-center gap-2"><Droplet size={14} /> Saturation</span>
                    <span className="text-indigo-400">{saturation}%</span>
                  </label>
                  <input 
                    type="range" min="0" max="200" value={saturation} 
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    onMouseUp={handleSliderChangeEnd}
                    onTouchEnd={handleSliderChangeEnd}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 justify-between">
                    <span className="flex items-center gap-2"><Layers size={14} /> Grayscale</span>
                    <span className="text-indigo-400">{grayscale}%</span>
                  </label>
                  <input 
                    type="range" min="0" max="100" value={grayscale} 
                    onChange={(e) => setGrayscale(Number(e.target.value))}
                    onMouseUp={handleSliderChangeEnd}
                    onTouchEnd={handleSliderChangeEnd}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </>
            )}

            {/* TRANSFORM TAB */}
            {activeTab === 'transform' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                   <button 
                     onClick={() => {
                        setRotation((r) => r + 90);
                        addToHistory();
                     }}
                     className="flex items-center justify-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors font-medium text-sm border border-slate-700"
                   >
                     <RotateCw size={18} /> Rotate 90°
                   </button>
                   <button 
                     onClick={() => {
                        setFlipH(!flipH);
                        addToHistory();
                     }}
                     className={`flex items-center justify-center gap-2 p-4 rounded-xl transition-colors font-medium text-sm border ${flipH ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'}`}
                   >
                     <FlipHorizontal size={18} /> Flip H
                   </button>
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Crop size={14} /> Crop Ratio
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleCrop(1)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-mono text-slate-300 border border-slate-700">1:1</button>
                    <button onClick={() => handleCrop(4/3)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-mono text-slate-300 border border-slate-700">4:3</button>
                    <button onClick={() => handleCrop(16/9)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-mono text-slate-300 border border-slate-700">16:9</button>
                    <button onClick={() => handleCrop(3/4)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-mono text-slate-300 border border-slate-700">3:4</button>
                    <button onClick={() => handleCrop(9/16)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-mono text-slate-300 border border-slate-700">9:16</button>
                    <button onClick={() => handleCrop(21/9)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-mono text-slate-300 border border-slate-700">21:9</button>
                  </div>
                </div>
              </>
            )}

            {/* MAGIC TAB */}
            {activeTab === 'magic' && (
              <div className="space-y-4">
                 {/* Quick Actions */}
                 <div className="p-4 bg-indigo-900/30 border border-indigo-500/30 rounded-xl">
                   <h4 className="text-indigo-400 text-sm font-bold mb-2 flex items-center gap-2">
                     <Wand2 size={16} /> Quick AI Actions
                   </h4>
                   <p className="text-slate-400 text-xs mb-4">
                     One-click enhancements powered by Gemini.
                   </p>
                   
                   <div className="space-y-3">
                     <button 
                       onClick={handleMagicRemoveBg}
                       disabled={isProcessing}
                       className="w-full py-3 bg-white text-indigo-900 hover:bg-indigo-50 rounded-lg font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                     >
                       {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Eraser size={16} />}
                       Remove Background (White)
                     </button>

                     <button 
                       onClick={handleMagicColorize}
                       disabled={isProcessing}
                       className="w-full py-3 bg-white text-indigo-900 hover:bg-indigo-50 rounded-lg font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                     >
                       {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Palette size={16} />}
                       Colorize B&W
                     </button>
                   </div>
                 </div>

                 {/* Replace Background */}
                 <div className="p-4 bg-indigo-900/30 border border-indigo-500/30 rounded-xl">
                   <h4 className="text-indigo-400 text-sm font-bold mb-2 flex items-center gap-2">
                     <ImageIcon size={16} /> Background Replacement
                   </h4>
                   <div className="space-y-2">
                     <input 
                        type="text" 
                        value={replaceBgPrompt}
                        onChange={(e) => setReplaceBgPrompt(e.target.value)}
                        placeholder="e.g., in a futuristic city, on a beach..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all"
                     />
                     <button 
                       onClick={handleMagicReplaceBg}
                       disabled={isProcessing || !replaceBgPrompt.trim()}
                       className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                       Generate New Background
                     </button>
                   </div>
                 </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-800 flex gap-3 bg-slate-900">
            <button 
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check size={18} /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};