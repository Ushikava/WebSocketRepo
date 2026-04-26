import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Avatar, Box, CircularProgress, Grid, Card,
  CardActionArea, Typography,
} from '@mui/material';
import Navbar from '../components/uflow/Navbar';
import BottomNav from '../components/uflow/BottomNav';
import { authFetch } from '../utils/authFetch';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { type VideoItem, formatViews } from '../components/uflow/types';

interface UserProfile {
  username: string;
  video_count: number;
  total_views: number;
  total_likes: number;
  avatar_url?: string;
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
        <Box sx={{ position: 'relative', aspectRatio: '9/16', bgcolor: '#0a0a14', overflow: 'hidden' }}>
          <video
            ref={videoRef}
            src={`/videos/${video.filename}`}
            muted
            playsInline
            preload="metadata"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* gradient overlay for bottom stats */}
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

function UFlowProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
        setProfile(profileData);
        setVideos(Array.isArray(videosData) ? videosData : []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  const initials = username ? username.slice(0, 2).toUpperCase() : '??';

  return (
    <>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: { xs: '56px', md: 0 } }}>
        <Navbar />

        <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, pt: 4, pb: 6 }}>
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
              {/* — profile header — */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, gap: 1.5 }}>
                <Avatar
                  src={profile.avatar_url}
                  sx={{
                    width: 88, height: 88, fontSize: 26, fontWeight: 700,
                    background: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)',
                  }}
                >
                  {!profile.avatar_url && initials}
                </Avatar>

                <Typography fontWeight={700} fontSize={20}>@{profile.username}</Typography>

                <Box sx={{ display: 'flex', gap: { xs: 3, sm: 5 }, mt: 0.5 }}>
                  {[
                    { label: t('profileVideos'), value: profile.video_count },
                    { label: t('profileViews'), value: formatViews(profile.total_views) },
                    { label: t('profileLikes'), value: formatViews(profile.total_likes) },
                  ].map(({ label, value }) => (
                    <Box key={label} sx={{ textAlign: 'center' }}>
                      <Typography fontWeight={700} fontSize={16}>{value}</Typography>
                      <Typography fontSize={12} color="text.secondary">{label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* — video wall — */}
              {videos.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" mt={6}>
                  {t('noVideosYet') ?? 'No videos yet'}
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
            </>
          )}
        </Box>
      </Box>

      <BottomNav activeNav="" onNavChange={(id) => navigate(`/uflow/${id}`)} />
    </>
  );
}

export default UFlowProfilePage;
