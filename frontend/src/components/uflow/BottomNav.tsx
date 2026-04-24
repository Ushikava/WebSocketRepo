import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useLanguage } from '../../i18n/LanguageContext';

const ITEMS = [
  { id: 'for-you',  icon: <HomeIcon />,          labelKey: 'navForYou'   },
  { id: 'trending', icon: <TrendingUpIcon />,     labelKey: 'navTrending' },
  { id: 'random',   icon: <ShuffleIcon />,        labelKey: 'navRandom'   },
  { id: 'my-likes', icon: <FavoriteBorderIcon />, labelKey: 'navMyLikes'  },
] as const;

interface BottomNavProps {
  activeNav: string;
  onNavChange: (id: string) => void;
}

function BottomNav({ activeNav, onNavChange }: BottomNavProps) {
  const { t } = useLanguage();

  return (
    <Paper
      elevation={8}
      sx={{
        display: { xs: 'block', md: 'none' },
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 100,
        borderTop: 1, borderColor: 'divider',
      }}
    >
      <BottomNavigation
        value={activeNav}
        onChange={(_, val) => onNavChange(val)}
        sx={{ bgcolor: 'background.paper' }}
      >
        {ITEMS.map(item => (
          <BottomNavigationAction
            key={item.id}
            value={item.id}
            label={t(item.labelKey)}
            icon={item.icon}
            sx={{
              color: 'text.secondary',
              '&.Mui-selected': { color: 'primary.main' },
              minWidth: 0,
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}

export default BottomNav;
