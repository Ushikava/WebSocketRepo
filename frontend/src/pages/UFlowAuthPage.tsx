import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Box, Paper, Typography, TextField, Button,
  Tabs, Tab, Alert, CircularProgress, styled, keyframes,
} from '@mui/material';
import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { margin: 0, padding: 0 },
        html: { margin: 0, padding: 0 },
      },
    },
  },
});

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const GradientBox = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(-45deg, #b5ead7, #ffdac1, #e2f0cb, #ffb7b2)',
  backgroundSize: '400% 400%',
  animation: `${gradientAnimation} 20s ease infinite`,
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  textAlign: 'center',
  fontFamily: 'Arial',
}));

type TabValue = 'login' | 'register';

function UFlowAuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabValue>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const saveSession = (data: { access_token: string; refresh_token: string; username: string }) => {
    localStorage.setItem('vj_token', data.access_token);
    localStorage.setItem('vj_refresh_token', data.refresh_token);
    localStorage.setItem('vj_username', data.username);
    navigate('/uflow');
  };

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || t('loginError')); return; }
      saveSession(data);
    } catch {
      setError(t('connectionError'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || t('registerError')); return; }
      saveSession(data);
    } catch {
      setError(t('connectionError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (tab === 'login') {
      if (!email.trim() || !password.trim()) return;
      handleLogin();
    } else {
      if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) return;
      handleRegister();
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, v: TabValue) => {
    setTab(v);
    setError('');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GradientBox sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Paper elevation={6} sx={{ p: 3, borderRadius: 3, width: 320, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight="bold" mb={1}>
            UFlow
          </Typography>

          <Tabs
            value={tab}
            onChange={handleTabChange}
            centered
            sx={{ mb: 2, '& .MuiTabs-indicator': { backgroundColor: '#7c4dff' } }}
          >
            <Tab label={t('loginTab')} value="login" sx={{ '&.Mui-selected': { color: '#7c4dff' }, minHeight: 36, py: 0.5 }} />
            <Tab label={t('registerTab')} value="register" sx={{ '&.Mui-selected': { color: '#7c4dff' }, minHeight: 36, py: 0.5 }} />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 1.5, textAlign: 'left' }}>{error}</Alert>}

          {tab === 'register' && (
            <TextField
              fullWidth size="small"
              label={t('username')}
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              sx={{ mb: 1.5 }}
              inputProps={{ maxLength: 32 }}
            />
          )}

          <TextField
            fullWidth size="small"
            label={t('email')}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            sx={{ mb: 1.5 }}
          />

          <TextField
            fullWidth size="small"
            label={t('password')}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            sx={{ mb: tab === 'register' ? 1.5 : 2 }}
          />

          {tab === 'register' && (
            <TextField
              fullWidth size="small"
              label={t('confirmPassword')}
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              sx={{ mb: 2 }}
            />
          )}

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={loading}
            sx={{ py: 1.5, bgcolor: '#7c4dff', '&:hover': { bgcolor: '#651fff' } }}
          >
            {loading
              ? <CircularProgress size={24} color="inherit" />
              : tab === 'login' ? t('loginButton') : t('registerButton')
            }
          </Button>
        </Paper>
      </GradientBox>
    </ThemeProvider>
  );
}

export default UFlowAuthPage;
