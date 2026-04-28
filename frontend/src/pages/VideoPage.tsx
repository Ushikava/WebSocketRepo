import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import Navbar from '../components/uflow/Navbar';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AuthPromptDialog from '../components/uflow/AuthPromptDialog';
import BottomNav from '../components/uflow/BottomNav';
import VideoPlayer from '../components/uflow/VideoPlayer';
import { authFetch } from '../utils/authFetch';
import ShareIcon from '@mui/icons-material/Share';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { type VideoItem, formatViews } from '../components/uflow/types';

function VideoPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [video, setVideo] = useState<Omit<VideoItem, 'url'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [playerW, setPlayerW] = useState(360);
  const [volume, setVolume] = useState(() => Number(localStorage.getItem('vj_volume') ?? 0));
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
        if (!sessionStorage.getItem(`viewed_${data.slug}`)) {
          sessionStorage.setItem(`viewed_${data.slug}`, '1');
          fetch(`/api/uflow/video/${data.slug}/view`, { method: 'POST' }).catch(() => {});
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const applyVolume = (val: number) => {
    setVolume(val);
    localStorage.setItem('vj_volume', String(val));
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

        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4, pb: 6 }}>
          {loading && <CircularProgress sx={{ color: '#7C3AED', mt: 8 }} />}

          {!loading && notFound && (
            <Typography color="text.secondary" mt={8}>{t('videoNotFound')}</Typography>
          )}

          {!loading && video && (
            <Box>
              <VideoPlayer
                src={`/videos/${video.filename}`}
                isActive={true}
                volume={volume}
                onVolumeChange={applyVolume}
                onSizeChange={(w) => setPlayerW(w)}
              />

              {/* Below video: title/author left, actions right */}
              <Box sx={{
                width: playerW,
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
