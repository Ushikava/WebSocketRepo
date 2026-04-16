import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CanvasPage, { PopupProvider } from './pages/CanvasPage';
import VideoAuthPage from './pages/VideoAuthPage';
import VideoJamPage from './pages/VideoJamPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/canvas" element={<PopupProvider><CanvasPage /></PopupProvider>} />
      <Route path="/ushikaVamp4/auth" element={<VideoAuthPage />} />
      <Route path="/ushikaVamp4" element={<VideoJamPage />} />
    </Routes>
  );
}

export default App;
