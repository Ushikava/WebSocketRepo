import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stage, Layer, Line, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import {
  Box, AppBar, Toolbar, Typography, IconButton,
  Slider, Tooltip, Button, Divider,
  Paper, TextField, Select, MenuItem, Chip,
} from '@mui/material';
import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  Brush, OpenWith, Delete, CloudUpload, AutoFixHigh,
  PanTool, Wallpaper, HideImage, GridOn, GridOff,
  Chat, Casino, Send, Close, Add,
} from '@mui/icons-material';

type Tool = 'draw' | 'erase' | 'select' | 'pan';

interface LineData {
  id: string;
  user: string;
  points: number[];
  color: string;
  strokeWidth: number;
  compositeOp: 'source-over' | 'destination-out';
}

interface ImageItem {
  id: string;
  user: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  image: HTMLImageElement;
}

interface ChatMsg {
  id: string;
  user: string;
  text: string;
  msg_type: 'text' | 'dice';
  timestamp: string;
}

const DEFAULT_CANVAS = { w: 2000, h: 2000 };
const DICE_SIDES = [2, 4, 6, 8, 10, 12, 20, 100];

const theme = createTheme({
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { margin: 0, padding: 0 },
        html: { margin: 0, padding: 0 },
      },
    },
  },
});

function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

