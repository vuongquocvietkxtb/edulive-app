import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import {
  PenTool,
  Type,
  Mic,
  MicOff,
  Sparkles,
  Undo2,
  Eraser,
  Square,
  Circle,
  Minus,
  Trash2,
  Download,
  Check,
  X
} from 'lucide-react';

// Regex khớp nguyên cụm từ, hỗ trợ chữ có dấu tiếng Việt (\b của JS chỉ hiểu ký tự ASCII)
const phrase = (p) => new RegExp(`(^|[^\\p{L}\\p{N}])${p}(?=$|[^\\p{L}\\p{N}])`, 'giu');

const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', 'n': 'ⁿ' };
const toSup = (s) => [...s].map((c) => SUP[c] || c).join('');

const SPEECH_REPLACEMENTS = [
  ['bình phương', '²'],
  ['lập phương', '³'],
  ['mũ hai', '²'],
  ['mũ ba', '³'],
  ['mũ n', 'ⁿ'],
  ['căn bậc hai của', '√'],
  ['căn bậc hai', '√'],
  ['lớn hơn hoặc bằng', '≥'],
  ['nhỏ hơn hoặc bằng', '≤'],
  ['khác không', '≠ 0'],
  ['không bằng', '≠'],
  ['xấp xỉ', '≈'],
  ['suy ra', '⇒'],
  ['tương đương', '⇔'],
  ['số pi', 'π'],
  ['alpha', 'α'],
  ['beta', 'β'],
  ['delta', 'Δ'],
  ['gạch đầu dòng', '•'],
  ['mũi tên', '→'],
].map(([p, s]) => [phrase(p), s]);

// Chuẩn hóa văn bản nói tiếng Việt sang ký hiệu Toán/Tin học
export function formatSmartSpeechText(rawText) {
  let text = rawText.trim();
  SPEECH_REPLACEMENTS.forEach(([pattern, symbol]) => {
    text = text.replace(pattern, `$1${symbol}`);
  });
  text = text
    // Chrome hay trả "x^2", "x ^ 3", "mũ 4" → chỉ số trên
    .replace(/\s*\^\s*(-?\d+|n)/g, (_, e) => toSup(e))
    .replace(phrase('mũ (-?\\d+)'), (_, pre, e) => pre + toSup(e))
    .replace(/\s+([⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ⁻]+)/g, '$1')
    .replace(/√\s+/g, '√');
  // Chỉ viết hoa khi mở đầu bằng một từ (không viết hoa biến số như "x²")
  return /^\p{L}{2}/u.test(text) ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

// Nhận diện nét vẽ tay để nắn thành hình chuẩn (đường thẳng, chữ nhật, hình tròn)
function detectSmartShape(points) {
  if (!points || points.length < 8) return null;

  const start = points[0];
  const end = points[points.length - 1];

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let pathLength = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
    if (i > 0) pathLength += Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y);
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const diag = Math.hypot(width, height);
  if (diag < 25) return null;

  const directDist = Math.hypot(end.x - start.x, end.y - start.y);

  // 1. Đường thẳng
  if (directDist / pathLength > 0.93) {
    return { tool: 'line', fromX: start.x, fromY: start.y, toX: end.x, toY: end.y };
  }

  // Kiểm tra nét khép kín
  if (directDist >= diag * 0.22) return null;

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const rx = width / 2;
  const ry = height / 2;

  const radii = points.map((p) => Math.hypot((p.x - cx) / (rx || 1), (p.y - cy) / (ry || 1)));
  const avgR = radii.reduce((a, b) => a + b, 0) / radii.length;
  const variance = radii.reduce((acc, r) => acc + Math.pow(r - avgR, 2), 0) / radii.length;

  // 2. Hình tròn
  if (variance < 0.025) {
    const radius = (rx + ry) / 2;
    return { tool: 'circle', fromX: cx, fromY: cy, toX: cx + radius, toY: cy };
  }

  // 3. Hình chữ nhật
  const rectPerimeter = 2 * (width + height);
  if (Math.abs(pathLength - rectPerimeter) / rectPerimeter < 0.18) {
    return { tool: 'rect', fromX: minX, fromY: minY, toX: maxX, toY: maxY };
  }

  return null;
}

const DEFAULT_VOICE_CURSOR = { x: 70, y: 110 };

