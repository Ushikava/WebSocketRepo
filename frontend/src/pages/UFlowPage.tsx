import { useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';

import Navbar from '../components/uflow/Navbar';
import Sidebar from '../components/uflow/Sidebar';
import VideoFeed from '../components/uflow/VideoFeed';
import VideoList from '../components/uflow/VideoList';
import UploadDialog from '../components/uflow/UploadDialog';
import type { VideoItem } from '../components/uflow/VideoFeed';

const LIMIT = 15;

function UFlowPage() {

  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('for-you');

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollTarget, setScrollTarget] = useState<{ index: number; token: number } | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [feedResetKey, setFeedResetKey] = useState(0);

  const fetchFromUrl = useCallback(async (url: string, fetchOffset: number, append: boolean) => {
    setLoadingVideos(true);
    try {
      const token = localStorage.getItem('vj_token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${url}?offset=${fetchOffset}&limit=${LIMIT}`, { headers });
      const data: Omit<VideoItem, 'url'>[] = await res.json();
      const mapped: VideoItem[] = data.map(v => ({ ...v, url: `/videos/${v.filename}` }));
      if (append) {
        setVideos(prev => [...prev, ...mapped]);
      } else {
        setVideos(mapped);
        setCurrentIndex(0);
        setFeedResetKey(k => k + 1);
      }
      setHasMore(data.length === LIMIT);
      setOffset(fetchOffset + data.length);
    } finally {
      setLoadingVideos(false);
    }
  }, []);

  const fetchVideos = useCallback((fetchOffset: number, append: boolean) => {
    return fetchFromUrl('/api/uflow/videos', fetchOffset, append);
  }, [fetchFromUrl]);

  const handleNavChange = async (label: string) => {
    setActiveNav(label);

    if (['for-you', 'trending', 'following', 'random'].includes(label)) {
      setOffset(0);
      fetchVideos(0, false);
      return;
    }

    if (label === 'my-likes') {
      fetchFromUrl('/api/uflow/likes', 0, false);
      return;
    }

  if (label === 'history') {
    setLoadingVideos(true);

    try {
      const token = localStorage.getItem("vj_token");
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch("/api/uflow/videos/history", { headers });
      const data: Omit<VideoItem, "url">[] = await res.json();

      const mapped: VideoItem[] = data.map(v => ({
        ...v,
        url: `/videos/${v.filename}`,
      }));

      setVideos(mapped);
      setHasMore(false);
      setOffset(0);
      setCurrentIndex(0);

    } finally {
      setLoadingVideos(false);
    }

    return;
  }
};

  useEffect(() => {
    fetchVideos(0, false);
  }, [fetchVideos]);

  const handleLoadMore = useCallback(() => {
    if (loadingVideos || !hasMore) return;
    const url = activeNav === 'my-likes'
      ? '/api/uflow/likes'
      : '/api/uflow/videos';
    fetchFromUrl(url, offset, true);
  }, [loadingVideos, hasMore, fetchFromUrl, offset, activeNav]);

  const handleListSelect = (index: number) => {
    setScrollTarget({ index, token: Date.now() });
  };

  return (
    <Box sx={{ height: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <Navbar onUploadClick={() => setUploadOpen(true)} />

      {/* Body */}
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, px: 3, gap: 3, maxWidth: 1400, mx: 'auto', width: '100%' }}>
        <Sidebar activeNav={activeNav} onNavChange={handleNavChange} />

        <VideoFeed
          videos={videos}
          currentIndex={currentIndex}
          scrollTarget={scrollTarget}
          onCurrentChange={setCurrentIndex}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          loading={loadingVideos}
          onUploadClick={() => setUploadOpen(true)}
          resetKey={feedResetKey}
        />

        <VideoList
          videos={videos}
          currentIndex={currentIndex}
          onSelect={handleListSelect}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          loading={loadingVideos}
        />
      </Box>

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => fetchVideos(0, false)}
      />
    </Box>
  );
}

export default UFlowPage;
