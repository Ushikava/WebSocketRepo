import { useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

import Navbar from '../components/videojam/Navbar';
import Sidebar from '../components/videojam/Sidebar';
import VideoFeed from '../components/videojam/VideoFeed';
import VideoList from '../components/videojam/VideoList';
import UploadDialog from '../components/videojam/UploadDialog';
import type { VideoItem } from '../components/videojam/VideoFeed';

const LIMIT = 15;

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#7C3AED' },
    background: { default: '#F5F6FF', paper: '#ffffff' },
  },
  typography: { fontFamily: '"Inter", "Roboto", sans-serif' },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { margin: 0, padding: 0 } },
    },
  },
});

function VideoJamPage() {

  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('For You');

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollTarget, setScrollTarget] = useState<{ index: number; token: number } | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);

  const fetchVideos = useCallback(async (fetchOffset: number, append: boolean) => {
    setLoadingVideos(true);
    try {
      const token = localStorage.getItem('vj_token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/ushikavamp4/videos?offset=${fetchOffset}&limit=${LIMIT}`, { headers });
      const data: Omit<VideoItem, 'url'>[] = await res.json();
      const mapped: VideoItem[] = data.map(v => ({ ...v, url: `/videos/${v.filename}` }));
      if (append) {
        setVideos(prev => [...prev, ...mapped]);
      } else {
        setVideos(mapped);
        setCurrentIndex(0);
      }
      setHasMore(data.length === LIMIT);
      setOffset(fetchOffset + data.length);
    } finally {
      setLoadingVideos(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos(0, false);
  }, [fetchVideos]);

  const handleLoadMore = useCallback(() => {
    if (!loadingVideos && hasMore) fetchVideos(offset, true);
  }, [loadingVideos, hasMore, fetchVideos, offset]);

  const handleListSelect = (index: number) => {
    setScrollTarget({ index, token: Date.now() });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: '100vh', bgcolor: '#F5F6FF', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <Navbar onUploadClick={() => setUploadOpen(true)} />

        {/* Body */}
        <Box sx={{ display: 'flex', flex: 1, minHeight: 0, px: 3, gap: 3, maxWidth: 1400, mx: 'auto', width: '100%' }}>
          <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />

          <VideoFeed
            videos={videos}
            currentIndex={currentIndex}
            scrollTarget={scrollTarget}
            onCurrentChange={setCurrentIndex}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            loading={loadingVideos}
            onUploadClick={() => setUploadOpen(true)}
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
      </Box>

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => fetchVideos(0, false)}
      />
    </ThemeProvider>
  );
}

export default VideoJamPage;