export default function Whiteboard({ roomId, user, initialHistory = [] }) {
  const { socket } = useSocket();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const snapshotRef = useRef(null);
  const textInputRef = useRef(null);

  // Lịch sử cục bộ để hỗ trợ Hoàn tác
  const historyRef = useRef([...initialHistory]);
  const currentStrokeIdRef = useRef(null);

  // Nắn nét thông minh
  const strokePointsRef = useRef([]);
  const pendingPenActionsRef = useRef([]);

  // Nhận diện giọng nói
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  // Con trỏ giọng nói lưu ở ref để nhiều câu chốt liên tiếp không viết đè nhau
  const voiceCursorRef = useRef(DEFAULT_VOICE_CURSOR);

  const [tool, setTool] = useState('pen'); // 'pen' | 'text' | 'voice' | 'line' | 'rect' | 'circle' | 'eraser'
  const [smartShape, setSmartShape] = useState(true);
  const [color, setColor] = useState('#6366f1');
  const [lineWidth, setLineWidth] = useState(3);
  const [fontSize, setFontSize] = useState(24);
  const [canDraw] = useState(true);

  const [textInput, setTextInput] = useState({ visible: false, x: 0, y: 0, value: '' });

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceCursor, setVoiceCursor] = useState(DEFAULT_VOICE_CURSOR);
  const [remoteVoicePreview, setRemoteVoicePreview] = useState(null);
  const [voiceToast, setVoiceToast] = useState('');

  const colors = ['#ffffff', '#f87171', '#fbbf24', '#34d399', '#38bdf8', '#818cf8', '#c084fc', '#fb7185'];
  const widths = [2, 4, 8, 14];
  const fontSizes = [
    { label: 'Nhỏ', size: 16 },
    { label: 'Vừa', size: 22 },
    { label: 'Lớn', size: 30 },
    { label: 'Tiêu đề', size: 40 }
  ];

  const moveVoiceCursor = useCallback((pos) => {
    voiceCursorRef.current = pos;
    setVoiceCursor(pos);
  }, []);

  const toastTimerRef = useRef(null);
  const showToast = useCallback((msg) => {
    setVoiceToast(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setVoiceToast(''), 2400);
  }, []);

  // Vẽ một hành động lên canvas
  const renderAction = useCallback((ctx, action) => {
    ctx.save();
    ctx.strokeStyle = action.color;
    ctx.lineWidth = action.width || 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (action.tool === 'pen' || action.tool === 'eraser' || action.tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(action.fromX, action.fromY);
      ctx.lineTo(action.toX, action.toY);
      ctx.stroke();
    } else if (action.tool === 'rect') {
      ctx.strokeRect(action.fromX, action.fromY, action.toX - action.fromX, action.toY - action.fromY);
    } else if (action.tool === 'circle') {
      const radius = Math.hypot(action.toX - action.fromX, action.toY - action.fromY);
      ctx.beginPath();
      ctx.arc(action.fromX, action.fromY, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (action.tool === 'text') {
      const fSize = action.fontSize || 24;
      ctx.font = `600 ${fSize}px 'Plus Jakarta Sans', system-ui, sans-serif`;
      ctx.fillStyle = action.color;
      ctx.textBaseline = 'top';
      const lineHeight = fSize * 1.35;
      (action.text || '').split('\n').forEach((line, index) => {
        ctx.fillText(line, action.x, action.y + index * lineHeight);
      });
    }
    ctx.restore();
  }, []);

  // Vẽ lại toàn bộ bảng từ lịch sử
  const redrawFromHistory = useCallback((actions) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    if (Array.isArray(actions)) actions.forEach((act) => renderAction(ctx, act));
  }, [renderAction]);

  // Khởi tạo canvas & vẽ lại lịch sử
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    historyRef.current = [...initialHistory];
    redrawFromHistory(historyRef.current);
  }, [initialHistory, redrawFromHistory]);

  // Đồng bộ qua Socket
  useEffect(() => {
    if (!socket) return;

    const handleDrawUpdate = (action) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      historyRef.current.push(action);
      renderAction(canvas.getContext('2d'), action);
    };
    const handleHistorySync = (updatedHistory) => {
      historyRef.current = [...updatedHistory];
      redrawFromHistory(historyRef.current);
    };
    const handleVoicePreview = (preview) => setRemoteVoicePreview(preview);
    const handleCleared = () => {
      historyRef.current = [];
      setRemoteVoicePreview(null);
      redrawFromHistory([]);
    };

    socket.on('whiteboard-draw-update', handleDrawUpdate);
    socket.on('whiteboard-history-sync', handleHistorySync);
    socket.on('whiteboard-voice-preview', handleVoicePreview);
    socket.on('whiteboard-cleared', handleCleared);
    return () => {
      socket.off('whiteboard-draw-update', handleDrawUpdate);
      socket.off('whiteboard-history-sync', handleHistorySync);
      socket.off('whiteboard-voice-preview', handleVoicePreview);
      socket.off('whiteboard-cleared', handleCleared);
    };
  }, [socket, renderAction, redrawFromHistory]);

  useEffect(() => {
    if (textInput.visible && textInputRef.current) textInputRef.current.focus();
  }, [textInput.visible]);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) {
      showToast('Không còn thao tác để hoàn tác');
      return;
    }
    const lastAction = historyRef.current[historyRef.current.length - 1];
    const nextHistory = lastAction.strokeId
      ? historyRef.current.filter((act) => act.strokeId !== lastAction.strokeId)
      : historyRef.current.slice(0, -1);
    historyRef.current = nextHistory;
    redrawFromHistory(nextHistory);
    socket?.emit('whiteboard-undo', { roomId });
  }, [redrawFromHistory, socket, roomId, showToast]);

  const clearCanvasLocally = useCallback(() => {
    historyRef.current = [];
    redrawFromHistory([]);
    setTextInput({ visible: false, x: 0, y: 0, value: '' });
    moveVoiceCursor(DEFAULT_VOICE_CURSOR);
    socket?.emit('whiteboard-clear', { roomId });
  }, [redrawFromHistory, socket, roomId, moveVoiceCursor]);

  const handleClearBoard = () => {
    if (user?.role !== 'teacher' && !window.confirm('Bạn có chắc muốn xóa sạch bảng vẽ không?')) return;
    clearCanvasLocally();
  };

  // Giá trị mới nhất cho SpeechRecognition (tránh stale closure)
  const latestVoiceCtx = useRef({});
  latestVoiceCtx.current = { color, fontSize, roomId, socket, renderAction, handleUndo, clearCanvasLocally, showToast };

  // Xử lý câu nói hoàn chỉnh (khẩu lệnh hoặc viết chữ lên canvas)
  const processSpokenSentence = useCallback((rawTranscript) => {
    const normalized = rawTranscript.trim().toLowerCase().replace(/[.,!?]+$/, '');
    const {
      color: activeColor,
      fontSize: activeFontSize,
      roomId: activeRoomId,
      socket: activeSocket,
      renderAction: drawFn,
      handleUndo: undoFn,
      clearCanvasLocally: clearFn,
      showToast: toastFn
    } = latestVoiceCtx.current;
    const cur = voiceCursorRef.current;

    // Câu đã chốt (kể cả khẩu lệnh) → xóa chữ nháp trên màn hình học sinh
    activeSocket?.emit('whiteboard-voice-preview', { roomId: activeRoomId, preview: null });

    // 1. Khẩu lệnh điều khiển bảng
    if (normalized === 'xóa bảng' || normalized === 'xóa hết bảng') {
      clearFn();
      toastFn('Đã xóa sạch bảng');
      return;
    }
    if (normalized === 'hoàn tác' || normalized === 'quay lại') {
      undoFn();
      toastFn('Đã hoàn tác');
      return;
    }
    if (normalized === 'xuống dòng') {
      moveVoiceCursor({ x: cur.x, y: cur.y + activeFontSize * 1.45 });
      toastFn('Đã xuống dòng');
      return;
    }
    if (normalized.startsWith('đổi màu ') || normalized.startsWith('màu ')) {
      const name = normalized.replace(/^(đổi )?màu /, '').trim();
      const colorMap = {
        'trắng': '#ffffff',
        'đỏ': '#f87171',
        'vàng': '#fbbf24',
        'xanh lá': '#34d399',
        'xanh dương': '#38bdf8',
        'xanh': '#38bdf8',
        'tím': '#c084fc',
        'hồng': '#fb7185'
      };
      if (colorMap[name]) {
        setColor(colorMap[name]);
        toastFn(`Đổi màu chữ: ${name}`);
        return;
      }
    }
    const sizeCommands = { 'chữ nhỏ': 16, 'chữ vừa': 22, 'chữ lớn': 30, 'tiêu đề': 40 };
    if (sizeCommands[normalized]) {
      setFontSize(sizeCommands[normalized]);
      toastFn(`Đã chọn cỡ: ${normalized}`);
      return;
    }

    // 2. Chuẩn hóa và chốt thành đối tượng văn bản trên bảng
    const formatted = formatSmartSpeechText(rawTranscript);
    if (!formatted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const action = { tool: 'text', x: cur.x, y: cur.y, text: formatted, color: activeColor, fontSize: activeFontSize };
    historyRef.current.push(action);
    drawFn(canvas.getContext('2d'), action);
    activeSocket?.emit('whiteboard-draw', { roomId: activeRoomId, action });

    // Tự dời con trỏ xuống dòng tiếp theo
    moveVoiceCursor({ x: cur.x, y: cur.y + activeFontSize * 1.45 });
  }, [moveVoiceCursor]);

  // Khởi tạo Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          processSpokenSentence(transcript);
          setInterimTranscript('');
        } else {
          interim += transcript;
        }
      }
      if (interim) {
        // Chữ nháp cũng hiển thị dạng ký hiệu (x² thay vì "x bình phương")
        interim = formatSmartSpeechText(interim);
        setInterimTranscript(interim);
        const { color: col, fontSize: fSize, socket: sock, roomId: rId } = latestVoiceCtx.current;
        const cur = voiceCursorRef.current;
        sock?.emit('whiteboard-voice-preview', {
          roomId: rId,
          preview: { text: interim, x: cur.x, y: cur.y, color: col, fontSize: fSize }
        });
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        shouldListenRef.current = false;
        setIsListening(false);
        showToast('Vui lòng cấp quyền Micro trên trình duyệt');
      }
    };

    recognition.onend = () => {
      if (shouldListenRef.current) {
        try { recognition.start(); } catch (_) {}
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    return () => {
      shouldListenRef.current = false;
      recognition.stop();
    };
  }, [processSpokenSentence, showToast]);

  const stopVoiceListening = useCallback(() => {
    shouldListenRef.current = false;
    try { recognitionRef.current?.stop(); } catch (_) {}
    setIsListening(false);
    setInterimTranscript('');
    socket?.emit('whiteboard-voice-preview', { roomId, preview: null });
  }, [socket, roomId]);

  const toggleVoiceTool = () => {
    commitText();
    const recognition = recognitionRef.current;
    if (!recognition) {
      showToast('Trình duyệt chưa hỗ trợ giọng nói (hãy dùng Chrome/Edge)');
      return;
    }
    if (tool === 'voice' && isListening) {
      stopVoiceListening();
      return;
    }
    setTool('voice');
    shouldListenRef.current = true;
    try {
      recognition.start();
    } catch (_) {
      // Đã đang chạy → vẫn coi là đang nghe
    }
    setIsListening(true);
    showToast('Đang nghe... Nhấp lên bảng để chọn vị trí viết');
  };

  const selectStandardTool = (nextTool) => {
    if (isListening) stopVoiceListening();
    if (nextTool !== 'text') commitText();
    setTool(nextTool);
  };

  const getCanvasCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const commitText = () => {
    if (!textInput.visible) return;
    const textToCommit = textInput.value.trim();
    if (textToCommit && canvasRef.current) {
      const action = { tool: 'text', x: textInput.x, y: textInput.y, text: textToCommit, color, fontSize };
      historyRef.current.push(action);
      renderAction(canvasRef.current.getContext('2d'), action);
      socket?.emit('whiteboard-draw', { roomId, action });
    }
    setTextInput({ visible: false, x: 0, y: 0, value: '' });
  };

  const cancelText = () => setTextInput({ visible: false, x: 0, y: 0, value: '' });

  const startDraw = (e) => {
    if (!canDraw) return;
    const coords = getCanvasCoords(e);

    if (tool === 'voice') {
      moveVoiceCursor({ x: Math.round(coords.x), y: Math.round(coords.y) });
      return;
    }
    if (tool === 'text') {
      if (textInput.visible && textInput.value.trim()) commitText();
      setTextInput({ visible: true, x: coords.x, y: coords.y, value: '' });
      return;
    }
    if (textInput.visible) commitText();

    isDrawing.current = true;
    startPos.current = coords;
    currentStrokeIdRef.current = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    strokePointsRef.current = [coords];
    pendingPenActionsRef.current = [];

    const canvas = canvasRef.current;
    snapshotRef.current = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  };

  const draw = (e) => {
    if (!isDrawing.current || !canDraw || tool === 'text' || tool === 'voice') return;
    const coords = getCanvasCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    const actualColor = tool === 'eraser' ? '#0f172a' : color;
    const actualWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;

    if (tool === 'pen' || tool === 'eraser') {
      const action = {
        tool,
        strokeId: currentStrokeIdRef.current,
        fromX: startPos.current.x,
        fromY: startPos.current.y,
        toX: coords.x,
        toY: coords.y,
        color: actualColor,
        width: actualWidth
      };
      renderAction(ctx, action);

      if (tool === 'pen' && smartShape) {
        strokePointsRef.current.push(coords);
        pendingPenActionsRef.current.push(action);
      } else {
        historyRef.current.push(action);
        socket?.emit('whiteboard-draw', { roomId, action });
      }
      startPos.current = coords;
    } else {
      if (snapshotRef.current) ctx.putImageData(snapshotRef.current, 0, 0);
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
    if (!isDrawing.current || tool === 'text' || tool === 'voice') return;
    isDrawing.current = false;
    const ctx = canvasRef.current.getContext('2d');

    if (tool === 'pen' && smartShape) {
      const recognized = detectSmartShape(strokePointsRef.current);
      if (recognized && snapshotRef.current) {
        ctx.putImageData(snapshotRef.current, 0, 0);
        const shapeAction = { ...recognized, color, width: lineWidth };
        historyRef.current.push(shapeAction);
        renderAction(ctx, shapeAction);
        socket?.emit('whiteboard-draw', { roomId, action: shapeAction });
      } else {
        pendingPenActionsRef.current.forEach((act) => {
          historyRef.current.push(act);
          socket?.emit('whiteboard-draw', { roomId, action: act });
        });
      }
      strokePointsRef.current = [];
      pendingPenActionsRef.current = [];
      return;
    }

    if (tool !== 'pen' && tool !== 'eraser') {
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
      historyRef.current.push(action);
      renderAction(ctx, action);
      socket?.emit('whiteboard-draw', { roomId, action });
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

  const toolBtn = (name, Icon, title, activeCls = 'bg-indigo-600 text-white') => (
    <button
      onClick={() => selectStandardTool(name)}
      className={`p-1.5 rounded-md transition-colors ${tool === name ? activeCls : 'text-slate-400 hover:text-slate-200'}`}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl"
    >
      {/* Thanh công cụ */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-lg">
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg">
          {toolBtn('pen', PenTool, 'Bút vẽ tự do')}

          {tool === 'pen' && (
            <button
              onClick={() => setSmartShape((prev) => !prev)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                smartShape ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tự động nắn nét vẽ tay thành đường thẳng, hình chữ nhật, hình tròn"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Nắn nét</span>
            </button>
          )}

          <button
            onClick={() => selectStandardTool('text')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors ${
              tool === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Gõ chữ bằng bàn phím"
          >
            <Type className="w-4 h-4" />
            <span className="text-xs font-semibold hidden sm:inline">Gõ chữ</span>
          </button>

          {/* Viết bảng bằng giọng nói */}
          <button
            onClick={toggleVoiceTool}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all ${
              tool === 'voice' && isListening
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 animate-pulse'
                : tool === 'voice'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/70'
            }`}
            title="Nói để viết chữ & ra lệnh điều khiển bảng bằng giọng nói"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-sky-400" />}
            <span className="text-xs font-semibold">{isListening ? 'Đang nghe...' : 'Nói viết bảng'}</span>
          </button>

          {toolBtn('line', Minus, 'Đường thẳng')}
          {toolBtn('rect', Square, 'Hình chữ nhật')}
          {toolBtn('circle', Circle, 'Hình tròn / Elip')}
          {toolBtn('eraser', Eraser, 'Tẩy xóa', 'bg-rose-600 text-white')}
        </div>

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

        {tool === 'text' || tool === 'voice' ? (
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

        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-300 hover:text-amber-200 hover:bg-amber-500/20 rounded-lg transition-colors border border-amber-500/30"
            title="Hoàn tác nét vẽ / dòng chữ vừa tạo"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hoàn tác</span>
          </button>
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

      {/* Vùng canvas */}
      <div className={`flex-1 w-full h-full relative ${tool === 'text' || tool === 'voice' ? 'cursor-text' : 'cursor-crosshair'}`}>
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

        {/* Con trỏ & chữ nháp của giáo viên */}
        {tool === 'voice' && (
          <div
            style={{
              position: 'absolute',
              left: `${voiceCursor.x}px`,
              top: `${voiceCursor.y}px`,
              fontSize: `${fontSize}px`,
              color,
              lineHeight: 1.35
            }}
            className="z-20 pointer-events-none flex items-center gap-2 px-3 py-1 rounded-lg border-2 border-dashed border-sky-400/80 bg-slate-900/85 backdrop-blur-sm shadow-lg max-w-[75%]"
          >
            <span className="w-0.5 h-6 bg-sky-400 animate-ping" />
            <span className="font-semibold">
              {interimTranscript || (isListening ? 'Đang nghe giọng nói của bạn...' : 'Nhấn "Nói viết bảng" để bắt đầu')}
            </span>
          </div>
        )}

        {/* Chữ nháp đồng bộ tới học sinh */}
        {remoteVoicePreview && tool !== 'voice' && (
          <div
            style={{
              position: 'absolute',
              left: `${remoteVoicePreview.x}px`,
              top: `${remoteVoicePreview.y}px`,
              fontSize: `${remoteVoicePreview.fontSize}px`,
              color: remoteVoicePreview.color,
              lineHeight: 1.35
            }}
            className="z-20 pointer-events-none flex items-center gap-2 px-3 py-1 rounded-lg border border-dashed border-sky-400/60 bg-slate-900/80 backdrop-blur-sm max-w-[75%]"
          >
            <Mic className="w-4 h-4 text-sky-400 animate-pulse flex-shrink-0" />
            <span className="font-semibold">{remoteVoicePreview.text}</span>
          </div>
        )}

        {voiceToast && (
          <div className="absolute top-20 right-4 z-30 px-3.5 py-1.5 rounded-full bg-emerald-600/90 text-white text-xs font-semibold shadow-lg backdrop-blur-md">
            {voiceToast}
          </div>
        )}

        {/* Ô gõ chữ nổi trên canvas */}
        {textInput.visible && (
          <div
            style={{ position: 'absolute', left: `${textInput.x}px`, top: `${textInput.y}px`, maxWidth: '80%' }}
            className="z-30 flex flex-col gap-1.5 p-1 bg-slate-900/95 border-2 border-indigo-500 rounded-xl shadow-2xl backdrop-blur-md"
          >
            <textarea
              ref={textInputRef}
              value={textInput.value}
              onChange={(e) => setTextInput((prev) => ({ ...prev, value: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  commitText();
                } else if (e.key === 'Escape') {
                  cancelText();
                }
              }}
              placeholder="Gõ nội dung bài giảng ở đây... (Enter để chèn)"
              style={{ color, fontSize: `${fontSize}px`, lineHeight: 1.35 }}
              rows={Math.max(1, textInput.value.split('\n').length)}
              className="bg-transparent border-0 outline-none resize-none font-semibold px-2 py-1 placeholder:text-slate-500 min-w-[260px] font-sans"
            />
            <div className="flex items-center justify-between gap-2 px-1 pt-1 border-t border-slate-800 text-[11px] text-slate-400">
              <span>
                Nhấn <strong className="text-indigo-400">Enter</strong> để chèn chữ • <strong>Esc</strong> hủy
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={commitText}
                  className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium flex items-center gap-0.5"
                >
                  <Check className="w-3 h-3" />
                  <span>Chèn</span>
                </button>
                <button onClick={cancelText} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded" title="Hủy">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {tool === 'text' && !textInput.visible && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-indigo-600/90 text-white text-xs font-semibold rounded-full shadow-lg backdrop-blur-md pointer-events-none flex items-center gap-2 animate-bounce">
            <Type className="w-4 h-4" />
            <span>Nhấp chuột vào vị trí bất kỳ trên bảng để gõ chữ bằng bàn phím</span>
          </div>
        )}

        {tool === 'voice' && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-sky-600/90 text-white text-xs font-medium rounded-full shadow-lg backdrop-blur-md pointer-events-none flex items-center gap-2">
            <Mic className="w-3.5 h-3.5" />
            <span>Nhấp lên bảng để dời con trỏ • Khẩu lệnh: "xuống dòng", "hoàn tác", "xóa bảng", "đổi màu..."</span>
          </div>
        )}

        <div className="absolute bottom-3 left-4 text-[11px] text-slate-500 pointer-events-none select-none flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Bảng trắng thông minh EduLive • Hỗ trợ viết bút, nắn nét, gõ phím & giọng nói</span>
        </div>
      </div>
    </div>
  );
}
