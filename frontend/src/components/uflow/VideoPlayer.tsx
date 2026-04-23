import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Typography, Button, CircularProgress, IconButton, Slider } from '@mui/material';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

const MIN_W = 240;
const MIN_H = 180;
const MAX_W = 420;
const MAX_H = 600;

export interface VideoItem {
  id: number;
  filename: string;
  uploaded_by: string;
  title: string;
  uploaded_at: string;
  url: string;
}

interface VideoPlayerProps {
  video: VideoItem | null;
  loading: boolean;
  onUploadClick: () => void;
}

function VideoPlayer({ video, loading, onUploadClick }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [videoSize, setVideoSize] = useState({ w: 300, h: 520 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPlaying(true);
  }, [video?.id]);

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;

    const ratio = v.videoWidth / v.videoHeight;
    let w = v.videoWidth;
    let h = v.videoHeight;
    if (w > MAX_W) { w = MAX_W; h = w / ratio; }
    if (h > MAX_H) { h = MAX_H; w = h * ratio; }
    if (w < MIN_W) { w = MIN_W; h = w / ratio; }
    if (h < MIN_H) { h = MIN_H; w = h * ratio; }
    setVideoSize({ w: Math.round(w), h: Math.round(h) });
  };

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  }, []);

  const handleVolumeChange = (_: Event, value: number | number[]) => {
    const v = videoRef.current;
    if (!v) return;
    const vol = (value as number) / 100;
    v.volume = vol;
    v.muted = vol === 0;
    setVolume(value as number);
  };

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.muted || v.volume === 0) {
      v.muted = false;
      v.volume = 0.7;
      setVolume(70);
    } else {
      v.muted = true;
      setVolume(0);
    }
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 2500);
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2, gap: 1.5 }}>
      {video && (
        <Box sx={{ textAlign: 'center' }}>
          <Typography fontWeight="bold" fontSize={15} noWrap sx={{ maxWidth: 420 }}>{video.title}</Typography>
          <Typography fontSize={12} color="#888">@{video.uploaded_by}</Typography>
        </Box>
      )}

      <Box sx={{ position: 'relative' }}>
        {/* Glow */}
        <Box sx={{
          position: 'absolute', inset: -20,
          background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.25) 0%, rgba(59,130,246,0.15) 50%, transparent 75%)',
          borderRadius: 4, filter: 'blur(20px)', zIndex: 0,
        }} />

        <Box
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setShowControls(false)}
          sx={{
            position: 'relative', zIndex: 1,
            width: videoSize.w, height: videoSize.h,
            bgcolor: '#111', borderRadius: '16px',
            border: '2px solid #333', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            transition: 'width 0.3s, height 0.3s',
          }}
        >
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <CircularProgress sx={{ color: '#7C3AED' }} />
            </Box>
          )}

          {!loading && !video && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
              <VideoLibraryIcon sx={{ fontSize: 60, color: '#333' }} />
              <Typography sx={{ color: '#555', fontSize: 13, textAlign: 'center', px: 3 }}>
                No videos yet
              </Typography>
              <Button size="small" variant="contained" onClick={onUploadClick}
                sx={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)', borderRadius: 3, textTransform: 'none', fontSize: 12 }}
              >
                Upload first
              </Button>
            </Box>
          )}

          {!loading && video && (
            <>
              <video
                ref={videoRef}
                src={video.url}
                autoPlay loop muted playsInline
                onLoadedMetadata={handleLoadedMetadata}
                onClick={togglePlay}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />

              {/* Controls overlay */}
              <Box sx={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                px: 1.5, pt: 4, pb: 1.5,
                opacity: showControls ? 1 : 0,
                transition: 'opacity 0.25s',
                pointerEvents: showControls ? 'auto' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                {/* Left: play/pause */}
                <IconButton size="small" onClick={togglePlay} sx={{ color: '#fff', p: 0.5 }}>
                  {playing ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>

                {/* Right: volume */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton size="small" onClick={toggleMute} sx={{ color: '#fff', p: 0.5 }}>
                    {volume === 0 ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                  </IconButton>
                  <Slider
                    value={volume}
                    onChange={handleVolumeChange}
                    size="small"
                    sx={{
                      width: 70, color: '#fff', p: 0,
                      '& .MuiSlider-thumb': { width: 10, height: 10, bgcolor: '#fff' },
                      '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.3)' },
                      '& .MuiSlider-track': { bgcolor: '#fff', borderColor: '#fff' },
                    }}
                  />
                </Box>
              </Box>

              {/* Center play flash */}
              {!playing && (
                <Box sx={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none',
                }}>
                  <Box sx={{
                    bgcolor: 'rgba(0,0,0,0.5)', borderRadius: '50%',
                    width: 56, height: 56,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <PlayArrowIcon sx={{ color: '#fff', fontSize: 32 }} />
                  </Box>
                </Box>
              )}


            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default VideoPlayer;
