import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button,
  Tabs, Tab, Alert, CircularProgress, styled, keyframes,
} from '@mui/material';
import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';

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

function VideoAuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabValue>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const res = await fetch('/api/login', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Ошибка входа');
        return;
      }

      localStorage.setItem('vj_token', data.access_token);
      localStorage.setItem('vj_username', username);
      navigate('/ushikaVamp4');
    } catch {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(
        `/api/register?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        { method: 'POST' }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Ошибка регистрации');
        return;
      }

      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      const loginRes = await fetch('/api/login', { method: 'POST', body: formData });
      const loginData = await loginRes.json();

      localStorage.setItem('vj_token', loginData.access_token);
      localStorage.setItem('vj_username', username);
      navigate('/ushikaVamp4');
    } catch {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!username.trim() || !password.trim()) return;
    if (tab === 'login') handleLogin();
    else handleRegister();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GradientBox
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper elevation={6} sx={{ p: 5, borderRadius: 3, minWidth: 340, textAlign: 'center' }}>
          <PlayCircleFilledIcon sx={{ fontSize: 48, color: '#7c4dff', mb: 1 }} />

          <Typography variant="h5" fontWeight="bold" gutterBottom>
            UshikavaMp4
          </Typography>

          <Tabs
            value={tab}
            onChange={(_, v) => { setTab(v); setError(''); }}
            centered
            sx={{ mb: 3, '& .MuiTabs-indicator': { backgroundColor: '#7c4dff' } }}
          >
            <Tab label="Войти" value="login" sx={{ '&.Mui-selected': { color: '#7c4dff' } }} />
            <Tab label="Регистрация" value="register" sx={{ '&.Mui-selected': { color: '#7c4dff' } }} />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>{error}</Alert>}

          <TextField
            fullWidth
            label="Имя пользователя"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            sx={{ mb: 2 }}
            inputProps={{ maxLength: 32 }}
          />
          <TextField
            fullWidth
            label="Пароль"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            sx={{ mb: 3 }}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={!username.trim() || !password.trim() || loading}
            sx={{ py: 1.5, bgcolor: '#7c4dff', '&:hover': { bgcolor: '#651fff' } }}
          >
            {loading
              ? <CircularProgress size={24} color="inherit" />
              : tab === 'login' ? 'Войти' : 'Зарегистрироваться'
            }
          </Button>
        </Paper>
      </GradientBox>
    </ThemeProvider>
  );
}

export default VideoAuthPage;
