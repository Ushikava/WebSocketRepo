import { Box, Typography, Button, CircularProgress } from '@mui/material';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import { useLanguage } from '../../i18n/LanguageContext';
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
  const { t } = useLanguage();

  return (
    <Box sx={{
      width: 260, bgcolor: 'background.paper', borderRadius: 3,
      p: 2, boxShadow: '0 2px 12px rgba(124,58,237,0.07)',
      display: 'flex', flexDirection: 'column', maxHeight: 620,
    }}>
      <Typography fontWeight="bold" fontSize={15} mb={2}>{t('navForYou')}</Typography>

      <Box sx={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {videos.length === 0 && !loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 1 }}>
            <VideoLibraryIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
            <Typography fontSize={12} color="text.disabled">{t('noVideosYet')}</Typography>
          </Box>
        )}

        {videos.map((v, i) => (
          <Box
            key={v.id}
            onClick={() => onSelect(i)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              p: 1, borderRadius: 2, cursor: 'pointer',
              bgcolor: i === currentIndex ? 'action.selected' : 'transparent',
              border: 1,
              borderColor: i === currentIndex ? 'primary.light' : 'transparent',
              transition: 'all 0.15s',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Box sx={{
              width: 48, height: 36, borderRadius: 1.5, flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(59,130,246,0.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 1, borderColor: 'divider',
            }}>
              <VideoLibraryIcon sx={{ fontSize: 18, color: '#C4B5FD' }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography fontSize={13} fontWeight={i === currentIndex ? 'bold' : 'normal'}
                noWrap color="text.primary">
                {v.title}
              </Typography>
              <Typography fontSize={11} color="text.secondary" noWrap>@{v.uploaded_by}</Typography>
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
            sx={{ mt: 1, textTransform: 'none', color: '#7C3AED', fontSize: 12, alignSelf: 'center' }}
          >
            {t('loadMore')}
          </Button>
        )}
      </Box>
    </Box>
  );
}

export default VideoList;
