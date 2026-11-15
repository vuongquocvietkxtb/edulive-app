import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import { 
  PenTool, 
  Type,
  Eraser, 
  Square, 
  Circle, 
  Minus, 
  Trash2, 
  Download, 
  Check, 
  X
} from 'lucide-react';

export default function Whiteboard({ roomId, user, initialHistory = [] }) {
  const { socket } = useSocket();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const snapshotRef = useRef(null); // For previewing shapes while dragging
  const textInputRef = useRef(null);

  const [tool, setTool] = useState('pen'); // 'pen' | 'text' | 'line' | 'rect' | 'circle' | 'eraser'
  const [color, setColor] = useState('#6366f1'); // Indigo default
  const [lineWidth, setLineWidth] = useState(3);
  const [fontSize, setFontSize] = useState(24);
  const [canDraw, setCanDraw] = useState(true);

  // Floating text typing state
  const [textInput, setTextInput] = useState({
    visible: false,
    x: 0,
    y: 0,
    value: ''
  });

  const colors = [
    '#ffffff', // White
    '#f87171', // Red
    '#fbbf24', // Amber
    '#34d399', // Emerald
    '#38bdf8', // Sky
    '#818cf8', // Indigo
    '#c084fc', // Purple
    '#fb7185', // Rose
  ];

  const widths = [2, 4, 8, 14];
  const fontSizes = [
    { label: 'Nhỏ', size: 16 },
    { label: 'Vừa', size: 22 },
    { label: 'Lớn', size: 30 },
    { label: 'Tiêu đề', size: 40 }
  ];

  // Helper to draw an action onto a canvas context
  const renderAction = useCallback((ctx, action) => {
    ctx.save();
    ctx.strokeStyle = action.color;
    ctx.lineWidth = action.width || 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (action.tool === 'pen' || action.tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(action.fromX, action.fromY);
      ctx.lineTo(action.toX, action.toY);
      ctx.stroke();
    } else if (action.tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(action.fromX, action.fromY);
      ctx.lineTo(action.toX, action.toY);
      ctx.stroke();
    } else if (action.tool === 'rect') {
      const width = action.toX - action.fromX;
      const height = action.toY - action.fromY;
      ctx.strokeRect(action.fromX, action.fromY, width, height);
    } else if (action.tool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(action.toX - action.fromX, 2) + Math.pow(action.toY - action.fromY, 2)
      );
      ctx.beginPath();
      ctx.arc(action.fromX, action.fromY, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (action.tool === 'text') {
      const fSize = action.fontSize || 24;
      ctx.font = `600 ${fSize}px 'Plus Jakarta Sans', system-ui, sans-serif`;
      ctx.fillStyle = action.color;
      ctx.textBaseline = 'top';
      const lines = (action.text || '').split('\n');
      const lineHeight = fSize * 1.35;
      lines.forEach((line, index) => {
        ctx.fillText(line, action.x, action.y + index * lineHeight);
      });
    }
    ctx.restore();
  }, []);

  // Set up canvas & replay history
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Adjust canvas resolution for sharp rendering
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;

    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Dark grid background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw initial history
    if (initialHistory && initialHistory.length > 0) {
      initialHistory.forEach(action => renderAction(ctx, action));
    }
  }, [initialHistory, renderAction]);

  // Handle incoming socket drawing events
  useEffect(() => {
    if (!socket) return;

    const handleDrawUpdate = (action) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      renderAction(ctx, action);
    };

    const handleCleared = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    };

    socket.on('whiteboard-draw-update', handleDrawUpdate);
    socket.on('whiteboard-cleared', handleCleared);

    return () => {
      socket.off('whiteboard-draw-update', handleDrawUpdate);
      socket.off('whiteboard-cleared', handleCleared);
    };
  }, [socket, renderAction]);

  // Focus textarea when textInput becomes visible
  useEffect(() => {
    if (textInput.visible && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textInput.visible]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // Commit text typed by keyboard to canvas
  const commitText = () => {
    if (!textInput.visible) return;
    const textToCommit = textInput.value.trim();

    if (textToCommit) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const action = {
          tool: 'text',
          x: textInput.x,
          y: textInput.y,
          text: textToCommit,
          color: color,
          fontSize: fontSize
        };

        renderAction(ctx, action);

        if (socket) {
          socket.emit('whiteboard-draw', { roomId, action });
        }
      }
    }

    setTextInput({ visible: false, x: 0, y: 0, value: '' });
  };

  const cancelText = () => {
    setTextInput({ visible: false, x: 0, y: 0, value: '' });
  };

  const startDraw = (e) => {
    if (!canDraw) return;
    const coords = getCanvasCoords(e);

    // If text tool is selected, clicking opens inline keyboard typing box
    if (tool === 'text') {
      if (textInput.visible && textInput.value.trim()) {
        commitText();
      }
      setTextInput({
        visible: true,
        x: coords.x,
        y: coords.y,
        value: ''
      });
      return;
    }

    // If we were typing and switched to another tool, commit first
    if (textInput.visible) {
      commitText();
    }

    isDrawing.current = true;
    startPos.current = coords;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
  };

  const draw = (e) => {
    if (!isDrawing.current || !canDraw || tool === 'text') return;
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const actualColor = tool === 'eraser' ? '#0f172a' : color;
    const actualWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;

    if (tool === 'pen' || tool === 'eraser') {
      const action = {
        tool,
        fromX: startPos.current.x,
        fromY: startPos.current.y,
        toX: coords.x,
        toY: coords.y,
        color: actualColor,
        width: actualWidth
      };

      renderAction(ctx, action);

      if (socket) {
        socket.emit('whiteboard-draw', { roomId, action });
      }

      startPos.current = coords;
    } else {
      // Shape preview: restore snapshot then draw preview
      if (snapshotRef.current) {
        ctx.putImageData(snapshotRef.current, 0, 0);
      }
      renderAction(ctx, {
        tool,
        fromX: startPos.current.x,
        fromY: startPos.current.y,
        toX: coords.x,
        toY: coords.y,
        color: actualColor,
        width: actualWidth
      });
    }
  };

  const stopDraw = (e) => {
    if (!isDrawing.current || tool === 'text') return;
    isDrawing.current = false;

    if (tool !== 'pen' && tool !== 'eraser') {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const coords = getCanvasCoords(e.changedTouches ? e.changedTouches[0] : e);

      const action = {
        tool,
        fromX: startPos.current.x,
        fromY: startPos.current.y,
        toX: coords.x,
        toY: coords.y,
        color,
        width: lineWidth
      };

      renderAction(ctx, action);

      if (socket) {
        socket.emit('whiteboard-draw', { roomId, action });
      }
    }
  };

  const handleClearBoard = () => {
    if (user.role !== 'teacher' && !window.confirm('Bạn có chắc muốn xóa sạch bảng vẽ không?')) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    setTextInput({ visible: false, x: 0, y: 0, value: '' });

    if (socket) {
      socket.emit('whiteboard-clear', { roomId });
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `edulive-whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl"
    >
      {/* Top Floating Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-lg">
        
        {/* Tool selector */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg">
          <button
            onClick={() => { commitText(); setTool('pen'); }}
            className={`p-1.5 rounded-md transition-colors ${
              tool === 'pen' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Bút vẽ tự do (P)"
          >
            <PenTool className="w-4 h-4" />
          </button>

          {/* Type / Text tool */}
          <button
            onClick={() => setTool('text')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors ${
              tool === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Gõ chữ bằng bàn phím (T) - Nhấp lên bảng để gõ chữ"
          >
            <Type className="w-4 h-4" />
            <span className="text-xs font-semibold hidden sm:inline">Chữ viết</span>
          </button>

          <button
            onClick={() => { commitText(); setTool('line'); }}
            className={`p-1.5 rounded-md transition-colors ${
              tool === 'line' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Đường thẳng"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={() => { commitText(); setTool('rect'); }}
            className={`p-1.5 rounded-md transition-colors ${
              tool === 'rect' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Hình chữ nhật"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={() => { commitText(); setTool('circle'); }}
            className={`p-1.5 rounded-md transition-colors ${
              tool === 'circle' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Hình tròn / Elip"
          >
            <Circle className="w-4 h-4" />
          </button>

          <button
            onClick={() => { commitText(); setTool('eraser'); }}
            className={`p-1.5 rounded-md transition-colors ${
              tool === 'eraser' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tẩy xóa (E)"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Color Palette */}
        {tool !== 'eraser' && (
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1.5 rounded-lg">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full transition-transform ${
                  color === c ? 'scale-125 ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-900' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        )}

        {/* Font size picker for Text tool or Stroke Width for Pen/Shapes */}
        {tool === 'text' ? (
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg">
            <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">Cỡ chữ:</span>
            {fontSizes.map((f) => (
              <button
                key={f.size}
                onClick={() => setFontSize(f.size)}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  fontSize === f.size ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-lg">
            {widths.map((w) => (
              <button
                key={w}
                onClick={() => setLineWidth(w)}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  lineWidth === w ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {w}px
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleClearBoard}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/30"
            title="Xóa trắng bảng"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xóa bảng</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
            title="Lưu ảnh bài giảng"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lưu ảnh</span>
          </button>
        </div>

      </div>

      {/* Canvas Area */}
      <div className={`flex-1 w-full h-full relative ${tool === 'text' ? 'cursor-text' : 'cursor-crosshair'}`}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
          className="w-full h-full block touch-none"
        />

        {/* Floating Text Input Box directly on canvas */}
        {textInput.visible && (
          <div 
            style={{ 
              position: 'absolute', 
              left: `${textInput.x}px`, 
              top: `${textInput.y}px`,
              maxWidth: '80%'
            }}
            className="z-30 flex flex-col gap-1.5 p-1 bg-slate-900/95 border-2 border-indigo-500 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          >
            <textarea
              ref={textInputRef}
              value={textInput.value}
              onChange={(e) => setTextInput(prev => ({ ...prev, value: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  commitText();
                } else if (e.key === 'Escape') {
                  cancelText();
                }
              }}
              placeholder="Gõ nội dung bài giảng ở đây... (Enter để chèn)"
              style={{
                color: color,
                fontSize: `${fontSize}px`,
                lineHeight: 1.35
              }}
              rows={Math.max(1, textInput.value.split('\n').length)}
              className="bg-transparent border-0 outline-none resize-none font-semibold px-2 py-1 placeholder:text-slate-500 min-w-[260px] font-sans"
            />
            
            <div className="flex items-center justify-between gap-2 px-1 pt-1 border-t border-slate-800 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                Nhấn <strong className="text-indigo-400">Enter</strong> để chèn chữ • <strong className="text-slate-400">Esc</strong> hủy
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={commitText}
                  className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium flex items-center gap-0.5"
                >
                  <Check className="w-3 h-3" />
                  <span>Chèn</span>
                </button>
                <button
                  onClick={cancelText}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                  title="Hủy"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating guidance hint for Text tool */}
        {tool === 'text' && !textInput.visible && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-indigo-600/90 text-white text-xs font-semibold rounded-full shadow-lg backdrop-blur-md pointer-events-none flex items-center gap-2 animate-bounce">
            <Type className="w-4 h-4" />
            <span>Nhấp chuột vào vị trí bất kỳ trên bảng để gõ chữ bằng bàn phím</span>
          </div>
        )}

        {/* Floating watermark / status */}
        <div className="absolute bottom-3 left-4 text-[11px] text-slate-500 pointer-events-none select-none flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Bảng trắng EduLive • Hỗ trợ viết bút, gõ phím & đồng bộ tức thời</span>
        </div>
      </div>
    </div>
  );
}
