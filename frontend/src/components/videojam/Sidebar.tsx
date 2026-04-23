import { Box, Typography, Chip, Divider } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import HistoryIcon from '@mui/icons-material/History';

const NAV_ITEMS = [
  { icon: <HomeIcon fontSize="small" />, label: 'For You' },
  { icon: <TrendingUpIcon fontSize="small" />, label: 'Trending' },
  { icon: <PersonOutlineIcon fontSize="small" />, label: 'Following' },
  { icon: <ShuffleIcon fontSize="small" />, label: 'Random' },
];

const NAV_ITEMS2 = [
  { icon: <FavoriteBorderIcon fontSize="small" />, label: 'My Likes' },
  { icon: <HistoryIcon fontSize="small" />, label: 'History' },
];

const TAGS = ['Tech', 'Urban', 'Sports', 'Music', 'Edit'];

interface SidebarProps {
  activeNav: string;
  onNavChange: (label: string) => void;
}

function Sidebar({ activeNav, onNavChange }: SidebarProps) {
  return (
    <Box sx={{
      width: 220, flexShrink: 0,
      bgcolor: '#ffffff', borderRadius: 3,
      p: 2.5, boxShadow: '0 2px 12px rgba(124,58,237,0.07)',
      height: 'fit-content', position: 'sticky', top: 80,
    }}>
      {NAV_ITEMS.map(item => (
        <Box
          key={item.label}
          onClick={() => onNavChange(item.label)}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 1.5, py: 1, borderRadius: 2, mb: 0.5, cursor: 'pointer',
            bgcolor: activeNav === item.label ? '#F3F0FF' : 'transparent',
            color: activeNav === item.label ? '#7C3AED' : '#444',
            '&:hover': { bgcolor: '#F8F6FF' },
            transition: 'all 0.15s',
          }}
        >
          {item.icon}
          <Typography fontSize={14} fontWeight={activeNav === item.label ? 'bold' : 'normal'}>
            {item.label}
          </Typography>
        </Box>
      ))}

      <Divider sx={{ my: 1.5 }} />

      {NAV_ITEMS2.map(item => (
        <Box
          key={item.label}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 1.5, py: 1, borderRadius: 2, mb: 0.5, cursor: 'pointer',
            color: '#444',
            '&:hover': { bgcolor: '#F8F6FF' },
            transition: 'all 0.15s',
          }}
        >
          {item.icon}
          <Typography fontSize={14}>{item.label}</Typography>
        </Box>
      ))}

      <Divider sx={{ my: 1.5 }} />

      <Typography fontSize={12} color="#999" fontWeight="bold" sx={{ mb: 1, px: 1 }}>
        Explore
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, px: 0.5 }}>
        {TAGS.map(tag => (
          <Chip
            key={tag} label={tag} size="small" variant="outlined"
            sx={{
              borderColor: '#E0DBFF', color: '#7C3AED', fontSize: 12,
              cursor: 'pointer', '&:hover': { bgcolor: '#F3F0FF' },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

export default Sidebar;
