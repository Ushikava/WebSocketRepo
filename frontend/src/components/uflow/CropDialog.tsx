import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Slider, Typography, CircularProgress,
} from '@mui/material';

interface CropDialogProps {
  open: boolean;
  imageSrc: string;
  mode: 'avatar' | 'banner';
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

async function getCroppedBlob(imageSrc: string, cropPx: Area): Promise<Blob> {
  const image = new Image();

  // onload must be set BEFORE src, otherwise the event may fire before the handler is attached
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = cropPx.width;
  canvas.height = cropPx.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.drawImage(image, cropPx.x, cropPx.y, cropPx.width, cropPx.height, 0, 0, cropPx.width, cropPx.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas produced empty blob'));
    }, 'image/jpeg', 0.92);
  });
}

function CropDialog({ open, imageSrc, mode, onConfirm, onCancel }: CropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPx, setCroppedAreaPx] = useState<Area | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const aspect = mode === 'avatar' ? 1 : 4;

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPx(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPx || confirming) return;
    setConfirming(true);
    setError('');
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPx);
      onConfirm(blob);
    } catch (e) {
      setError('Не удалось обработать изображение');
    } finally {
      setConfirming(false);
    }
  };

  const handleClose = () => {
    if (confirming) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setError('');
    onCancel();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1 }}>
        {mode === 'avatar' ? 'Обрезать аватар' : 'Обрезать баннер'}
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{
          position: 'relative',
          height: mode === 'avatar' ? 320 : 240,
          bgcolor: '#111',
        }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={mode === 'avatar' ? 'round' : 'rect'}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle: {
                border: '2px solid #7C3AED',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
              },
            }}
          />
        </Box>

        <Box sx={{ px: 3, py: 2 }}>
          <Typography fontSize={12} color="text.secondary" mb={0.5}>Масштаб</Typography>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.01}
            onChange={(_, v) => setZoom(v as number)}
            sx={{
              color: '#7C3AED',
              '& .MuiSlider-thumb': { width: 16, height: 16 },
            }}
          />
          {error && (
            <Typography fontSize={12} color="error.main" mt={1}>{error}</Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={confirming}
          sx={{ borderRadius: 2, textTransform: 'none', color: 'text.secondary' }}
        >
          Отмена
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={confirming || !croppedAreaPx}
          sx={{
            borderRadius: 2, textTransform: 'none', minWidth: 110,
            background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
            '&:hover': { background: 'linear-gradient(135deg, #6D28D9, #2563EB)' },
          }}
        >
          {confirming ? <CircularProgress size={16} color="inherit" /> : 'Применить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CropDialog;
