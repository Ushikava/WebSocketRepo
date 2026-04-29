import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Box, Typography, Paper, TextField, Button,
  Avatar, Alert, CircularProgress, Divider, IconButton,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import Navbar from '../components/uflow/Navbar';
import Sidebar from '../components/uflow/Sidebar';
import BottomNav from '../components/uflow/BottomNav';
import CropDialog from '../components/uflow/CropDialog';
import { authFetch } from '../utils/authFetch';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper sx={{ borderRadius: 3, p: 3, mb: 2.5 }}>
      <Typography fontWeight={700} fontSize={15} mb={2}>{title}</Typography>
      <Divider sx={{ mb: 2.5 }} />
      {children}
    </Paper>
  );
}

function UFlowSettingsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [savedUsername, setSavedUsername] = useState(
    () => localStorage.getItem('vj_username') || '',
  );
  const initials = savedUsername.slice(0, 2).toUpperCase();

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState<'avatar' | 'banner'>('avatar');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [bannerBlob, setBannerBlob] = useState<Blob | null>(null);

  const [newUsername, setNewUsername] = useState(savedUsername);
  const [usernameError, setUsernameError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const usernameChanged = !!newUsername.trim() && newUsername.trim() !== savedUsername;
  const passwordFilled = !!currentPassword && !!newPassword && !!confirmNewPassword;
  const hasChanges = !!avatarBlob || !!bannerBlob || usernameChanged || passwordFilled;

  useEffect(() => {
    if (!savedUsername) return;
    authFetch(`/api/uflow/user/${savedUsername}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const bustUrl = (apiUrl: string, key: string) => {
          const stored = localStorage.getItem(key);
          return stored && stored.split('?')[0] === apiUrl ? stored : apiUrl;
        };
        if (data.avatar_url) setAvatarPreview(bustUrl(data.avatar_url, 'vj_avatar_url'));
        if (data.banner_url) setBannerPreview(bustUrl(data.banner_url, 'vj_banner_url'));
      })
      .catch(() => {});
  }, []);

  const handleAvatarPick = (file: File) => {
    setCropSrc(URL.createObjectURL(file));
    setCropMode('avatar');
  };

  const handleBannerPick = (file: File) => {
    setCropSrc(URL.createObjectURL(file));
    setCropMode('banner');
  };

  const handleCropConfirm = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    if (cropMode === 'avatar') { setAvatarPreview(url); setAvatarBlob(blob); }
    else { setBannerPreview(url); setBannerBlob(blob); }
    setCropSrc(null);
  }, [cropMode]);

  const handleCropCancel = useCallback(() => {
    setCropSrc(null);
    if (cropMode === 'avatar') { if (avatarInputRef.current) avatarInputRef.current.value = ''; }
    else { if (bannerInputRef.current) bannerInputRef.current.value = ''; }
  }, [cropMode]);

  if (!localStorage.getItem('vj_token')) {
    return <Navigate to="/uflow/auth" replace />;
  }

  const saveAll = async () => {
    if (passwordFilled && newPassword !== confirmNewPassword) {
      setPasswordError(t('passwordMismatch'));
      return;
    }
    if (passwordFilled && newPassword.length < 1) {
      setPasswordError(t('settingsNewPassword'));
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    setUsernameError('');
    setPasswordError('');

    const tasks: Promise<void>[] = [];

    if (avatarBlob) {
      tasks.push((async () => {
        const form = new FormData();
        form.append('file', avatarBlob, 'avatar.jpg');
        const res = await authFetch('/api/uflow/user/avatar', { method: 'POST', body: form });
        if (!res.ok) throw new Error((await res.json()).detail || t('uploadError'));
        const data = await res.json();
        if (data.avatar_url) {
          const busted = `${data.avatar_url}?t=${Date.now()}`;
          localStorage.setItem('vj_avatar_url', busted);
          setAvatarPreview(busted);
        }
        setAvatarBlob(null);
      })());
    }

    if (bannerBlob) {
      tasks.push((async () => {
        const form = new FormData();
        form.append('file', bannerBlob, 'banner.jpg');
        const res = await authFetch('/api/uflow/user/banner', { method: 'POST', body: form });
        if (!res.ok) throw new Error((await res.json()).detail || t('uploadError'));
        const data = await res.json();
        if (data.banner_url) {
          const busted = `${data.banner_url}?t=${Date.now()}`;
          localStorage.setItem('vj_banner_url', busted);
          setBannerPreview(busted);
        }
        setBannerBlob(null);
      })());
    }

    if (usernameChanged) {
      tasks.push((async () => {
        const trimmed = newUsername.trim();
        const res = await authFetch('/api/uflow/user/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: trimmed }),
        });
        if (!res.ok) {
          const d = await res.json();
          setUsernameError(d.detail || t('uploadError'));
          throw new Error(d.detail);
        }
        localStorage.setItem('vj_username', trimmed);
        setSavedUsername(trimmed);
      })());
    }

    if (passwordFilled) {
      tasks.push((async () => {
        const res = await authFetch('/api/uflow/user/password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
        });
        if (!res.ok) {
          const d = await res.json();
          setPasswordError(d.detail || t('uploadError'));
          throw new Error(d.detail);
        }
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      })());
    }

    const results = await Promise.allSettled(tasks);
    const anyFailed = results.some(r => r.status === 'rejected');
    if (!anyFailed) setSaveSuccess(true);
    setSaving(false);
  };

  return (
    <>
      <Box sx={{
        height: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        pb: { xs: '56px', md: 0 },
      }}>
        <Navbar />

        <Box sx={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          px: { xs: 0, md: 3 },
          gap: { xs: 0, md: 3 },
          maxWidth: 1400,
          mx: 'auto',
          width: '100%',
        }}>
          <Sidebar activeNav="" onNavChange={(id) => navigate(`/uflow/${id}`)} />

          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', py: 3, px: { xs: 2, md: 0 } }}>
            <Box sx={{ maxWidth: 620, mx: 'auto' }}>
              <Typography fontWeight={700} fontSize={20} mb={3}>{t('profileSettings')}</Typography>

              {/* ── Images ── */}
              <Section title={t('settingsProfileImages')}>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>

                  {/* Avatar */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                    <Typography fontSize={13} color="text.secondary" fontWeight={500}>
                      {t('settingsAvatar')}
                    </Typography>
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={avatarPreview || undefined}
                        onClick={() => avatarInputRef.current?.click()}
                        sx={{
                          width: 96, height: 96, fontSize: 26, fontWeight: 700,
                          background: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)',
                          cursor: 'pointer',
                        }}
                      >
                        {!avatarPreview && initials}
                      </Avatar>
                      <IconButton
                        size="small"
                        onClick={() => avatarInputRef.current?.click()}
                        sx={{
                          position: 'absolute', bottom: 0, right: 0,
                          bgcolor: '#7C3AED', color: '#fff', p: 0.5,
                          '&:hover': { bgcolor: '#6D28D9' },
                          boxShadow: 2,
                        }}
                      >
                        <CameraAltIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                    <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarPick(f); }} />
                    {avatarBlob && (
                      <Typography fontSize={11} color="primary.main">
                        {t('settingsClickToChange')} ✓
                      </Typography>
                    )}
                  </Box>

                  {/* Banner */}
                  <Box sx={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Typography fontSize={13} color="text.secondary" fontWeight={500}>
                      {t('settingsBanner')}
                    </Typography>
                    <Box
                      onClick={() => bannerInputRef.current?.click()}
                      sx={{
                        height: 96, borderRadius: 2, overflow: 'hidden', cursor: 'pointer',
                        background: bannerPreview
                          ? `url(${bannerPreview}) center/cover no-repeat`
                          : 'linear-gradient(135deg, #1a0533 0%, #0d1b4b 50%, #0a1428 100%)',
                        border: '2px dashed', borderColor: 'divider',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative',
                        '&:hover .overlay': { opacity: 1 },
                      }}
                    >
                      <Box className="overlay" sx={{
                        position: 'absolute', inset: 0,
                        bgcolor: 'rgba(0,0,0,0.45)', borderRadius: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.2s',
                      }}>
                        <CameraAltIcon sx={{ color: '#fff', fontSize: 26 }} />
                      </Box>
                      {!bannerPreview && (
                        <Typography fontSize={12} color="rgba(255,255,255,0.45)">
                          {t('settingsClickToChange')}
                        </Typography>
                      )}
                    </Box>
                    <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleBannerPick(f); }} />
                    {bannerBlob && (
                      <Typography fontSize={11} color="primary.main">
                        {t('settingsClickToChange')} ✓
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Section>

              {/* ── Username ── */}
              <Section title={t('settingsAccount')}>
                <TextField
                  fullWidth size="small"
                  label={t('settingsNewUsername')}
                  value={newUsername}
                  onChange={e => { setNewUsername(e.target.value); setUsernameError(''); setSaveSuccess(false); }}
                  inputProps={{ maxLength: 32 }}
                  sx={{ mb: usernameError ? 1.5 : 0 }}
                />
                {usernameError && <Alert severity="error">{usernameError}</Alert>}
              </Section>

              {/* ── Password ── */}
              <Section title={t('settingsPassword')}>
                <TextField
                  fullWidth size="small" label={t('settingsCurrentPassword')} type="password"
                  value={currentPassword}
                  onChange={e => { setCurrentPassword(e.target.value); setPasswordError(''); setSaveSuccess(false); }}
                  sx={{ mb: 1.5 }}
                />
                <TextField
                  fullWidth size="small" label={t('settingsNewPassword')} type="password"
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setPasswordError(''); setSaveSuccess(false); }}
                  sx={{ mb: 1.5 }}
                />
                <TextField
                  fullWidth size="small" label={t('confirmPassword')} type="password"
                  value={confirmNewPassword}
                  onChange={e => { setConfirmNewPassword(e.target.value); setPasswordError(''); setSaveSuccess(false); }}
                  sx={{ mb: passwordError ? 1.5 : 0 }}
                />
                {passwordError && <Alert severity="error">{passwordError}</Alert>}
              </Section>

              {/* ── Save button ── */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Button
                  variant="contained"
                  onClick={saveAll}
                  disabled={saving || !hasChanges}
                  sx={{
                    background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
                    borderRadius: 2, textTransform: 'none', minWidth: 140, py: 1,
                    '&:hover': { background: 'linear-gradient(135deg, #6D28D9, #2563EB)' },
                  }}
                >
                  {saving
                    ? <CircularProgress size={18} color="inherit" />
                    : t('settingsSave')}
                </Button>
                {saveSuccess && (
                  <Typography fontSize={14} color="success.main" fontWeight={500}>
                    {t('settingsSaved')}
                  </Typography>
                )}
              </Box>

            </Box>
          </Box>

          <Box sx={{ width: 220, flexShrink: 0, display: { xs: 'none', md: 'block' } }} />
        </Box>
      </Box>

      <BottomNav activeNav="" onNavChange={(id) => navigate(`/uflow/${id}`)} />

      {cropSrc && (
        <CropDialog
          open={!!cropSrc}
          imageSrc={cropSrc}
          mode={cropMode}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}

export default UFlowSettingsPage;
