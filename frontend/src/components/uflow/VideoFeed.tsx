import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, IconButton, Slider } from '@mui/material';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AuthPromptDialog from './AuthPromptDialog';
import { useLanguage } from '../../i18n/LanguageContext';
import ShareIcon from '@mui/icons-material/Share';
import VisibilityIcon from '@mui/icons-material/Visibility';

const MIN_W = 240;
const MIN_H = 180;
const MAX_W = 420;
const MAX_H = 600;

export interface VideoItem {
  id: number;
  slug: string;
  filename: string;
  uploaded_by: string;
  title: string;
  uploaded_at: string;
  views: number;
  likes: number;
  is_liked: boolean;
  url: string;
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface FeedItemProps {
  video: VideoItem;
  isActive: boolean;
  volume: number;
  onVolumeChange: (v: number) => void;
  itemRef: (el: HTMLDivElement | null) => void;
}

function FeedItem({ video, isActive, volume, onVolumeChange, itemRef }: FeedItemProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewCounted = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [videoSize, setVideoSize] = useState({ w: 300, h: 520 });
  const [liked, setLiked] = useState(video.is_liked);
  const [likesCount, setLikesCount] = useState(video.likes);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      v.play().catch(() => {});
      setPlaying(true);
      if (!viewCounted.current && !sessionStorage.getItem(`viewed_${video.slug}`)) {
        viewCounted.current = true;
        sessionStorage.setItem(`viewed_${video.slug}`, '1');
        fetch(`/api/uflow/video/${video.slug}/view`, { method: 'POST' }).catch(() => {});
      }
    } else {
      v.pause();
      setPlaying(false);
    }
  }, [isActive, video.id]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume / 100;
    v.muted = volume === 0;
  }, [volume]);

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

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const handleVolumeChange = (_: Event, value: number | number[]) => {
    onVolumeChange(value as number);
  };

  const toggleMute = () => {
    onVolumeChange(volume === 0 ? 70 : 0);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 2500);
  };

  const handleLike = () => {
    const token = localStorage.getItem('vj_token');
    if (!token) {
      setAuthPromptOpen(true);
      return;
    }
    const optimisticLiked = !liked;
    setLiked(optimisticLiked);
    setLikesCount(c => optimisticLiked ? c + 1 : Math.max(0, c - 1));
    fetch(`/api/uflow/video/${video.slug}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { setLiked(data.is_liked); setLikesCount(data.likes); })
      .catch(() => { setLiked(!optimisticLiked); setLikesCount(c => optimisticLiked ? Math.max(0, c - 1) : c + 1); });
  };

  return (
    <Box
      ref={itemRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 3,
        borderBottom: 1, borderColor: 'divider',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        {/* Glow */}
        <Box sx={{
          position: 'absolute', inset: -20,
          background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.25) 0%, rgba(59,130,246,0.15) 50%, transparent 75%)',
          borderRadius: 4, filter: 'blur(20px)', zIndex: 0,
        }} />

        {/* Player */}
        <Box
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
          <video
            ref={videoRef}
            src={video.url}
            loop playsInline
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
            <IconButton size="small" onClick={togglePlay} sx={{ color: '#fff', p: 0.5 }}>
              {playing ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>

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
        </Box>

        {/* Below-video row: title/author left, actions right */}
        <Box sx={{
          position: 'relative', zIndex: 1,
          width: videoSize.w,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          mt: 1.5, gap: 1,
        }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              fontWeight="bold" fontSize={14} noWrap
              onClick={() => navigate(`/uflow/video/${video.slug}`)}
              sx={{ cursor: 'pointer', '&:hover': { color: '#7C3AED', textDecoration: 'underline' } }}
            >
              {video.title}
            </Typography>
            <Typography fontSize={12} color="text.secondary">@{video.uploaded_by}</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            <VisibilityIcon sx={{ fontSize: 15, color: '#bbb' }} />
            <Typography fontSize={12} color="text.disabled" sx={{ mr: 0.5 }}>
              {formatViews(video.views)}
            </Typography>
            <IconButton size="small" onClick={handleLike} sx={{ color: liked ? '#E91E63' : '#aaa', '&:hover': { color: '#E91E63' } }}>
              {liked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
            </IconButton>
            {likesCount > 0 && (
              <Typography fontSize={12} color="text.disabled" sx={{ mr: 0.5 }}>
                {formatViews(likesCount)}
              </Typography>
            )}
            <IconButton size="small" sx={{ color: '#aaa', '&:hover': { color: '#7C3AED' } }}>
              <ShareIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>
      <AuthPromptDialog open={authPromptOpen} onClose={() => setAuthPromptOpen(false)} />
    </Box>
  );
}

interface VideoFeedProps {
  videos: VideoItem[];
  currentIndex: number;
  scrollTarget: { index: number; token: number } | null;
  onCurrentChange: (index: number) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  onUploadClick: () => void;
  resetKey: number;
}

function VideoFeed({
  videos, currentIndex, scrollTarget, onCurrentChange,
  onLoadMore, hasMore, loading, onUploadClick, resetKey,
}: VideoFeedProps) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const [volume, setVolume] = useState(() => Number(localStorage.getItem('vj_volume') ?? 0));

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    localStorage.setItem('vj_volume', String(val));
  };

  const findMostVisible = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const cTop = container.getBoundingClientRect().top;
    const cBottom = cTop + container.clientHeight;
    let bestIndex = 0;
    let bestPx = -1;
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const visiblePx = Math.max(0, Math.min(r.bottom, cBottom) - Math.max(r.top, cTop));
      if (visiblePx > bestPx) { bestPx = visiblePx; bestIndex = i; }
    });
    onCurrentChange(bestIndex);
  }, [onCurrentChange]);

  const handleScroll = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(findMostVisible);
  }, [findMostVisible]);

  // Scroll to top on tab switch (full reload)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [resetKey]);

  // Scroll to item when VideoList is clicked
  useEffect(() => {
    if (!scrollTarget) return;
    itemRefs.current[scrollTarget.index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [scrollTarget]);

  // Load more when last item becomes visible
  useEffect(() => {
    const lastEl = itemRefs.current[videos.length - 1];
    if (!lastEl || !hasMore) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onLoadMore(); },
      { threshold: 0.4 },
    );
    obs.observe(lastEl);
    return () => obs.disconnect();
  }, [videos.length, hasMore, onLoadMore]);

  if (loading && videos.length === 0) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress sx={{ color: '#7C3AED' }} />
      </Box>
    );
  }

  if (!loading && videos.length === 0) {
    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, bgcolor: 'background.default' }}>
        <VideoLibraryIcon sx={{ fontSize: 64, color: '#ccc' }} />
        <Typography color="text.secondary">{t('noVideosYet')}</Typography>
        <Button variant="contained" onClick={onUploadClick}
          sx={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)', borderRadius: 3, textTransform: 'none' }}
        >
          {t('uploadFirstVideo')}
        </Button>
      </Box>
    );
  }

  return (
    <Box
      ref={scrollRef}
      onScroll={handleScroll}
      sx={{ flex: 1, minHeight: 0, overflowY: 'auto', bgcolor: 'background.default' }}
    >
      {videos.map((v, i) => (
        <FeedItem
          key={v.id}
          video={v}
          isActive={i === currentIndex}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          itemRef={el => { itemRefs.current[i] = el; }}
        />
      ))}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} sx={{ color: '#7C3AED' }} />
        </Box>
      )}
    </Box>
  );
}

export default VideoFeed;
