import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CanvasPage, { PopupProvider } from './pages/CanvasPage';
import VideoAuthPage from './pages/VideoAuthPage';
import VideoJamPage from './pages/VideoJamPage';
import VideoPage from './pages/VideoPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/canvas" element={<PopupProvider><CanvasPage /></PopupProvider>} />
      <Route path="/ushikavamp4/auth" element={<VideoAuthPage />} />
      <Route path="/ushikavamp4" element={<VideoJamPage />} />
      <Route path="/ushikavamp4/video/:slug" element={<VideoPage />} />
    </Routes>
  );
}

export default App;
