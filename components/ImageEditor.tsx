import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Check, RotateCw, FlipHorizontal, Sun, Contrast, Droplet, 
  Sliders, Undo2, Redo2, Wand2, Crop, Layers, Eraser, Loader2,
  Palette, Image as ImageIcon, Zap, Maximize2, MoveLeft
} from 'lucide-react';
import { ImageResolution } from '../types';

interface ImageEditorProps {
  imageData: string; // Base64
  onSave: (newData: string) => void;
  onCancel: () => void;
  onAiEdit: (currentData: string, prompt: string) => Promise<string>;
  onAiUpscale: (currentData: string, resolution: ImageResolution) => Promise<string>;
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
  onAiUpscale,
  isProcessing
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
    // Only init if empty to avoid reset on re-renders
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
  }, []); // Empty dependency array means this runs once on mount

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
      // Determine canvas size based on rotation
      // When rotated 90 or 270, width and height swap relative to original
      const isRotated90 = rotation % 180 !== 0;
      canvas.width = isRotated90 ? img.height : img.width;
      canvas.height = isRotated90 ? img.width : img.height;

      // Clear and Setup Context
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Move to center for rotation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      if (flipH) ctx.scale(-1, 1);
      
      // Draw image centered
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    };
  }, [currentBaseImage, rotation, flipH]);

  const getProcessedData = () => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    
    // Create temp canvas to bake in CSS filters
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Bake current visual state (filters + rotation) into a base image
    const dataWithFilters = getProcessedData();

    // 2. Perform crop logic on this baked image
    const img = new Image();
    img.src = `data:image/png;base64,${dataWithFilters}`;
    img.onload = () => {
        const currentWidth = img.width;
        const currentHeight = img.height;
        const currentRatio = currentWidth / currentHeight;

        let cropWidth, cropHeight;

        // Smart center crop calculation
        if (currentRatio > aspectRatio) {
            // Image is wider than target
            cropHeight = currentHeight;
            cropWidth = currentHeight * aspectRatio;
        } else {
            // Image is taller than target
            cropWidth = currentWidth;
            cropHeight = currentWidth / aspectRatio;
        }

        const startX = (currentWidth - cropWidth) / 2;
        const startY = (currentHeight - cropHeight) / 2;

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
        
        // 3. Update state with new cropped image and RESET adjustments
        // because adjustments are now baked in.
        setCurrentBaseImage(croppedData);
        setRotation(0);
        setFlipH(false);
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setGrayscale(0);
        
        // Push new clean state to history
        setTimeout(addToHistory, 50);
    };
  };

  const runAiOperation = async (operation: () => Promise<string>) => {
     // Bake current state first
     const bakedImage = getProcessedData();
     
     // Temporarily set current base to baked image so the UI doesn't jump
     // while waiting for AI (optional, but good for UX)
     
     try {
       // We need to pass the BAKED image to the AI, not the original `currentBaseImage`
       // This logic needs to be inside the specific handler or we pass it here?
       // Let's refactor handlers to accept bakedImage or use getProcessedData inside them.
       // Handlers below use getProcessedData() correctly.
       
       const newImageData = await operation();
       
       // Reset params for the new image
       setCurrentBaseImage(newImageData);
       setRotation(0);
       setFlipH(false);
       setBrightness(100);
       setContrast(100);
       setSaturation(100);
       setGrayscale(0);
       
       setReplaceBgPrompt(""); 
       setTimeout(addToHistory, 50);
     } catch (e) {
       console.error("AI Operation failed", e);
       // Error handled by parent mostly
     }
  };

  const handleMagicRemoveBg = () => runAiOperation(
    () => onAiEdit(getProcessedData(), "Remove the background and replace it with a solid white background. Isolate the main subject.")
  );

  const handleMagicColorize = () => runAiOperation(
    () => onAiEdit(getProcessedData(), "Colorize this black and white image. Make the colors look realistic and natural.")
  );

  const handleMagicReplaceBg = () => {
    if (!replaceBgPrompt.trim()) return;
    runAiOperation(
      () => onAiEdit(getProcessedData(), `Replace the background with ${replaceBgPrompt}. Keep the foreground subject exactly as is.`)
    );
  };

  const handleMagicUpscale = (res: ImageResolution) => runAiOperation(
    () => onAiUpscale(getProcessedData(), res)
  );

  // Track slider changes for history
  const handleSliderChangeEnd = () => {
    addToHistory();
  };

  const filterStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%)`
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-in fade-in duration-300">
      
      {/* Studio Header */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
           <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
             <X size={24} />
           </button>
           <h3 className="text-white font-bold text-lg flex items-center gap-2">
             <Sliders size={18} className="text-indigo-500" /> Photo Studio
           </h3>
           <div className="bg-slate-800 px-3 py-1 rounded-full text-xs text-slate-400 font-mono border border-slate-700 hidden sm:block">
              History: {historyIndex + 1} / {history.length}
           </div>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={handleUndo} 
             disabled={historyIndex <= 0}
             className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
             title="Undo (Ctrl+Z)"
           >
             <Undo2 size={20} />
           </button>
           <button 
             onClick={handleRedo}
             disabled={historyIndex >= history.length - 1} 
             className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
             title="Redo (Ctrl+Y)"
           >
             <Redo2 size={20} />
           </button>
           <div className="h-6 w-px bg-slate-800 mx-2"></div>
           <button 
             onClick={handleSave}
             disabled={isProcessing}
             className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 disabled:opacity-50"
           >
             {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
             <span>Save Changes</span>
           </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Main Canvas Area */}
        <div className="flex-1 bg-checkerboard relative overflow-hidden flex items-center justify-center p-8">
           <div 
             ref={containerRef}
             className="relative w-full h-full flex items-center justify-center"
           >
             {isProcessing && (
               <div className="absolute inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
                  <Loader2 size={48} className="text-indigo-500 animate-spin mb-4 drop-shadow-lg" />
                  <p className="text-white font-medium text-lg tracking-wide animate-pulse">Processing...</p>
               </div>
             )}

             <canvas 
               ref={canvasRef} 
               className="max-w-full max-h-full object-contain shadow-2xl ring-1 ring-white/10"
               style={filterStyle}
             />
           </div>
        </div>

        {/* Right Sidebar Controls */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
          
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800 bg-slate-900/50">
             {[
               { id: 'adjust', icon: Sliders, label: 'Adjust' },
               { id: 'transform', icon: Crop, label: 'Crop/Rot' },
               { id: 'magic', icon: Wand2, label: 'Magic' },
             ].map((tab) => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as EditorTab)}
                 className={`
                   flex-1 py-4 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1.5 transition-all relative
                   ${activeTab === tab.id ? 'text-indigo-400 bg-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}
                 `}
               >
                 <tab.icon size={18} />
                 {tab.label}
                 {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>}
               </button>
             ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-700">
            
            {/* ADJUST TAB */}
            {activeTab === 'adjust' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                {[
                  { label: 'Brightness', icon: Sun, val: brightness, set: setBrightness, max: 200 },
                  { label: 'Contrast', icon: Contrast, val: contrast, set: setContrast, max: 200 },
                  { label: 'Saturation', icon: Droplet, val: saturation, set: setSaturation, max: 200 },
                  { label: 'Grayscale', icon: Layers, val: grayscale, set: setGrayscale, max: 100 },
                ].map((control) => (
                  <div key={control.label} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-400 text-xs font-bold uppercase flex items-center gap-2">
                        <control.icon size={14} className="text-indigo-500" /> {control.label}
                      </label>
                      <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                        {control.val}%
                      </span>
                    </div>
                    <input 
                      type="range" min="0" max={control.max} value={control.val} 
                      onChange={(e) => control.set(Number(e.target.value))}
                      onMouseUp={handleSliderChangeEnd}
                      onTouchEnd={handleSliderChangeEnd}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* TRANSFORM TAB */}
            {activeTab === 'transform' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-3">
                   <button 
                     onClick={() => { setRotation((r) => r + 90); addToHistory(); }}
                     className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700 hover:border-slate-600"
                   >
                     <RotateCw size={24} /> 
                     <span className="text-xs font-bold">Rotate 90°</span>
                   </button>
                   <button 
                     onClick={() => { setFlipH(!flipH); addToHistory(); }}
                     className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-colors border ${flipH ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/50' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300 hover:border-slate-600'}`}
                   >
                     <FlipHorizontal size={24} /> 
                     <span className="text-xs font-bold">Flip H</span>
                   </button>
                </div>

                <div>
                  <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Aspect Crop</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { r: 1, l: '1:1' }, { r: 4/3, l: '4:3' }, { r: 16/9, l: '16:9' },
                      { r: 3/4, l: '3:4' }, { r: 9/16, l: '9:16' }, { r: 21/9, l: '21:9' }
                    ].map((ratio) => (
                      <button 
                        key={ratio.l} 
                        onClick={() => handleCrop(ratio.r)} 
                        className="py-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg text-xs font-mono text-slate-400 border border-slate-700 hover:border-slate-600 transition-all"
                      >
                        {ratio.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MAGIC TAB */}
            {activeTab === 'magic' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                 
                 {/* Quick Tools */}
                 <div className="space-y-3">
                   <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">Enhancement</h4>
                   <button 
                     onClick={() => handleMagicUpscale(ImageResolution.Res4K)}
                     disabled={isProcessing}
                     className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 rounded-xl group transition-all"
                   >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-900/30 text-emerald-400 rounded-lg group-hover:scale-110 transition-transform"><Maximize2 size={18} /></div>
                        <div className="text-left">
                          <div className="text-sm font-bold text-slate-200">Upscale 4K</div>
                          <div className="text-xs text-slate-500">Enhance details & clarity</div>
                        </div>
                      </div>
                      <Zap size={14} className="text-emerald-500" />
                   </button>

                   <button 
                     onClick={handleMagicColorize}
                     disabled={isProcessing}
                     className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-pink-500/50 rounded-xl group transition-all"
                   >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-900/30 text-pink-400 rounded-lg group-hover:scale-110 transition-transform"><Palette size={18} /></div>
                        <div className="text-left">
                          <div className="text-sm font-bold text-slate-200">Colorize</div>
                          <div className="text-xs text-slate-500">Restore B&W photos</div>
                        </div>
                      </div>
                      <Wand2 size={14} className="text-pink-500" />
                   </button>
                 </div>

                 {/* Background Tools */}
                 <div className="space-y-3 pt-4 border-t border-slate-800">
                   <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">Background</h4>
                   
                   <button 
                     onClick={handleMagicRemoveBg}
                     disabled={isProcessing}
                     className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-medium border border-slate-700 transition-all flex items-center justify-center gap-2"
                   >
                     <Eraser size={16} /> Remove Background
                   </button>

                   <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                     <label className="text-xs text-slate-400 font-bold mb-2 block">Replace Background</label>
                     <div className="flex gap-2">
                       <input 
                          type="text" 
                          value={replaceBgPrompt}
                          onChange={(e) => setReplaceBgPrompt(e.target.value)}
                          placeholder="e.g. on Mars..."
                          className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                       />
                       <button 
                         onClick={handleMagicReplaceBg}
                         disabled={isProcessing || !replaceBgPrompt.trim()}
                         className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white p-2 rounded-lg transition-colors"
                       >
                         <Wand2 size={18} />
                       </button>
                     </div>
                   </div>
                 </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};