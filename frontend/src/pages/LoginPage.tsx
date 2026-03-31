import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper, styled, keyframes } from '@mui/material';
import { Brush } from '@mui/icons-material';
import { CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

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
  background: "linear-gradient(-45deg, #b5ead7, #ffdac1, #e2f0cb, #ffb7b2)",
  backgroundSize: "400% 400%",
  animation: `${gradientAnimation} 20s ease infinite`,
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  textAlign: "center",
  fontFamily: "Arial"
}));

function LoginPage() {
  const [nickname, setNickname] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    localStorage.setItem('canvas_nickname', trimmed);
    navigate('/canvas');
  };

  return (
    <ThemeProvider theme={theme}>
    <CssBaseline />
    <GradientBox sx={{
       minHeight: "100vh",
       display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh', }}>
      <Paper elevation={6} sx={{ p: 5, borderRadius: 3, minWidth: 340, textAlign: 'center' }}>
        <Brush sx={{ fontSize: 48, color: '#7c4dff', mb: 1 }} />
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          To game
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Nickname
        </Typography>
        <TextField
          fullWidth
          label="Nickname"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          autoFocus
          inputProps={{ maxLength: 32 }}
        />
        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 2, py: 1.5, bgcolor: '#7c4dff', '&:hover': { bgcolor: '#651fff' } }}
          onClick={handleLogin}
          disabled={!nickname.trim()}
        >
          Enter
        </Button>
      </Paper>
    </GradientBox>
    </ThemeProvider>
  );
}

export default LoginPage;
