import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, IconButton, InputBase,
  Avatar, Tooltip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import BoltIcon from '@mui/icons-material/Bolt';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LogoutIcon from '@mui/icons-material/Logout';
import AuthPromptDialog from './AuthPromptDialog';

interface NavbarProps {
  onUploadClick?: () => void;
}

function Navbar({ onUploadClick }: NavbarProps) {
  const navigate = useNavigate();
  const token = localStorage.getItem('vj_token');
  const username = localStorage.getItem('vj_username') || '';
  const isLoggedIn = !!token;

  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  const handleUploadClick = () => {
    if (!isLoggedIn) { setAuthPromptOpen(true); return; }
    if (onUploadClick) onUploadClick();
    else navigate('/ushikavamp4');
  };

  const handleLogout = () => {
    localStorage.removeItem('vj_token');
    localStorage.removeItem('vj_username');
    navigate('/ushikavamp4/auth');
  };

  return (
    <>
      <Box sx={{
        display: 'flex', alignItems: 'center', px: 4, py: 1.5,
        bgcolor: '#ffffff', borderBottom: '1px solid #EEECFF',
        flexShrink: 0,
      }}>
        <Box
          onClick={() => navigate('/ushikavamp4')}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 3, flexShrink: 0, cursor: 'pointer' }}
        >
          <Box sx={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PlayArrowIcon sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Typography fontWeight="bold" fontSize={18}>Flow</Typography>
        </Box>

        <Box sx={{
          display: 'flex', alignItems: 'center', flex: 1,
          mx: 4, bgcolor: '#F5F6FF', borderRadius: 3,
          px: 2, py: 0.75, border: '1px solid #E8E6FF',
        }}>
          <SearchIcon sx={{ color: '#aaa', mr: 1, fontSize: 20 }} />
          <InputBase placeholder="Search creators, tags, moods..." sx={{ flex: 1, fontSize: 14 }} />
          <TuneIcon sx={{ color: '#aaa', fontSize: 20 }} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title="Notifications">
            <IconButton size="small">
              <NotificationsNoneIcon sx={{ color: '#555' }} />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<BoltIcon fontSize="small" />}
            onClick={handleUploadClick}
            sx={{
              background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
              borderRadius: 3, textTransform: 'none', fontWeight: 'bold',
              px: 2.5, boxShadow: '0 4px 15px rgba(124,58,237,0.35)',
              '&:hover': { background: 'linear-gradient(135deg, #6D28D9, #2563EB)' },
            }}
          >
            Upload
          </Button>

          {isLoggedIn ? (
            <>
              <Tooltip title={username}>
                <Avatar sx={{
                  width: 36, height: 36,
                  background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
                  fontSize: 14, fontWeight: 'bold', border: '2px solid #E8E6FF',
                }}>
                  {username[0]?.toUpperCase()}
                </Avatar>
              </Tooltip>
              <Tooltip title="Logout">
                <IconButton size="small" onClick={handleLogout} sx={{ color: '#aaa', '&:hover': { color: '#f44' } }}>
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Button
              variant="outlined"
              onClick={() => navigate('/ushikavamp4/auth')}
              sx={{
                borderColor: '#7C3AED', color: '#7C3AED', borderRadius: 3,
                textTransform: 'none', fontWeight: 'bold',
                '&:hover': { bgcolor: '#F5F0FF', borderColor: '#6D28D9' },
              }}
            >
              Log In
            </Button>
          )}
        </Box>
      </Box>

      <AuthPromptDialog open={authPromptOpen} onClose={() => setAuthPromptOpen(false)} />
    </>
  );
}

export default Navbar;
