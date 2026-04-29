import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import Navbar from '../components/uflow/Navbar';
import { authFetch } from '../utils/authFetch';
import Sidebar from '../components/uflow/Sidebar';
import VideoFeed from '../components/uflow/VideoFeed';
import UploadDialog from '../components/uflow/UploadDialog';
import BottomNav from '../components/uflow/BottomNav';
import type { VideoItem } from '../components/uflow/types';

const LIMIT = 15;

function UFlowPage() {
  const { tab = 'for-you' } = useParams<{ tab: string }>();
  const navigate = useNavigate();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [feedResetKey, setFeedResetKey] = useState(0);

  const fetchFromUrl = useCallback(async (url: string, fetchOffset: number, append: boolean) => {
    setLoadingVideos(true);
    if (!append) {
      setVideos([]);
      setCurrentIndex(0);
      setFeedResetKey(k => k + 1);
    }
    try {
      const res = await authFetch(`${url}?offset=${fetchOffset}&limit=${LIMIT}`);
      const data: Omit<VideoItem, 'url'>[] = await res.json();
      const mapped: VideoItem[] = data.map(v => ({ ...v, url: `/videos/${v.filename}` }));
      if (append) {
        setVideos(prev => [...prev, ...mapped]);
      } else {
        setVideos(mapped);
      }
      setHasMore(data.length === LIMIT);
      setOffset(fetchOffset + data.length);
    } finally {
      setLoadingVideos(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'my-likes') {
      fetchFromUrl('/api/uflow/likes', 0, false);
    } else if (tab === 'history') {
      setLoadingVideos(true);
      setVideos([]);
      setCurrentIndex(0);
      setFeedResetKey(k => k + 1);
      authFetch('/api/uflow/videos/history')
        .then(r => r.json())
        .then((data: Omit<VideoItem, 'url'>[]) => {
          setVideos(data.map(v => ({ ...v, url: `/videos/${v.filename}` })));
          setHasMore(false);
          setOffset(0);
        })
        .finally(() => setLoadingVideos(false));
    } else {
      fetchFromUrl('/api/uflow/videos', 0, false);
    }
  }, [tab, fetchFromUrl]);

  const handleNavChange = (label: string) => {
    navigate(`/uflow/${label}`);
  };

  const handleLoadMore = useCallback(() => {
    if (loadingVideos || !hasMore) return;
    const url = tab === 'my-likes' ? '/api/uflow/likes' : '/api/uflow/videos';
    fetchFromUrl(url, offset, true);
  }, [loadingVideos, hasMore, fetchFromUrl, offset, tab]);

  if (tab === 'my-likes' && !localStorage.getItem('vj_token')) {
    return <Navigate to="/uflow/auth" replace />;
  }

  return (
    <Box sx={{ height: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', overflow: 'hidden', pb: { xs: '56px', md: 0 } }}>

      <Navbar onUploadClick={() => setUploadOpen(true)} />

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, px: { xs: 1, md: 3 }, gap: { xs: 1, md: 3 }, maxWidth: 1400, mx: 'auto', width: '100%' }}>
        <Sidebar activeNav={tab} onNavChange={handleNavChange} />

        <VideoFeed
          videos={videos}
          currentIndex={currentIndex}
          onCurrentChange={setCurrentIndex}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          loading={loadingVideos}
          onUploadClick={() => setUploadOpen(true)}
          resetKey={feedResetKey}
          onDelete={(id) => setVideos(prev => prev.filter(v => v.id !== id))}
        />

        <Box sx={{ width: 220, flexShrink: 0, display: { xs: 'none', md: 'block' } }} />
      </Box>

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => navigate(`/uflow/${tab}`)}
      />

      <BottomNav activeNav={tab} onNavChange={handleNavChange} />
    </Box>
  );
}

export default UFlowPage;
