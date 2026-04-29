import { Routes, Route, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CanvasPage, { PopupProvider } from './pages/CanvasPage';
import UFlowAuthPage from './pages/UFlowAuthPage';
import UFlowPage from './pages/UFlowPage';
import VideoPage from './pages/VideoPage';
import UFlowProfilePage from './pages/UFlowProfilePage';
import UFlowSettingsPage from './pages/UFlowSettingsPage';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';

function AppTheme({ children }: { children: React.ReactNode }) {
  const { darkMode } = useLanguage();
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#7C3AED' },
      background: {
        default: darkMode ? '#0F0F1A' : '#F5F6FF',
        paper: darkMode ? '#1A1A2E' : '#ffffff',
      },
    },
    typography: { fontFamily: '"Inter", "Roboto", sans-serif' },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { margin: 0, padding: 0 },
          '*::-webkit-scrollbar': { width: '6px' },
          '*::-webkit-scrollbar-track': { background: 'transparent' },
          '*::-webkit-scrollbar-thumb': {
            background: darkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)',
            borderRadius: '3px',
          },
          '*::-webkit-scrollbar-thumb:hover': {
            background: darkMode ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.30)',
          },
        },
      },
    },
  });
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppTheme>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/canvas" element={<PopupProvider><CanvasPage /></PopupProvider>} />
          <Route path="/uflow" element={<Navigate to="/uflow/for-you" replace />} />
          <Route path="/uflow/auth" element={<UFlowAuthPage />} />
          <Route path="/uflow/:tab" element={<UFlowPage />} />
          <Route path="/uflow/video/:slug" element={<VideoPage />} />
          <Route path="/uflow/user/:username" element={<UFlowProfilePage />} />
          <Route path="/uflow/settings" element={<UFlowSettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppTheme>
    </LanguageProvider>
  );
}

export default App;
