import { Box, Typography, Button, CircularProgress } from '@mui/material';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import type { VideoItem } from './VideoFeed';

interface VideoListProps {
  videos: VideoItem[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}

function VideoList({ videos, currentIndex, onSelect, onLoadMore, hasMore, loading }: VideoListProps) {
  return (
    <Box sx={{
      width: 260, bgcolor: '#ffffff', borderRadius: 3,
      p: 2, boxShadow: '0 2px 12px rgba(124,58,237,0.07)',
      display: 'flex', flexDirection: 'column', maxHeight: 620,
    }}>
      <Typography fontWeight="bold" fontSize={15} mb={2}>For You</Typography>

      <Box sx={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {videos.length === 0 && !loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 1, color: '#ccc' }}>
            <VideoLibraryIcon sx={{ fontSize: 40 }} />
            <Typography fontSize={12} color="#bbb">No videos yet</Typography>
          </Box>
        )}

        {videos.map((v, i) => (
          <Box
            key={v.id}
            onClick={() => onSelect(i)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              p: 1, borderRadius: 2, cursor: 'pointer',
              bgcolor: i === currentIndex ? '#F0EBFF' : 'transparent',
              border: i === currentIndex ? '1px solid #C4B5FD' : '1px solid transparent',
              transition: 'all 0.15s',
              '&:hover': { bgcolor: i === currentIndex ? '#F0EBFF' : '#F5F6FF' },
            }}
          >
            <Box sx={{
              width: 48, height: 36, borderRadius: 1.5, flexShrink: 0,
              background: 'linear-gradient(135deg, #7C3AED22, #3B82F622)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #E8E6FF',
            }}>
              <VideoLibraryIcon sx={{ fontSize: 18, color: '#C4B5FD' }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography fontSize={13} fontWeight={i === currentIndex ? 'bold' : 'normal'}
                noWrap sx={{ color: '#222' }}>
                {v.title}
              </Typography>
              <Typography fontSize={11} color="#999" noWrap>@{v.uploaded_by}</Typography>
            </Box>
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} sx={{ color: '#7C3AED' }} />
          </Box>
        )}

        {!loading && hasMore && (
          <Button
            onClick={onLoadMore}
            size="small"
            sx={{
              mt: 1, textTransform: 'none', color: '#7C3AED',
              fontSize: 12, alignSelf: 'center',
            }}
          >
            Load more
          </Button>
        )}
      </Box>
    </Box>
  );
}

export default VideoList;
