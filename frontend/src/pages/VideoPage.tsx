import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Box, Typography, IconButton, CircularProgress, Slider } from '@mui/material';
import Navbar from '../components/uflow/Navbar';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AuthPromptDialog from '../components/uflow/AuthPromptDialog';
import BottomNav from '../components/uflow/BottomNav';
import { authFetch } from '../utils/authFetch';
import ShareIcon from '@mui/icons-material/Share';
import VisibilityIcon from '@mui/icons-material/Visibility';

const MIN_W = 240;
const MIN_H = 180;
const MAX_W = 640;
const MAX_H = 780;

interface VideoItem {
  id: number;
  slug: string;
  filename: string;
  uploaded_by: string;
  title: string;
  uploaded_at: string;
  views: number;
  likes: number;
  is_liked: boolean;
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function VideoPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [video, setVideo] = useState<VideoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(() => Number(localStorage.getItem('vj_volume') ?? 0));
  const [showControls, setShowControls] = useState(false);
  const [videoSize, setVideoSize] = useState({ w: 360, h: 600 });
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  useEffect(() => {
    authFetch(`/api/uflow/video/${slug}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        setVideo(data);
        setLiked(data.is_liked);
        setLikesCount(data.likes);
        if (!sessionStorage.getItem(`viewed_${data.id}`)) {
          sessionStorage.setItem(`viewed_${data.slug}`, '1');
          fetch(`/api/uflow/video/${data.slug}/view`, { method: 'POST' }).catch(() => {});
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume / 100;
    v.muted = volume === 0;
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

  const applyVolume = (val: number) => {
    const v = videoRef.current;
    if (v) { v.volume = val / 100; v.muted = val === 0; }
    setVolume(val);
    localStorage.setItem('vj_volume', String(val));
  };

  const handleVolumeChange = (_: Event, value: number | number[]) => applyVolume(value as number);

  const toggleMute = () => applyVolume(volume === 0 ? 70 : 0);

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 2500);
  };

  const handleLike = () => {
    if (!video) return;
    if (!localStorage.getItem('vj_token')) {
      setAuthPromptOpen(true);
      return;
    }
    const optimisticLiked = !liked;
    setLiked(optimisticLiked);
    setLikesCount(c => optimisticLiked ? c + 1 : Math.max(0, c - 1));
    authFetch(`/api/uflow/video/${video.slug}/like`, { method: 'POST' })
      .then(r => r.json())
      .then(data => { setLiked(data.is_liked); setLikesCount(data.likes); })
      .catch(() => { setLiked(!optimisticLiked); setLikesCount(c => optimisticLiked ? Math.max(0, c - 1) : c + 1); });
  };

  return (
    <>
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: { xs: '56px', md: 0 } }}>

        <Navbar />

        {/* Content */}
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4, pb: 6 }}>
          {loading && <CircularProgress sx={{ color: '#7C3AED', mt: 8 }} />}

          {!loading && notFound && (
            <Typography color="text.secondary" mt={8}>{t('videoNotFound')}</Typography>
          )}

          {!loading && video && (
            <Box>
              {/* Player */}
              <Box sx={{ position: 'relative' }}>
                <Box sx={{
                  position: 'absolute', inset: -20,
                  background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.25) 0%, rgba(59,130,246,0.15) 50%, transparent 75%)',
                  borderRadius: 4, filter: 'blur(20px)', zIndex: 0,
                }} />

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
                    src={`/videos/${video.filename}`}
                    autoPlay loop playsInline
                    onLoadedMetadata={handleLoadedMetadata}
                    onClick={togglePlay}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />

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
              </Box>

              {/* Below video: title/author left, actions right */}
              <Box sx={{
                width: videoSize.w,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                mt: 1.5, gap: 1,
              }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight="bold" fontSize={15}>{video.title}</Typography>
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
          )}
        </Box>
      </Box>
      <AuthPromptDialog open={authPromptOpen} onClose={() => setAuthPromptOpen(false)} />
      <BottomNav activeNav="" onNavChange={(id) => navigate(`/uflow/${id}`)} />
    </>
  );
}

export default VideoPage;