const formatTime = (ts: string) => {
  try {
    return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

export default function CanvasPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [tool, setTool] = useState<Tool>('draw');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  const [lines, setLines] = useState<LineData[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState(DEFAULT_CANVAS);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(100);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Chat & dice
  const [chatOpen, setChatOpen] = useState(false);
  const [diceOpen, setDiceOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [diceList, setDiceList] = useState<number[]>([6]);
  const [addDiceSides, setAddDiceSides] = useState<number>(6);

  const stageRef = useRef<Konva.Stage>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isDrawing = useRef(false);
  const currentLineRef = useRef<LineData | null>(null);
  const activeDrawLayerRef = useRef<Konva.Layer>(null);
  const activeKonvaLineRef = useRef<Konva.Line | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const nicknameRef = useRef('');
  const isPanning = useRef(false);
  const panStart = useRef({ mx: 0, my: 0, sx: 0, sy: 0 });
  const centered = useRef(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // ── Grid lines ───────────────────────────────────────────────────────────────

  const gridLines = useMemo(() => {
    if (!showGrid) return { v: [] as number[][], h: [] as number[][] };
    const v: number[][] = [];
    const h: number[][] = [];
    for (let x = gridSize; x < canvasSize.w; x += gridSize)
      v.push([x, 0, x, canvasSize.h]);
    for (let y = gridSize; y < canvasSize.h; y += gridSize)
      h.push([0, y, canvasSize.w, y]);
    return { v, h };
  }, [showGrid, gridSize, canvasSize]);

  // ── Center stage helper ──────────────────────────────────────────────────────

  const centerStage = useCallback((cw: number, ch: number) => {
    const stage = stageRef.current;
    const container = containerRef.current;
    if (!stage || !container) return;
    const vw = container.offsetWidth;
    const vh = container.offsetHeight;
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: (vw - cw) / 2, y: (vh - ch) / 2 });
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const loadAndAddImage = useCallback(async (imgData: Omit<ImageItem, 'image'>) => {
    try {
      const image = await loadImg(imgData.url);
      setImages(prev => [...prev, { ...imgData, image }]);
    } catch (e) {
      console.error('Failed to load image:', e);
    }
  }, []);

  const applyBackground = useCallback(async (url: string) => {
    try {
      const img = await loadImg(url);
      const newSize = { w: img.naturalWidth, h: img.naturalHeight };
      setBgImage(img);
      setBgUrl(url);
      setCanvasSize(newSize);
      centerStage(newSize.w, newSize.h);
    } catch (e) {
      console.error('Failed to load background:', e);
    }
  }, [centerStage]);

  const clearBackground = useCallback(() => {
    setBgImage(null);
    setBgUrl(null);
    setCanvasSize(DEFAULT_CANVAS);
  }, []);

  // ── WebSocket message handler ────────────────────────────────────────────────

  const handleWsMessage = useCallback((msg: any) => {
    switch (msg.type) {
      case 'draw':
        setLines(prev => [...prev, msg.line as LineData]);
        break;
      case 'move_image':
        setImages(prev =>
          prev.map(img => img.id === msg.id ? { ...img, x: msg.x, y: msg.y } : img)
        );
        break;
      case 'add_image':
        loadAndAddImage(msg.image);
        break;
      case 'clear':
        setLines([]);
        setImages([]);
        setSelectedImageId(null);
        break;
      case 'delete_image':
        setImages(prev => prev.filter(img => img.id !== msg.id));
        setSelectedImageId(prev => prev === msg.id ? null : prev);
        break;
      case 'transform_image':
        setImages(prev => prev.map(img =>
          img.id === msg.id
            ? { ...img, x: msg.x, y: msg.y, width: msg.width, height: msg.height }
            : img
        ));
        break;
      case 'set_background':
        applyBackground(msg.url);
        break;
      case 'clear_background':
        clearBackground();
        break;
      case 'chat_message':
        setChatMessages(prev => [...prev, msg as ChatMsg]);
        break;
    }
  }, [loadAndAddImage, applyBackground, clearBackground]);

  // ── Auto-scroll chat ─────────────────────────────────────────────────────────

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Deselect when switching away from select tool ────────────────────────────

  useEffect(() => {
    if (tool !== 'select') setSelectedImageId(null);
  }, [tool]);

  // ── Attach Transformer to selected image ─────────────────────────────────────

  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr || !stageRef.current) return;
    if (selectedImageId) {
      const node = stageRef.current.findOne(`#${selectedImageId}`);
      tr.nodes(node ? [node] : []);
    } else {
      tr.nodes([]);
    }
    tr.getLayer()?.batchDraw();
  }, [selectedImageId]);

  // ── Auth + initial state load + WebSocket ────────────────────────────────────

  useEffect(() => {
    const saved = localStorage.getItem('canvas_nickname');
    if (!saved) { navigate('/login'); return; }
    setNickname(saved);
    nicknameRef.current = saved;

    fetch('/api/canvas/state')
      .then(r => r.json())
      .then(async (data) => {
        setLines(data.lines ?? []);
        const loaded = await Promise.all(
          (data.images ?? []).map(async (img: Omit<ImageItem, 'image'>) => ({
            ...img,
            image: await loadImg(img.url),
          }))
        );
        setImages(loaded);
        if (data.background) applyBackground(data.background);
        setChatMessages(data.messages ?? []);
      })
      .catch(console.error);

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(
      `${proto}//${window.location.host}/api/canvas/ws/${encodeURIComponent(saved)}`
    );
    wsRef.current = ws;
    ws.onmessage = e => { try { handleWsMessage(JSON.parse(e.data)); } catch {} };
    ws.onerror = e => console.error('WS error:', e);
    return () => ws.close();
  }, [navigate, handleWsMessage, applyBackground]);

  // ── Viewport resize + initial centering ─────────────────────────────────────

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      const h = containerRef.current.offsetHeight;
      setStageSize({ width: w, height: h });
      if (!centered.current && stageRef.current) {
        centered.current = true;
        stageRef.current.position({
          x: (w - DEFAULT_CANVAS.w) / 2,
          y: (h - DEFAULT_CANVAS.h) / 2,
        });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── Middle-mouse pan ─────────────────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onDown = (e: MouseEvent) => {
      if (e.button !== 1) return;
      e.preventDefault();
      isPanning.current = true;
      const stage = stageRef.current;
      panStart.current = { mx: e.clientX, my: e.clientY, sx: stage?.x() ?? 0, sy: stage?.y() ?? 0 };
    };
    const onMove = (e: MouseEvent) => {
      if (!isPanning.current) return;
      const stage = stageRef.current;
      if (!stage) return;
      stage.position({
        x: panStart.current.sx + (e.clientX - panStart.current.mx),
        y: panStart.current.sy + (e.clientY - panStart.current.my),
      });
      stage.batchDraw();
    };
    const onUp = (e: MouseEvent) => { if (e.button === 1) isPanning.current = false; };
    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // ── Canvas coordinate conversion ─────────────────────────────────────────────

  const getCanvasPos = useCallback((stage: Konva.Stage) => {
    const p = stage.getPointerPosition();
    if (!p) return null;
    return {
      x: (p.x - stage.x()) / stage.scaleX(),
      y: (p.y - stage.y()) / stage.scaleY(),
    };
  }, []);

  // ── Drawing handlers ─────────────────────────────────────────────────────────

  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (tool === 'pan') return;
    if (tool === 'select') {
      if (e.target === e.target.getStage()) setSelectedImageId(null);
      return;
    }
    if (e.evt.button !== 0) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = getCanvasPos(stage);
    if (!pos) return;
    isDrawing.current = true;

    const lineData: LineData = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      user: nicknameRef.current,
      points: [pos.x, pos.y],
      color: tool === 'erase' ? 'rgba(0,0,0,1)' : color,
      strokeWidth: tool === 'erase' ? brushSize * 3 : brushSize,
      compositeOp: tool === 'erase' ? 'destination-out' : 'source-over',
    };
    currentLineRef.current = lineData;

    const layer = activeDrawLayerRef.current;
    if (!layer) return;
    const kLine = new Konva.Line({
      points: lineData.points,
      stroke: lineData.color,
      strokeWidth: lineData.strokeWidth,
      tension: 0.4,
      lineCap: 'round',
      lineJoin: 'round',
      globalCompositeOperation: lineData.compositeOp,
      listening: false,
    });
    layer.add(kLine);
    activeKonvaLineRef.current = kLine;
  }, [tool, color, brushSize, getCanvasPos]);

  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = getCanvasPos(stage);
    if (!pos) return;
    const kLine = activeKonvaLineRef.current;
    if (!kLine) return;
    const newPoints = [...kLine.points(), pos.x, pos.y];
    kLine.points(newPoints);
    activeDrawLayerRef.current?.batchDraw();
    if (currentLineRef.current) {
      currentLineRef.current = { ...currentLineRef.current, points: newPoints };
    }
  }, [getCanvasPos]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    const kLine = activeKonvaLineRef.current;
    if (kLine) {
      kLine.destroy();
      activeDrawLayerRef.current?.batchDraw();
      activeKonvaLineRef.current = null;
    }

    const lineData = currentLineRef.current;
    currentLineRef.current = null;
    if (!lineData) return;

    const pts = lineData.points.length >= 4
      ? lineData.points
      : [...lineData.points, lineData.points[0] + 0.5, lineData.points[1] + 0.5];
    const finalLine = { ...lineData, points: pts };
    setLines(prev => [...prev, finalLine]);
    wsRef.current?.send(JSON.stringify({ type: 'stroke_end', line: finalLine }));
  }, []);

  // ── Zoom ─────────────────────────────────────────────────────────────────────

  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const direction = e.evt.deltaY < 0 ? 1 : -1;
    const newScale = Math.min(10, Math.max(0.05, oldScale * (direction > 0 ? 1.1 : 1 / 1.1)));
    const anchor = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    stage.scale({ x: newScale, y: newScale });
    stage.position({ x: pointer.x - anchor.x * newScale, y: pointer.y - anchor.y * newScale });
  }, []);

  // ── Image upload ─────────────────────────────────────────────────────────────

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const objUrl = URL.createObjectURL(file);
    const img = await loadImg(objUrl);
    URL.revokeObjectURL(objUrl);
    const maxW = 400;
    const scale = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const formData = new FormData();
    formData.append('file', file);
    const params = new URLSearchParams({
      user: nicknameRef.current, x: '100', y: '100',
      width: String(w), height: String(h),
    });
    try {
      const res = await fetch(`/api/canvas/image?${params}`, { method: 'POST', body: formData });
      const data = await res.json();
      const image = await loadImg(data.url);
      setImages(prev => [...prev, { ...data, image }]);
      wsRef.current?.send(JSON.stringify({
        type: 'add_image',
        image: { id: data.id, user: nicknameRef.current, url: data.url, x: data.x, y: data.y, width: data.width, height: data.height },
      }));
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`/api/canvas/background?user=${encodeURIComponent(nicknameRef.current)}`, {
        method: 'POST', body: formData,
      });
      const data = await res.json();
      applyBackground(data.url);
    } catch (err) {
      console.error('Background upload failed:', err);
    }
  };

  const handleClearBg = async () => {
    await fetch('/api/canvas/background', { method: 'DELETE' });
    clearBackground();
  };

  // ── Image interactions ───────────────────────────────────────────────────────

  const handleImageDragEnd = useCallback((id: string, e: KonvaEventObject<DragEvent>) => {
    const { x, y } = e.target.position();
    setImages(prev => prev.map(img => img.id === id ? { ...img, x, y } : img));
    wsRef.current?.send(JSON.stringify({ type: 'move_image', id, x, y }));
  }, []);

  const handleImageTransformEnd = useCallback((id: string, e: KonvaEventObject<Event>) => {
    const node = e.target as Konva.Image;
    const newWidth = Math.max(10, node.width() * node.scaleX());
    const newHeight = Math.max(10, node.height() * node.scaleY());
    const newX = node.x();
    const newY = node.y();
    node.width(newWidth);
    node.height(newHeight);
    node.scaleX(1);
    node.scaleY(1);
    setImages(prev => prev.map(img =>
      img.id === id ? { ...img, x: newX, y: newY, width: newWidth, height: newHeight } : img
    ));
    wsRef.current?.send(JSON.stringify({
      type: 'transform_image', id, x: newX, y: newY, width: newWidth, height: newHeight,
    }));
  }, []);

  const handleDeleteImage = useCallback(() => {
    if (!selectedImageId) return;
    const id = selectedImageId;
    setSelectedImageId(null);
    setImages(prev => prev.filter(img => img.id !== id));
    wsRef.current?.send(JSON.stringify({ type: 'delete_image', id }));
  }, [selectedImageId]);

  // ── Clear / reset ────────────────────────────────────────────────────────────

  const handleClear = () => {
    setLines([]); setImages([]); currentLineRef.current = null;
    wsRef.current?.send(JSON.stringify({ type: 'clear' }));
  };

  const resetView = () => centerStage(canvasSize.w, canvasSize.h);

  // ── Chat ─────────────────────────────────────────────────────────────────────

  const sendChatMessage = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput('');
    const localMsg: ChatMsg = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      user: nicknameRef.current,
      text,
      msg_type: 'text',
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, localMsg]);
    wsRef.current?.send(JSON.stringify({ type: 'chat_message', text }));
  }, [chatInput]);

  // ── Dice ─────────────────────────────────────────────────────────────────────

  const rollDice = useCallback(() => {
    if (diceList.length === 0) return;
    const dice = diceList.map(sides => ({
      sides,
      result: Math.floor(Math.random() * sides) + 1,
    }));
    const total = dice.reduce((s, d) => s + d.result, 0);
    const parts = dice.map(d => `d${d.sides}=${d.result}`).join(', ');
    const localMsg: ChatMsg = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      user: nicknameRef.current,
      text: `бросил: ${parts} (итого: ${total})`,
      msg_type: 'dice',
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, localMsg]);
    wsRef.current?.send(JSON.stringify({ type: 'dice_roll', dice }));
  }, [diceList]);

  // ── UI helpers ───────────────────────────────────────────────────────────────

  const toolBtn = (t: Tool, icon: React.ReactNode, label: string) => (
    <Tooltip title={label} key={t}>
      <IconButton size="small" onClick={() => setTool(t)} sx={{
        color: tool === t ? '#ffd740' : 'rgba(255,255,255,0.75)',
        bgcolor: tool === t ? 'rgba(255,215,64,0.12)' : 'transparent',
        borderRadius: 1.5,
      }}>
        {icon}
      </IconButton>
    </Tooltip>
  );

  const cursorMap: Record<Tool, string> = {
    draw: 'crosshair', erase: 'cell', select: 'default', pan: 'grab',
  };

  const diceLabel = diceList.length === 0 ? '' :
    diceList.length === 1 ? ' (1 кубик)' :
    diceList.length < 5 ? ` (${diceList.length} кубика)` :
    ` (${diceList.length} кубиков)`;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <AppBar position="static" sx={{ bgcolor: '#1a1a2e', flexShrink: 0 }}>
          <Toolbar variant="dense" sx={{ gap: 0.5, minHeight: 52, px: 1 }}>
            <Typography sx={{ mr: 1, fontWeight: 'bold', fontSize: 13, color: '#ffd740' }}>
              {nickname}
            </Typography>

            {toolBtn('draw',   <Brush fontSize="small" />,      'Кисть')}
            {toolBtn('erase',  <AutoFixHigh fontSize="small" />, 'Ластик')}
            {toolBtn('select', <OpenWith fontSize="small" />,    'Двигать картинку')}
            {toolBtn('pan',    <PanTool fontSize="small" />,     'Двигать холст (или средняя кнопка мыши)')}

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, bgcolor: 'rgba(255,255,255,0.15)' }} />

            {/* Color */}
            <Tooltip title="Цвет кисти">
              <Box component="label" sx={{
                width: 26, height: 26, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.4)',
                bgcolor: color, cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
              }}>
                <input type="color" value={color} onChange={e => setColor(e.target.value)}
                  style={{ opacity: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none', padding: 0 }} />
              </Box>
            </Tooltip>

            {/* Brush size */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mx: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', minWidth: 18, textAlign: 'right', fontSize: 11 }}>
                {brushSize}
              </Typography>
              <Slider value={brushSize} onChange={(_, v) => setBrushSize(v as number)} min={1} max={60}
                sx={{ width: 75, color: '#ffd740', '& .MuiSlider-thumb': { width: 12, height: 12 } }} />
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, bgcolor: 'rgba(255,255,255,0.15)' }} />

            {/* Grid toggle */}
            <Tooltip title={showGrid ? 'Выключить сетку' : 'Включить сетку'}>
              <IconButton size="small" onClick={() => setShowGrid(v => !v)} sx={{
                color: showGrid ? '#ffd740' : 'rgba(255,255,255,0.75)',
                bgcolor: showGrid ? 'rgba(255,215,64,0.12)' : 'transparent',
                borderRadius: 1.5,
              }}>
                {showGrid ? <GridOff fontSize="small" /> : <GridOn fontSize="small" />}
              </IconButton>
            </Tooltip>

            {showGrid && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                  {gridSize}px
                </Typography>
                <Slider value={gridSize} onChange={(_, v) => setGridSize(v as number)} min={20} max={500} step={10}
                  sx={{ width: 70, color: '#ffd740', '& .MuiSlider-thumb': { width: 12, height: 12 } }} />
              </Box>
            )}

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, bgcolor: 'rgba(255,255,255,0.15)' }} />

            {/* Background */}
            <input ref={bgInputRef} type="file" accept="image/*" hidden onChange={handleBgUpload} />
            <Tooltip title={bgUrl ? `Сменить фон (${canvasSize.w}×${canvasSize.h})` : 'Установить фон — холст подстроится под размер картинки'}>
              <IconButton size="small" onClick={() => bgInputRef.current?.click()}
                sx={{ color: bgUrl ? '#69f0ae' : 'rgba(255,255,255,0.75)', borderRadius: 1.5 }}>
                <Wallpaper fontSize="small" />
              </IconButton>
            </Tooltip>
            {bgUrl && (
              <Tooltip title="Убрать фон (холст вернётся к 2000×2000)">
                <IconButton size="small" onClick={handleClearBg} sx={{ color: 'rgba(255,100,100,0.8)', borderRadius: 1.5 }}>
                  <HideImage fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, bgcolor: 'rgba(255,255,255,0.15)' }} />

            {/* Upload image */}
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
            <Button size="small" startIcon={<CloudUpload sx={{ fontSize: 15 }} />}
              onClick={() => fileInputRef.current?.click()} variant="outlined"
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.25)', textTransform: 'none', fontSize: 12 }}>
              Картинка
            </Button>

            {/* Delete selected image */}
            {selectedImageId && tool === 'select' && (
              <Tooltip title="Удалить выбранную картинку">
                <IconButton size="small" onClick={handleDeleteImage}
                  sx={{ color: '#ff5252', bgcolor: 'rgba(255,82,82,0.12)', borderRadius: 1.5 }}>
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, bgcolor: 'rgba(255,255,255,0.15)' }} />

            <Tooltip title="Сбросить масштаб и центрировать">
              <Button size="small" onClick={resetView}
                sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'none', fontSize: 11, minWidth: 32 }}>
                1:1
              </Button>
            </Tooltip>

            <Tooltip title="Очистить холст для всех">
              <IconButton size="small" onClick={handleClear} sx={{ color: '#ff5252' }}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>

            <Box sx={{ flex: 1 }} />

            {/* Chat & Dice toggles */}
            <Tooltip title="Чат">
              <IconButton size="small" onClick={() => setChatOpen(v => !v)} sx={{
                color: chatOpen ? '#ffd740' : 'rgba(255,255,255,0.75)',
                bgcolor: chatOpen ? 'rgba(255,215,64,0.12)' : 'transparent',
                borderRadius: 1.5,
              }}>
                <Chat fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Кубики">
              <IconButton size="small" onClick={() => setDiceOpen(v => !v)} sx={{
                color: diceOpen ? '#ffd740' : 'rgba(255,255,255,0.75)',
                bgcolor: diceOpen ? 'rgba(255,215,64,0.12)' : 'transparent',
                borderRadius: 1.5,
              }}>
                <Casino fontSize="small" />
              </IconButton>
            </Tooltip>

            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', mx: 1, fontSize: 11 }}>
              колёсико — зум • средняя кнопка — двигать
            </Typography>
            <Button size="small" onClick={() => { localStorage.removeItem('canvas_nickname'); navigate('/login'); }}
              sx={{ color: 'rgba(255,255,255,0.45)', textTransform: 'none', fontSize: 12 }}>
              Выйти
            </Button>
          </Toolbar>
        </AppBar>

        {/* Canvas container */}
        <Box ref={containerRef} sx={{
          flex: 1, overflow: 'hidden', bgcolor: '#909090',
          cursor: cursorMap[tool], position: 'relative',
        }}>
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            draggable={tool === 'pan'}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ display: 'block' }}
          >
            {/* Layer 1: paper */}
            <Layer listening={false}>
              <Rect x={0} y={0} width={canvasSize.w} height={canvasSize.h} fill="#f5f5f5" />
            </Layer>

            {/* Layer 2: background image — 1:1 pixels */}
            {bgImage && (
              <Layer listening={false}>
                <KonvaImage image={bgImage} x={0} y={0} width={canvasSize.w} height={canvasSize.h} />
              </Layer>
            )}

            {/* Layer 3: grid (above background, below images) */}
            {showGrid && (
              <Layer listening={false}>
                {gridLines.v.map((pts, i) => (
                  <Line key={`v${i}`} points={pts} stroke="rgba(0,0,0,0.15)" strokeWidth={1} listening={false} />
                ))}
                {gridLines.h.map((pts, i) => (
                  <Line key={`h${i}`} points={pts} stroke="rgba(0,0,0,0.15)" strokeWidth={1} listening={false} />
                ))}
              </Layer>
            )}

            {/* Layer 4: uploaded images + transformer */}
            <Layer>
              {images.map(img => (
                <KonvaImage
                  key={img.id} id={img.id} image={img.image}
                  x={img.x} y={img.y} width={img.width} height={img.height}
                  draggable={tool === 'select'}
                  onClick={() => tool === 'select' && setSelectedImageId(img.id)}
                  onTap={() => tool === 'select' && setSelectedImageId(img.id)}
                  onDragEnd={e => handleImageDragEnd(img.id, e)}
                  onTransformEnd={e => handleImageTransformEnd(img.id, e)}
                />
              ))}
              <Transformer
                ref={transformerRef}
                keepRatio={false}
                boundBoxFunc={(oldBox, newBox) =>
                  newBox.width < 10 || newBox.height < 10 ? oldBox : newBox
                }
              />
            </Layer>

            {/* Layer 5: permanent drawings */}
            <Layer listening={false}>
              {lines.map(line => (
                <Line
                  key={line.id} points={line.points} stroke={line.color}
                  strokeWidth={line.strokeWidth} tension={0.4}
                  lineCap="round" lineJoin="round"
                  globalCompositeOperation={line.compositeOp} listening={false}
                />
              ))}
            </Layer>

            {/* Layer 6: active drawing stroke — updated imperatively, no React re-renders */}
            <Layer ref={activeDrawLayerRef} listening={false} />
          </Stage>

          {/* ── Chat window ──────────────────────────────────────────────────── */}
          {chatOpen && (
            <Paper elevation={8} sx={{
              position: 'absolute', bottom: 8, right: 8,
              width: 300, height: 420,
              display: 'flex', flexDirection: 'column',
              bgcolor: '#1e1e2e', color: 'white', borderRadius: 2, overflow: 'hidden',
              zIndex: 10,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.75, bgcolor: '#2a2a3e', flexShrink: 0 }}>
                <Chat sx={{ fontSize: 16, color: '#ffd740', mr: 1 }} />
                <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 'bold' }}>Чат</Typography>
                <IconButton size="small" onClick={() => setChatOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)', p: 0.25 }}>
                  <Close sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>

              <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {chatMessages.length === 0 && (
                  <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', mt: 2 }}>
                    Пока никто ничего не написал
                  </Typography>
                )}
                {chatMessages.map(m => (
                  <Box key={m.id}>
                    <Typography component="span" sx={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', mr: 0.5 }}>
                      {formatTime(m.timestamp)}
                    </Typography>
                    <Typography component="span" sx={{
                      fontSize: 12, fontWeight: 'bold', mr: 0.5,
                      color: m.msg_type === 'dice' ? '#ffd740' : '#69b4ff',
                    }}>
                      {m.user}:
                    </Typography>
                    <Typography component="span" sx={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', wordBreak: 'break-word' }}>
                      {m.msg_type === 'dice' ? '🎲 ' : ''}{m.text}
                    </Typography>
                  </Box>
                ))}
                <div ref={chatBottomRef} />
              </Box>

              <Box sx={{ display: 'flex', gap: 0.5, p: 1, bgcolor: '#2a2a3e', flexShrink: 0 }}>
                <TextField
                  size="small" fullWidth
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
                  }}
                  placeholder="Сообщение..."
                  inputProps={{ maxLength: 500 }}
                  sx={{
                    '& .MuiInputBase-input': { color: 'white', fontSize: 12, py: 0.75 },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                    },
                    '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.3)', opacity: 1 },
                  }}
                />
                <IconButton size="small" onClick={sendChatMessage} disabled={!chatInput.trim()}
                  sx={{ color: chatInput.trim() ? '#ffd740' : 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                  <Send sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Paper>
          )}

          {/* ── Dice window ──────────────────────────────────────────────────── */}
          {diceOpen && (
            <Paper elevation={8} sx={{
              position: 'absolute', bottom: 8, right: chatOpen ? 316 : 8,
              width: 260,
              display: 'flex', flexDirection: 'column',
              bgcolor: '#1e1e2e', color: 'white', borderRadius: 2, overflow: 'hidden',
              zIndex: 10,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.75, bgcolor: '#2a2a3e', flexShrink: 0 }}>
                <Casino sx={{ fontSize: 16, color: '#ffd740', mr: 1 }} />
                <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 'bold' }}>Кубики</Typography>
                <IconButton size="small" onClick={() => setDiceOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)', p: 0.25 }}>
                  <Close sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>

              <Box sx={{ px: 1.5, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* Current dice chips */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, minHeight: 32 }}>
                  {diceList.length === 0 ? (
                    <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', alignSelf: 'center' }}>
                      Добавьте кубики ниже
                    </Typography>
                  ) : diceList.map((sides, idx) => (
                    <Chip
                      key={idx}
                      label={`d${sides}`}
                      size="small"
                      onDelete={() => setDiceList(prev => prev.filter((_, i) => i !== idx))}
                      sx={{
                        bgcolor: '#3a3a5e', color: '#ffd740', fontSize: 11,
                        '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
                      }}
                    />
                  ))}
                </Box>

                {/* Add dice row */}
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <Select
                    value={addDiceSides}
                    onChange={e => setAddDiceSides(Number(e.target.value))}
                    size="small"
                    sx={{
                      flex: 1, color: 'white', fontSize: 12,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                      '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.5)' },
                      '& .MuiSelect-select': { py: 0.75 },
                    }}
                    MenuProps={{ PaperProps: { sx: { bgcolor: '#2a2a3e', color: 'white' } } }}
                  >
                    {DICE_SIDES.map(s => (
                      <MenuItem key={s} value={s} sx={{ fontSize: 12, '&:hover': { bgcolor: '#3a3a5e' } }}>
                        d{s}
                      </MenuItem>
                    ))}
                  </Select>
                  <Tooltip title="Добавить кубик">
                    <span>
                      <IconButton size="small"
                        onClick={() => setDiceList(prev => [...prev, addDiceSides])}
                        disabled={diceList.length >= 20}
                        sx={{
                          color: '#69f0ae', bgcolor: 'rgba(105,240,174,0.1)', borderRadius: 1,
                          '&.Mui-disabled': { color: 'rgba(255,255,255,0.2)' },
                        }}>
                        <Add sx={{ fontSize: 18 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>

                {/* Roll button */}
                <Button
                  variant="contained" fullWidth
                  onClick={rollDice}
                  disabled={diceList.length === 0}
                  startIcon={<Casino />}
                  sx={{
                    bgcolor: '#7c4dff', '&:hover': { bgcolor: '#651fff' },
                    '&.Mui-disabled': { bgcolor: 'rgba(124,77,255,0.3)', color: 'rgba(255,255,255,0.3)' },
                    textTransform: 'none', fontSize: 13,
                  }}
                >
                  Бросить{diceLabel}
                </Button>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
