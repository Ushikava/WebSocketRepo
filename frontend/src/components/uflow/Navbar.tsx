import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, IconButton, InputBase,
  Avatar, Tooltip, Popover, Switch, Divider,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import BoltIcon from '@mui/icons-material/Bolt';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import AuthPromptDialog from './AuthPromptDialog';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Lang } from '../../i18n/LanguageContext';

interface NavbarProps {
  onUploadClick?: () => void;
}

function Navbar({ onUploadClick }: NavbarProps) {
  const navigate = useNavigate();
  const token = localStorage.getItem('vj_token');
  const username = localStorage.getItem('vj_username') || '';
  const isLoggedIn = !!token;

  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);
  const { lang, setLang, t, darkMode, setDarkMode } = useLanguage();

  const handleUploadClick = () => {
    if (!isLoggedIn) { setAuthPromptOpen(true); return; }
    if (onUploadClick) onUploadClick();
    else navigate('/uflow');
  };

  const handleLogout = () => {
    localStorage.removeItem('vj_token');
    localStorage.removeItem('vj_username');
    navigate('/uflow/auth');
  };

  return (
    <>
      <Box sx={{
        display: 'flex', alignItems: 'center', px: 4, py: 1.5,
        bgcolor: 'background.paper',
        borderBottom: 1, borderColor: 'divider',
        flexShrink: 0,
      }}>
        <Box
          onClick={() => navigate('/uflow')}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 3, flexShrink: 0, cursor: 'pointer' }}
        >
          <Box sx={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PlayArrowIcon sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Typography fontWeight="bold" fontSize={18}>UFlow</Typography>
        </Box>

        <Box sx={{
          display: 'flex', alignItems: 'center', flex: 1,
          mx: 4, bgcolor: 'action.hover', borderRadius: 3,
          px: 2, py: 0.75, border: 1, borderColor: 'divider',
        }}>
          <SearchIcon sx={{ color: 'text.disabled', mr: 1, fontSize: 20 }} />
          <InputBase placeholder={t('searchPlaceholder')} sx={{ flex: 1, fontSize: 14 }} />
          <TuneIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title={t('settingsTitle')}>
            <IconButton size="small" onClick={e => setSettingsAnchor(e.currentTarget)} sx={{ color: 'text.secondary' }}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('notifications')}>
            <IconButton size="small" sx={{ color: 'text.secondary' }}>
              <NotificationsNoneIcon sx={{ fontSize: 20 }} />
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
            {t('upload')}
          </Button>

          {isLoggedIn ? (
            <>
              <Tooltip title={username}>
                <Avatar sx={{
                  width: 36, height: 36,
                  background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
                  fontSize: 14, fontWeight: 'bold',
                  border: 2, borderColor: 'divider',
                }}>
                  {username[0]?.toUpperCase()}
                </Avatar>
              </Tooltip>
              <Tooltip title={t('logout')}>
                <IconButton size="small" onClick={handleLogout} sx={{ color: 'text.disabled', '&:hover': { color: '#f44' } }}>
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Button
              variant="outlined"
              onClick={() => navigate('/uflow/auth')}
              sx={{
                borderColor: '#7C3AED', color: '#7C3AED', borderRadius: 3,
                textTransform: 'none', fontWeight: 'bold',
                '&:hover': { bgcolor: 'action.selected', borderColor: '#6D28D9' },
              }}
            >
              {t('logIn')}
            </Button>
          )}

          <Popover
            open={!!settingsAnchor}
            anchorEl={settingsAnchor}
            onClose={() => setSettingsAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { sx: { borderRadius: 3, mt: 1, minWidth: 200, p: 2 } } }}
          >
            <Typography fontSize={11} color="text.secondary" fontWeight="bold" mb={1}>
              {t('languageLabel').toUpperCase()}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              {(['en', 'ru'] as Lang[]).map(l => (
                <Button
                  key={l}
                  variant={lang === l ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setLang(l)}
                  sx={{
                    minWidth: 48, textTransform: 'uppercase', borderRadius: 2,
                    ...(lang === l
                      ? { background: 'linear-gradient(135deg, #7C3AED, #3B82F6)', boxShadow: 'none' }
                      : { borderColor: 'divider', color: '#7C3AED' }),
                  }}
                >
                  {l}
                </Button>
              ))}
            </Box>

            <Divider sx={{ mb: 1.5 }} />

            <Typography fontSize={11} color="text.secondary" fontWeight="bold" mb={0.5}>
              {t('darkModeLabel').toUpperCase()}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Switch
                checked={darkMode}
                onChange={e => setDarkMode(e.target.checked)}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#7C3AED' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#7C3AED' },
                }}
              />
              <Typography fontSize={13} color="text.secondary">
                {darkMode ? '🌙' : '☀️'}
              </Typography>
            </Box>
          </Popover>
        </Box>
      </Box>

      <AuthPromptDialog open={authPromptOpen} onClose={() => setAuthPromptOpen(false)} />
    </>
  );
}

export default Navbar;
