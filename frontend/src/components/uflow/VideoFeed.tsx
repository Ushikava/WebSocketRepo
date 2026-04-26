import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AuthPromptDialog from './AuthPromptDialog';
import VideoPlayer from './VideoPlayer';
import { useLanguage } from '../../i18n/LanguageContext';
import { authFetch } from '../../utils/authFetch';
import { type VideoItem, formatViews } from './types';

interface FeedItemProps {
  video: VideoItem;
  isActive: boolean;
  volume: number;
  onVolumeChange: (v: number) => void;
  itemRef: (el: HTMLDivElement | null) => void;
  onActivate: () => void;
  onDelete: (id: number) => void;
  onFullscreenChange: (active: boolean) => void;
}

function FeedItem({ video, isActive, volume, onVolumeChange, itemRef, onActivate, onDelete, onFullscreenChange }: FeedItemProps) {
  const navigate = useNavigate();
  const viewCounted = useRef(false);
  const [playerW, setPlayerW] = useState(300);
  const [liked, setLiked] = useState(video.is_liked);
  const [likesCount, setLikesCount] = useState(video.likes);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const isAuthor = localStorage.getItem('vj_username') === video.uploaded_by;
  const { t } = useLanguage();

  useEffect(() => {
    if (isActive && !viewCounted.current && !sessionStorage.getItem(`viewed_${video.slug}`)) {
      viewCounted.current = true;
      sessionStorage.setItem(`viewed_${video.slug}`, '1');
      fetch(`/api/uflow/video/${video.slug}/view`, { method: 'POST' }).catch(() => {});
    }
  }, [isActive, video.id]);

  const handleDelete = () => {
    setMenuAnchor(null);
    authFetch(`/api/uflow/video/${video.slug}`, { method: 'DELETE' })
      .then(r => { if (r.ok) onDelete(video.id); })
      .catch(() => {});
  };

  const handleLike = () => {
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
    <Box
      ref={itemRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: { xs: 1.5, md: 3 },
        px: { xs: 1, md: 0 },
        borderBottom: 1, borderColor: 'divider',
      }}
    >
      <VideoPlayer
        src={video.url}
        isActive={isActive}
        volume={volume}
        onVolumeChange={onVolumeChange}
        onFullscreenChange={onFullscreenChange}
        onActivate={onActivate}
        onSizeChange={(w) => setPlayerW(w)}
      />

      {/* Below-video row: title/author left, actions right */}
      <Box sx={{
        width: playerW,
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
          {isAuthor && (
            <>
              <IconButton size="small" onClick={e => setMenuAnchor(e.currentTarget)} sx={{ color: '#aaa', '&:hover': { color: 'text.primary' } }}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={!!menuAnchor}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 150 } } }}
              >
                <MenuItem onClick={handleDelete} sx={{ color: '#f44336' }}>
                  <ListItemIcon><DeleteOutlineIcon fontSize="small" sx={{ color: '#f44336' }} /></ListItemIcon>
                  <ListItemText primary={t('deleteVideo')} primaryTypographyProps={{ fontSize: 14 }} />
                </MenuItem>
              </Menu>
            </>
          )}
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
  onDelete: (id: number) => void;
}

function VideoFeed({
  videos, currentIndex, scrollTarget, onCurrentChange,
  onLoadMore, hasMore, loading, onUploadClick, resetKey, onDelete,
}: VideoFeedProps) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const fullscreenActiveRef = useRef(false);
  const [volume, setVolume] = useState(() => Number(localStorage.getItem('vj_volume') ?? 0));

  const handleFullscreenChange = useCallback((active: boolean) => {
    fullscreenActiveRef.current = active;
  }, []);

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
    if (fullscreenActiveRef.current) return;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(findMostVisible);
  }, [findMostVisible]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [resetKey]);

  useEffect(() => {
    if (!scrollTarget) return;
    itemRefs.current[scrollTarget.index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [scrollTarget]);

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
      sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', bgcolor: 'background.default' }}
    >
      {videos.map((v, i) => (
        <FeedItem
          key={v.id}
          video={v}
          isActive={i === currentIndex}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          itemRef={el => { itemRefs.current[i] = el; }}
          onActivate={() => onCurrentChange(i)}
          onDelete={onDelete}
          onFullscreenChange={handleFullscreenChange}
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
