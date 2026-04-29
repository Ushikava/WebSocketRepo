import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Avatar, Box, CircularProgress, Grid, Card,
  CardActionArea, Typography, IconButton, Tooltip,
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import Navbar from '../components/uflow/Navbar';
import Sidebar from '../components/uflow/Sidebar';
import BottomNav from '../components/uflow/BottomNav';
import VideoFeed from '../components/uflow/VideoFeed';
import { authFetch } from '../utils/authFetch';
import { type VideoItem, formatViews } from '../components/uflow/types';

interface UserProfile {
  username: string;
  video_count: number;
  total_views: number;
  total_likes: number;
  avatar_url?: string;
  banner_url?: string;
}

function VideoCard({ video }: { video: VideoItem }) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  };

  return (
    <Card
      sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <CardActionArea onClick={() => navigate(`/uflow/video/${video.slug}`)}>
        <Box sx={{ position: 'relative', aspectRatio: '16/9', bgcolor: '#0a0a14', overflow: 'hidden' }}>
          <video
            ref={videoRef}
            src={`/videos/${video.filename}`}
            muted
            playsInline
            preload="metadata"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <Box sx={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 45%)',
            pointerEvents: 'none',
          }} />
          <Box sx={{
            position: 'absolute', bottom: 6, left: 8, right: 8,
            display: 'flex', alignItems: 'center', gap: 0.5,
          }}>
            <VisibilityIcon sx={{ fontSize: 12, color: '#ddd' }} />
            <Typography fontSize={11} color="#ddd" sx={{ mr: 0.5 }}>{formatViews(video.views)}</Typography>
            <FavoriteBorderIcon sx={{ fontSize: 12, color: '#ddd' }} />
            <Typography fontSize={11} color="#ddd">{formatViews(video.likes)}</Typography>
          </Box>
        </Box>
        <Box sx={{ px: 1, py: 0.75 }}>
          <Typography fontSize={12} fontWeight={500} noWrap>{video.title}</Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
}

function StatBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <Box sx={{
      textAlign: 'center',
      bgcolor: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
      borderRadius: 2,
      px: 1.5, py: 0.5,
    }}>
      <Typography fontWeight={700} fontSize={15} color="#fff">{value}</Typography>
      <Typography fontSize={11} color="rgba(255,255,255,0.7)">{label}</Typography>
    </Box>
  );
}

function UFlowProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');
  const [feedCurrentIndex, setFeedCurrentIndex] = useState(0);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setNotFound(false);

    Promise.all([
      authFetch(`/api/uflow/user/${username}`),
      authFetch(`/api/uflow/user/${username}/videos`),
    ])
      .then(async ([profileRes, videosRes]) => {
        if (profileRes.status === 404) { setNotFound(true); return; }
        const [profileData, videosData] = await Promise.all([
          profileRes.json(),
          videosRes.json(),
        ]);
        // Use cache-busted URLs from localStorage if available (own profile after upload)
        const bustUrl = (apiUrl: string | null | undefined, key: string) => {
          if (!apiUrl) return apiUrl;
          const stored = localStorage.getItem(key);
          return stored && stored.split('?')[0] === apiUrl ? stored : apiUrl;
        };
        setProfile({
          ...profileData,
          avatar_url: bustUrl(profileData.avatar_url, 'vj_avatar_url'),
          banner_url: bustUrl(profileData.banner_url, 'vj_banner_url'),
        });
        const items: VideoItem[] = Array.isArray(videosData)
          ? videosData.map((v: VideoItem) => ({ ...v, url: `/videos/${v.filename}` }))
          : [];
        setVideos(items);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  const handleDelete = useCallback((id: number) => {
    setVideos(prev => prev.filter(v => v.id !== id));
  }, []);

  const handleSwitchToFeed = useCallback(() => {
    setFeedCurrentIndex(0);
    setViewMode('feed');
  }, []);

  const initials = username ? username.slice(0, 2).toUpperCase() : '??';

  const viewToggle = (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Tooltip title="Grid">
        <IconButton size="small" onClick={() => setViewMode('grid')}
          sx={{ color: viewMode === 'grid' ? '#7C3AED' : 'text.disabled' }}>
          <GridViewIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Feed">
        <IconButton size="small" onClick={handleSwitchToFeed}
          sx={{ color: viewMode === 'feed' ? '#7C3AED' : 'text.disabled' }}>
          <ViewStreamIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <>
      <Box sx={{
        height: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        pb: { xs: '56px', md: 0 },
      }}>
        <Navbar />

        <Box sx={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          px: { xs: 0, md: 3 },
          gap: { xs: 0, md: 3 },
          maxWidth: 1400,
          mx: 'auto',
          width: '100%',
        }}>
          <Sidebar activeNav="" onNavChange={(id) => navigate(`/uflow/${id}`)} />

          {/* ── Grid mode ── */}
          {viewMode === 'grid' && (
            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                  <CircularProgress sx={{ color: '#7C3AED' }} />
                </Box>
              )}
              {!loading && notFound && (
                <Typography color="text.secondary" textAlign="center" mt={10}>
                  {t('userNotFound')}
                </Typography>
              )}
              {!loading && profile && (
                <>
                  {/* Banner */}
                  <Box sx={{
                    position: 'relative',
                    height: 180,
                    background: profile.banner_url
                      ? `url(${profile.banner_url}) center/cover no-repeat`
                      : 'linear-gradient(135deg, #1a0533 0%, #0d1b4b 50%, #0a1428 100%)',
                    borderRadius: { md: '12px 12px 0 0' },
                    overflow: 'hidden',
                  }}>
                    <Box sx={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.45) 100%)',
                    }} />
                    {/* Stats — bottom right of banner */}
                    <Box sx={{
                      position: 'absolute', bottom: 12, right: 16,
                      display: 'flex', gap: 1,
                    }}>
                      <StatBadge label={t('profileVideos')} value={profile.video_count} />
                      <StatBadge label={t('profileViews')} value={formatViews(profile.total_views)} />
                      <StatBadge label={t('profileLikes')} value={formatViews(profile.total_likes)} />
                    </Box>
                  </Box>

                  {/* Avatar + name row — avatar overlaps the banner by 44px */}
                  <Box sx={{
                    display: 'flex', alignItems: 'flex-end', gap: 2,
                    px: 3, mt: '-44px', mb: 2,
                  }}>
                    <Avatar
                      src={profile.avatar_url}
                      sx={{
                        width: 88, height: 88, fontSize: 26, fontWeight: 700,
                        background: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)',
                        border: '4px solid',
                        borderColor: 'background.default',
                        flexShrink: 0,
                      }}
                    >
                      {!profile.avatar_url && initials}
                    </Avatar>
                    <Typography fontWeight={700} fontSize={18} sx={{ mb: 0.75 }}>
                      @{profile.username}
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <Box sx={{ mb: 0.5 }}>{viewToggle}</Box>
                  </Box>

                  {/* Video grid */}
                  <Box sx={{ px: { xs: 1, md: 2 }, pb: 4 }}>
                    {videos.length === 0 ? (
                      <Typography color="text.secondary" textAlign="center" mt={6}>
                        {t('noVideosYet')}
                      </Typography>
                    ) : (
                      <Grid container spacing={1.5}>
                        {videos.map(video => (
                          <Grid key={video.slug} size={{ xs: 6, sm: 4, md: 3 }}>
                            <VideoCard video={video} />
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                </>
              )}
            </Box>
          )}

          {/* ── Feed mode ── */}
          {viewMode === 'feed' && (
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              {/* Compact profile strip */}
              {profile && (
                <Box sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  px: 2, py: 1.25, flexShrink: 0,
                  borderBottom: 1, borderColor: 'divider',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      src={profile.avatar_url}
                      sx={{
                        width: 34, height: 34, fontSize: 12, fontWeight: 700,
                        background: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)',
                      }}
                    >
                      {!profile.avatar_url && initials}
                    </Avatar>
                    <Typography fontWeight={700} fontSize={14}>@{profile.username}</Typography>
                  </Box>
                  {viewToggle}
                </Box>
              )}
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                  <CircularProgress sx={{ color: '#7C3AED' }} />
                </Box>
              )}
              {!loading && (
                <VideoFeed
                  videos={videos}
                  currentIndex={feedCurrentIndex}
                  onCurrentChange={setFeedCurrentIndex}
                  onLoadMore={() => {}}
                  hasMore={false}
                  loading={false}
                  onUploadClick={() => {}}
                  resetKey={0}
                  onDelete={handleDelete}
                />
              )}
            </Box>
          )}

          {/* Right spacer — mirrors UFlowPage layout */}
          <Box sx={{ width: 220, flexShrink: 0, display: { xs: 'none', md: 'block' } }} />
        </Box>
      </Box>

      <BottomNav activeNav="" onNavChange={(id) => navigate(`/uflow/${id}`)} />
    </>
  );
}

export default UFlowProfilePage;
