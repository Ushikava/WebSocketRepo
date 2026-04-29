import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, IconButton, Slider } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

const MAX_W = 640;
const MAX_H = 480;

interface VideoPlayerProps {
  src: string;
  isActive: boolean;
  volume: number;
  onVolumeChange: (v: number) => void;
  onFullscreenChange?: (active: boolean) => void;
  onActivate?: () => void;
  onSizeChange?: (w: number) => void;
}

function VideoPlayer({
  src,
  isActive,
  volume,
  onVolumeChange,
  onFullscreenChange,
  onActivate,
  onSizeChange,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevVolumeRef = useRef(volume || 50);
  const savedScrollRef = useRef<{ el: Element; top: number }[]>([]);
  const isFullscreenRef = useRef(false);

  const [videoSize, setVideoSize] = useState({ w: MAX_W, h: Math.round(MAX_W * 9 / 16) });
  const [showControls, setShowControls] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) { v.play().catch(() => {}); }
    else { v.pause(); }
  }, [isActive]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume / 100;
    v.muted = volume === 0;
  }, [volume]);

  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const { videoWidth: vw, videoHeight: vh } = v;
    let w: number, h: number;
    if (MAX_W * vh / vw <= MAX_H) {
      w = MAX_W;
      h = Math.round(MAX_W * vh / vw);
    } else {
      h = MAX_H;
      w = Math.round(MAX_H * vw / vh);
    }
    setVideoSize({ w, h });
    onSizeChange?.(MAX_W);
  }, [onSizeChange]);

  const handleClick = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!isActive && !isFullscreenRef.current) { onActivate?.(); return; }
    if (v.paused) { v.play(); } else { v.pause(); }
  }, [isActive, onActivate]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setShowControls(false);
      setShowVolume(false);
    }, 2500);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowControls(false);
    setShowVolume(false);
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  useEffect(() => {
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  const toggleMute = useCallback(() => {
    if (volume === 0) {
      onVolumeChange(prevVolumeRef.current);
    } else {
      prevVolumeRef.current = volume;
      onVolumeChange(0);
    }
  }, [volume, onVolumeChange]);

  const handleVolumeSlider = useCallback((_: Event, value: number | number[]) => {
    onVolumeChange(value as number);
  }, [onVolumeChange]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      const positions: { el: Element; top: number }[] = [];
      let p: Element | null = el.parentElement;
      while (p) {
        if (p.scrollTop > 0) positions.push({ el: p, top: p.scrollTop });
        p = p.parentElement;
      }
      if (window.scrollY > 0) positions.push({ el: document.documentElement, top: window.scrollY });
      savedScrollRef.current = positions;
      onFullscreenChange?.(true);
      el.requestFullscreen();
    }
  }, [onFullscreenChange]);

  useEffect(() => {
    const onChange = () => {
      const active = document.fullscreenElement === containerRef.current;
      const wasFullscreen = isFullscreenRef.current;
      isFullscreenRef.current = active;
      setIsFullscreen(active);

      if (!active && wasFullscreen) {
        const el = containerRef.current;
        if (el) {
          el.style.transition = 'none';
          requestAnimationFrame(() => requestAnimationFrame(() => {
            if (containerRef.current) containerRef.current.style.transition = '';
          }));
        }
        
        savedScrollRef.current.forEach(({ el: scrollEl, top }) => {
          if (scrollEl === document.documentElement) window.scrollTo(0, top);
          else scrollEl.scrollTop = top;
        });
        onFullscreenChange?.(false);
      }
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [onFullscreenChange]);

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Glow */}
      <Box sx={{
        position: 'absolute', inset: -20,
        background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.25) 0%, rgba(59,130,246,0.15) 50%, transparent 75%)',
        borderRadius: 4, filter: 'blur(20px)', zIndex: 0,
      }} />

      {/* Outer player frame */}
      <Box
        ref={containerRef}
        sx={{
          position: 'relative', zIndex: 1,
          width: MAX_W, height: videoSize.h,
          bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0B0B14' : '#E8E9F5',
          borderRadius: '16px',
          border: '2px solid #333', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          '&:fullscreen, &:-webkit-full-screen': {
            width: '100vw', height: '100vh',
            borderRadius: 0, border: 'none', transition: 'none',
          },
        }}
      >
        {/* Inner video zone */}
        <Box
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          sx={{
            position: 'relative', flexShrink: 0,
            width: isFullscreen ? '100%' : videoSize.w,
            height: isFullscreen ? '100%' : videoSize.h,
            cursor: 'pointer',
          }}
        >
          <video
            ref={videoRef}
            src={src}
            loop playsInline
            onLoadedMetadata={handleLoadedMetadata}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />

          {/* Bottom gradient */}
          <Box sx={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 56,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.45))',
            pointerEvents: 'none',
            opacity: showControls ? 1 : 0,
            transition: 'opacity 0.25s',
          }} />

          {/* Fullscreen button */}
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
            sx={{
              position: 'absolute', bottom: 10, right: 10, zIndex: 2,
              bgcolor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              color: '#fff', p: 0.5,
              borderRadius: 2,
              opacity: showControls ? 1 : 0,
              pointerEvents: showControls ? 'auto' : 'none',
              transition: 'opacity 0.25s',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
            }}
          >
            {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
          </IconButton>

          {/* Volume pill */}
          <Box
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={() => setShowVolume(true)}
            onMouseLeave={() => setShowVolume(false)}
            sx={{
              position: 'absolute', bottom: 10, left: 10, zIndex: 2,
              display: 'flex', alignItems: 'center',
              bgcolor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              borderRadius: 3,
              px: 0.75, py: 0.25,
              overflow: 'hidden',
              opacity: showControls ? 1 : 0,
              pointerEvents: showControls ? 'auto' : 'none',
              transition: 'opacity 0.25s',
            }}
          >
            <IconButton size="small" onClick={toggleMute} sx={{ color: '#fff', p: 0.25, flexShrink: 0 }}>
              {volume === 0 ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
            </IconButton>
            <Box sx={{
              width: showVolume ? 80 : 0,
              opacity: showVolume ? 1 : 0,
              ml: showVolume ? 0.5 : 0,
              pointerEvents: showVolume ? 'auto' : 'none',
              transition: 'width 0.25s ease, opacity 0.2s ease, margin 0.25s ease',
              display: 'flex', alignItems: 'center',
            }}>
              <Slider
                value={volume}
                onChange={handleVolumeSlider}
                //size="small"
                sx={{
                  width: 72, color: '#fff', p: 0, mx: 0.5, flexShrink: 0,
                  '& .MuiSlider-thumb': { display: 'none' },
                  '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.25)', opacity: 1 },
                  '& .MuiSlider-track': { bgcolor: '#fff', borderColor: '#fff', borderRadius: 2 },
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default VideoPlayer;
