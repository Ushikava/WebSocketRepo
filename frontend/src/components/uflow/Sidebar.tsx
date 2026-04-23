import { Box, Typography, Chip, Divider } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import HistoryIcon from '@mui/icons-material/History';
import { useLanguage } from '../../i18n/LanguageContext';
import type { TranslationKeys } from '../../i18n/en';

const NAV_ITEMS: { icon: React.ReactNode; id: string; labelKey: TranslationKeys }[] = [
  { icon: <HomeIcon fontSize="small" />, id: 'for-you', labelKey: 'navForYou' },
  { icon: <TrendingUpIcon fontSize="small" />, id: 'trending', labelKey: 'navTrending' },
  { icon: <PersonOutlineIcon fontSize="small" />, id: 'following', labelKey: 'navFollowing' },
  { icon: <ShuffleIcon fontSize="small" />, id: 'random', labelKey: 'navRandom' },
];

const NAV_ITEMS2: { icon: React.ReactNode; id: string; labelKey: TranslationKeys }[] = [
  { icon: <FavoriteBorderIcon fontSize="small" />, id: 'my-likes', labelKey: 'navMyLikes' },
  { icon: <HistoryIcon fontSize="small" />, id: 'history', labelKey: 'navHistory' },
];

const TAGS = ['Tech', 'Urban', 'Sports', 'Music', 'Edit'];

interface SidebarProps {
  activeNav: string;
  onNavChange: (id: string) => void;
}

function Sidebar({ activeNav, onNavChange }: SidebarProps) {
  const { t } = useLanguage();

  const renderItem = (item: typeof NAV_ITEMS[0]) => (
    <Box
      key={item.id}
      onClick={() => onNavChange(item.id)}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        px: 1.5, py: 1, borderRadius: 2, mb: 0.5, cursor: 'pointer',
        bgcolor: activeNav === item.id ? 'action.selected' : 'transparent',
        color: activeNav === item.id ? 'primary.main' : 'text.primary',
        '&:hover': { bgcolor: activeNav === item.id ? 'action.selected' : 'action.hover' },
        transition: 'all 0.15s',
      }}
    >
      {item.icon}
      <Typography fontSize={14} fontWeight={activeNav === item.id ? 'bold' : 'normal'}>
        {t(item.labelKey)}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{
      width: 220, flexShrink: 0,
      bgcolor: 'background.paper', borderRadius: 3,
      p: 2.5, boxShadow: '0 2px 12px rgba(124,58,237,0.07)',
      height: 'fit-content', position: 'sticky', top: 80,
    }}>
      {NAV_ITEMS.map(renderItem)}

      <Divider sx={{ my: 1.5 }} />

      {NAV_ITEMS2.map(renderItem)}

      <Divider sx={{ my: 1.5 }} />

      <Typography fontSize={12} color="text.secondary" fontWeight="bold" sx={{ mb: 1, px: 1 }}>
        {t('explore')}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, px: 0.5 }}>
        {TAGS.map(tag => (
          <Chip
            key={tag} label={tag} size="small" variant="outlined"
            sx={{
              borderColor: 'divider', color: 'primary.main', fontSize: 12,
              cursor: 'pointer', '&:hover': { bgcolor: 'action.selected' },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

export default Sidebar;
