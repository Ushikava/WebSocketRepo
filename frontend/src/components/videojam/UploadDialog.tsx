import { useState, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Alert, LinearProgress, TextField,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUploaded?: () => void;
}

function UploadDialog({ open, onClose, onUploaded }: UploadDialogProps) {
  const token = localStorage.getItem('vj_token');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setError('');
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!selectedFile || !token || !title.trim()) return;
    setUploading(true);
    setError('');
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await fetch(`/api/ushikavamp4/video?title=${encodeURIComponent(title.trim())}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || 'Upload error'); return; }
      setSuccess(true);
      setSelectedFile(null);
      setTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploaded?.();
    } catch {
      setError('Server connection error');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setTitle('');
    setError('');
    setSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle sx={{ fontWeight: 'bold' }}>Upload Video</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">Video uploaded successfully!</Alert>}

        <Box
          sx={{
            border: '2px dashed #C4B5FD', borderRadius: 3,
            p: 5, textAlign: 'center', cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { borderColor: '#7C3AED', bgcolor: '#FAFAFF' },
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <CloudUploadIcon sx={{ fontSize: 52, color: '#C4B5FD', mb: 1 }} />
          <Typography sx={{ color: selectedFile ? '#7C3AED' : '#999', mb: 0.5 }}>
            {selectedFile ? selectedFile.name : 'Click to select a file'}
          </Typography>
          <Typography variant="caption" color="#ccc">MP4, WebM, MOV, AVI</Typography>
        </Box>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          inputProps={{ maxLength: 100 }}
          placeholder="Enter video title..."
        />

        {uploading && (
          <LinearProgress sx={{
            borderRadius: 1,
            '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #7C3AED, #3B82F6)' },
          }} />
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button onClick={handleClose} sx={{ textTransform: 'none', color: '#888' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!selectedFile || !title.trim() || uploading}
          sx={{
            background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
            borderRadius: 2, textTransform: 'none', fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(124,58,237,0.3)',
          }}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default UploadDialog;
