import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, IconButton, Slider } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

const MIN_W = 240;
const MIN_H = 180;

interface VideoPlayerProps {
  src: string;
  isActive: boolean;
  volume: number;
  onVolumeChange: (v: number) => void;
  onFullscreenChange?: (active: boolean) => void;
  onActivate?: () => void;
  onSizeChange?: (w: number, h: number) => void;
  maxW?: number;
  maxH?: number;
}

function VideoPlayer({
  src,
  isActive,
  volume,
  onVolumeChange,
  onFullscreenChange,
  onActivate,
  onSizeChange,
  maxW = 420,
  maxH = 600,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevVolumeRef = useRef(volume || 70);

  const [showControls, setShowControls] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoSize, setVideoSize] = useState({ w: 300, h: 520 });

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive || isFullscreen) { v.play().catch(() => {}); }
    else { v.pause(); }
  }, [isActive, isFullscreen]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume / 100;
    v.muted = volume === 0;
  }, [volume]);

  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const ratio = v.videoWidth / v.videoHeight;
    const effectiveMaxW = Math.min(maxW, window.innerWidth - 32);
    let w = v.videoWidth;
    let h = v.videoHeight;
    if (w > effectiveMaxW) { w = effectiveMaxW; h = w / ratio; }
    if (h > maxH) { h = maxH; w = h * ratio; }
    if (w < MIN_W) { w = MIN_W; h = w / ratio; }
    if (h < MIN_H) { h = MIN_H; w = h * ratio; }
    const fw = Math.round(w);
    const fh = Math.round(h);
    setVideoSize({ w: fw, h: fh });
    onSizeChange?.(fw, fh);
  }, [maxW, maxH, onSizeChange]);

  const handleClick = () => {
    const v = videoRef.current;
    if (!v) return;
    if (!isActive && !isFullscreen) { onActivate?.(); return; }
    if (v.paused) { v.play(); } else { v.pause(); }
  };

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

  const handleVolumeSlider = (_: Event, value: number | number[]) => {
    onVolumeChange(value as number);
  };

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      onFullscreenChange?.(false);
      document.exitFullscreen();
    } else {
      onFullscreenChange?.(true);
      el.requestFullscreen();
    }
  }, [onFullscreenChange]);

  useEffect(() => {
    const onChange = () => {
      const active = document.fullscreenElement === containerRef.current;
      setIsFullscreen(active);
      if (!active) {
        const el = containerRef.current;
        if (el) {
          el.style.transition = 'none';
          requestAnimationFrame(() => requestAnimationFrame(() => {
            if (containerRef.current) containerRef.current.style.transition = '';
          }));
        }
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

      {/* Player */}
      <Box
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        sx={{
          position: 'relative', zIndex: 1,
          width: videoSize.w, height: videoSize.h,
          bgcolor: '#111', borderRadius: '16px',
          border: '2px solid #333', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          transition: 'width 0.3s, height 0.3s',
          '&:fullscreen, &:-webkit-full-screen': {
            width: '100vw',
            height: '100vh',
            borderRadius: 0,
            border: 'none',
            transition: 'none',
          },
        }}
      >
        <video
          ref={videoRef}
          src={src}
          loop playsInline
          onLoadedMetadata={handleLoadedMetadata}
          onClick={handleClick}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />

        {/* Bottom gradient*/}
        <Box sx={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 56,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.45))',
          pointerEvents: 'none',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.25s',
        }} />

        {/* Fullscreen button*/}
        <IconButton
          size="small"
          onClick={toggleFullscreen}
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

        {/* Volume pill*/}
        <Box
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
              size="small"
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
  );
}

export default VideoPlayer;
