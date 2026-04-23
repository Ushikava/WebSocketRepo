import { useNavigate } from 'react-router-dom';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useLanguage } from '../../i18n/LanguageContext';

interface AuthPromptDialogProps {
  open: boolean;
  onClose: () => void;
}

function AuthPromptDialog({ open, onClose }: AuthPromptDialogProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const goToAuth = () => { onClose(); navigate('/uflow/auth'); };

  return (
    <Dialog open={open} onClose={onClose} slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 'bold' }}>
        <LockOutlinedIcon sx={{ color: '#7C3AED' }} />
        {t('pleaseSignIn')}
      </DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" fontSize={14}>
          {t('authPromptBody')}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#888' }}>
          {t('cancel')}
        </Button>
        <Button
          variant="outlined"
          onClick={goToAuth}
          sx={{ borderColor: '#7C3AED', color: '#7C3AED', borderRadius: 2, textTransform: 'none' }}
        >
          {t('signIn')}
        </Button>
        <Button
          variant="contained"
          onClick={goToAuth}
          sx={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)', borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
        >
          {t('register')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AuthPromptDialog;
