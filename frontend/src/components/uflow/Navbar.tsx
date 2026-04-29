import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, IconButton, InputBase,
  Avatar, Tooltip, Popover, Switch, Divider, Menu, MenuItem, ListItemIcon, ListItemText,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import BoltIcon from '@mui/icons-material/Bolt';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
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
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('vj_avatar_url') || '');
  const { lang, setLang, t, darkMode, setDarkMode } = useLanguage();

  useEffect(() => {
    if (!isLoggedIn || !username) return;
    fetch(`/api/uflow/user/${username}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const raw = data?.avatar_url ?? '';
        if (raw) {
          // Keep existing cache-busted URL from localStorage if it points to the same file
          const stored = localStorage.getItem('vj_avatar_url') ?? '';
          const storedBase = stored.split('?')[0];
          const finalUrl = storedBase === raw ? stored : `${raw}?t=${Date.now()}`;
          setAvatarUrl(finalUrl);
          localStorage.setItem('vj_avatar_url', finalUrl);
        } else {
          setAvatarUrl('');
          localStorage.removeItem('vj_avatar_url');
        }
      })
      .catch(() => {});
  }, [isLoggedIn, username]);

  const handleUploadClick = () => {
    if (!isLoggedIn) { setAuthPromptOpen(true); return; }
    if (onUploadClick) onUploadClick();
    else navigate('/uflow');
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('vj_refresh_token');
    if (refreshToken) {
      fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => {});
    }
    localStorage.removeItem('vj_token');
    localStorage.removeItem('vj_refresh_token');
    localStorage.removeItem('vj_username');
    localStorage.removeItem('vj_avatar_url');
    localStorage.removeItem('vj_banner_url');
    navigate('/uflow/auth');
  };

  const handleProfilePage = () => {
    const username = localStorage.getItem('vj_username');
    if (username) navigate(`/uflow/user/${username}`);
  };

  return (
    <>
      <Box sx={{
        display: 'flex', alignItems: 'center',
        px: { xs: 2, md: 4 }, py: 1.5,
        bgcolor: 'background.paper',
        borderBottom: 1, borderColor: 'divider',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <Box
          onClick={() => navigate('/uflow')}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: { xs: 1, md: 3 }, flexShrink: 0, cursor: 'pointer' }}
        >
          <Box component="img" src="/logo.png" alt="UFlow" sx={{ height: 32, width: 'auto' }} />
          <Typography fontWeight="bold" fontSize={18} sx={{ display: { xs: 'none', sm: 'block' } }}>
            UFlow
          </Typography>
        </Box>

        {/* Search — hidden on mobile, fixed vw width */}
        <Box sx={{
          display: { xs: 'none', md: 'flex' }, alignItems: 'center',
          width: '25vw', maxWidth: 360, minWidth: 180,
          ml: 3, bgcolor: 'action.hover', borderRadius: 3,
          px: 2, py: 0.75, border: 1, borderColor: 'divider', flexShrink: 0,
        }}>
          <SearchIcon sx={{ color: 'text.disabled', mr: 1, fontSize: 20 }} />
          <InputBase placeholder={t('searchPlaceholder')} sx={{ flex: 1, fontSize: 14 }} />
          <TuneIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
        </Box>

        {/* Spacer — absorbs remaining space, invisible */}
        <Box sx={{ flex: 1 }} />

        {/* Search icon on mobile */}
        <IconButton
          size="small"
          onClick={() => setMobileSearchOpen(o => !o)}
          sx={{ display: { xs: 'flex', md: 'none' }, color: 'text.secondary', mr: 0.5 }}
        >
          <SearchIcon fontSize="small" />
        </IconButton>

        {/* Right controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 }, flexShrink: 0 }}>
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

          {/* Upload: full button on desktop, icon-only on mobile */}
          <Button
            variant="contained"
            size="small"
            onClick={handleUploadClick}
            startIcon={<BoltIcon sx={{ fontSize: 16 }} />}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
              borderRadius: 3, textTransform: 'none', fontWeight: 'bold',
              px: 2, py: 1, width: 132, boxShadow: '0 4px 15px rgba(124,58,237,0.35)',
              '&:hover': { background: 'linear-gradient(135deg, #6D28D9, #2563EB)' },
            }}
          >
            {t('upload')}
          </Button>
          <IconButton
            onClick={handleUploadClick}
            sx={{
              display: { xs: 'flex', sm: 'none' },
              background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
              color: '#fff', borderRadius: 2,
              '&:hover': { background: 'linear-gradient(135deg, #6D28D9, #2563EB)' },
            }}
          >
            <BoltIcon fontSize="small" />
          </IconButton>

          {isLoggedIn ? (
            <>
              <Tooltip title={username}>
                <Avatar
                  src={avatarUrl || undefined}
                  onClick={e => setUserMenuAnchor(e.currentTarget)}
                  sx={{
                    width: 36, height: 36,
                    background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
                    fontSize: 14, fontWeight: 'bold',
                    border: 1, borderColor: 'divider',
                    cursor: 'pointer',
                  }}
                >
                  {!avatarUrl && username[0]?.toUpperCase()}
                </Avatar>
              </Tooltip>

              <Menu
                anchorEl={userMenuAnchor}
                open={!!userMenuAnchor}
                onClose={() => setUserMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                disableAutoFocusItem
                slotProps={{ paper: { sx: { borderRadius: 3, mt: 1, minWidth: 180 } } }}
              >
                <MenuItem onClick={() => { setUserMenuAnchor(null); handleProfilePage(); }}>
                  <ListItemIcon><PersonOutlineIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={t('profile')} slotProps={{ primary: { sx: { fontSize: 14 } } }} />
                </MenuItem>
                <MenuItem onClick={() => setUserMenuAnchor(null)} disabled>
                  <ListItemIcon><VideoLibraryIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={t('myVideos')} slotProps={{ primary: { sx: { fontSize: 14 } } }} />
                </MenuItem>
                <MenuItem onClick={() => { setUserMenuAnchor(null); navigate('/uflow/settings'); }}>
                  <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={t('settings')} slotProps={{ primary: { sx: { fontSize: 14 } } }} />
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { setUserMenuAnchor(null); handleLogout(); }} sx={{ color: '#f44336' }}>
                  <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#f44336' }} /></ListItemIcon>
                  <ListItemText primary={t('logout')} slotProps={{ primary: { sx: { fontSize: 14 } } }} />
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/uflow/auth')}
              sx={{
                borderColor: '#7C3AED', color: '#7C3AED', borderRadius: 3,
                textTransform: 'none', fontWeight: 'bold', px: 2, py: 1, width: 80,
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
            slotProps={{ paper: { sx: { borderRadius: 3, mt: 1, width: 220, p: 2 } } }}
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

      {/* Mobile search row */}
      {mobileSearchOpen && (
        <Box sx={{
          display: { md: 'none' },
          px: 2, pb: 1.5, pt: 0.5,
          bgcolor: 'background.paper',
          borderBottom: 1, borderColor: 'divider',
        }}>
          <Box sx={{
            display: 'flex', alignItems: 'center',
            bgcolor: 'action.hover', borderRadius: 3,
            px: 2, py: 0.75, border: 1, borderColor: 'divider',
          }}>
            <SearchIcon sx={{ color: 'text.disabled', mr: 1, fontSize: 20 }} />
            <InputBase
              placeholder={t('searchPlaceholder')}
              sx={{ flex: 1, fontSize: 14 }}
              autoFocus
            />
          </Box>
        </Box>
      )}

      <AuthPromptDialog open={authPromptOpen} onClose={() => setAuthPromptOpen(false)} />
    </>
  );
}

export default Navbar;
