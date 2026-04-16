import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, AppBar, Toolbar, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, Alert, Tooltip, Avatar,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LogoutIcon from '@mui/icons-material/Logout';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1e88e5' },
    background: { default: '#ffffff', paper: '#f5f5f5' },
    text: { primary: '#000000', secondary: '#546e7a' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { margin: 0, padding: 0 } },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          borderBottom: '1px solid #1e88e5',
          boxShadow: '0 1px 12px rgba(30, 136, 229, 0.25)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { backgroundColor: '#ffffff', border: '1px solid #1e88e5' },
      },
    },
  },
});

function VideoJamPage() {
  const navigate = useNavigate();
  const username = localStorage.getItem('vj_username') || 'Гость';
  const token = localStorage.getItem('vj_token');

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    localStorage.removeItem('vj_token');
    localStorage.removeItem('vj_username');
    navigate('/ushikaVamp4/auth');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setUploadError('');
    setUploadSuccess(false);
  };

  const handleUpload = async () => {
    if (!selectedFile || !token) return;

    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/ushikaVamp4/video', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.detail || 'Ошибка загрузки');
        return;
      }

      setUploadSuccess(true);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      setUploadError('Ошибка соединения с сервером');
    } finally {
      setUploading(false);
    }
  };

  const handleCloseUpload = () => {
    setUploadOpen(false);
    setSelectedFile(null);
    setUploadError('');
    setUploadSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Шапка */}
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 2, px: 4 }}>
          <PlayCircleFilledIcon sx={{ color: '#1e88e5', fontSize: 34 }} />
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ flexGrow: 1, color: '#ffffff', letterSpacing: 1 }}
          >
            Ushikava<span style={{ color: '#1e88e5' }}>Mp4</span>
          </Typography>

          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={() => setUploadOpen(true)}
            sx={{
              bgcolor: '#1e88e5',
              '&:hover': { bgcolor: '#42a5f5' },
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 'bold',
            }}
          >
            Загрузить
          </Button>

          <Tooltip title={`Выйти (${username})`}>
            <Avatar
              sx={{
                bgcolor: '#1e88e5',
                width: 34,
                height: 34,
                fontSize: 14,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#42a5f5' },
              }}
              onClick={handleLogout}
            >
              {username[0].toUpperCase()}
            </Avatar>
          </Tooltip>

          <Tooltip title="Выйти">
            <IconButton onClick={handleLogout} size="small" sx={{ color: '#546e7a' }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Лента */}
      <Box sx={{ bgcolor: '#ffffff', minHeight: 'calc(100vh - 64px)', px: 6, py: 5 }}>

        {/* Пустое состояние */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 2,
          }}
        >
          <VideoLibraryIcon sx={{ fontSize: 90, color: '#d0d0d0' }} />
          <Typography variant="h6" sx={{ color: '#aaa' }}>
            Здесь пока пусто
          </Typography>
          <Typography variant="body2" sx={{ color: '#bbb' }}>
            Загрузи первое видео
          </Typography>
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={() => setUploadOpen(true)}
            sx={{
              mt: 1,
              borderColor: '#1e88e5',
              color: '#1e88e5',
              textTransform: 'none',
              '&:hover': { borderColor: '#42a5f5', color: '#42a5f5', bgcolor: 'transparent' },
            }}
          >
            Загрузить видео
          </Button>
        </Box>
      </Box>

      {/* Диалог загрузки */}
      <Dialog open={uploadOpen} onClose={handleCloseUpload} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#fff', borderBottom: '1px solid #1a1a1a', pb: 2 }}>
          Загрузить видео
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '20px !important' }}>
          {uploadError && <Alert severity="error">{uploadError}</Alert>}
          {uploadSuccess && <Alert severity="success">Видео успешно загружено!</Alert>}

          <Box
            sx={{
              border: '2px dashed #1e88e5',
              borderRadius: 2,
              p: 5,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: '#42a5f5',
                bgcolor: 'rgba(21, 101, 192, 0.05)',
              },
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <CloudUploadIcon sx={{ fontSize: 52, color: '#1e88e5', mb: 1 }} />
            <Typography sx={{ color: selectedFile ? '#fff' : '#546e7a', mb: 0.5 }}>
              {selectedFile ? selectedFile.name : 'Нажми чтобы выбрать файл'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#333' }}>
              MP4, WebM, MOV, AVI
            </Typography>
          </Box>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          {uploading && <LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: '#1e88e5' } }} />}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1, borderTop: '1px solid #1a1a1a' }}>
          <Button
            onClick={handleCloseUpload}
            sx={{ color: '#546e7a', textTransform: 'none' }}
          >
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            sx={{
              bgcolor: '#1e88e5',
              '&:hover': { bgcolor: '#42a5f5' },
              textTransform: 'none',
              fontWeight: 'bold',
            }}
          >
            Загрузить
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default VideoJamPage;
