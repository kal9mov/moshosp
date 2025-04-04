import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Paper, Box, Grid, useTheme } from '@mui/material';
import TelegramLoginButton from './TelegramLoginButton';
import { TelegramAuthData } from '../lib/api';
import { useUserStore } from '../store/userStore';

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  
  // Если пользователь уже авторизован, перенаправляем на главную
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Обработчик успешной авторизации
  const handleAuthSuccess = (user: TelegramAuthData) => {
    console.log('Успешная авторизация через Telegram:', user);
    navigate('/');
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{ 
            p: 4, 
            width: '100%',
            borderRadius: 2,
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography
              component="h1"
              variant="h4"
              color="primary"
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              МосПомощь
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Платформа для волонтерской помощи
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="body1" align="center" paragraph>
                Используйте Telegram для быстрой авторизации:
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <TelegramLoginButton
                  botName="MosHosp_bot"
                  buttonSize="large"
                  cornerRadius={8}
                  usePic={true}
                  requestAccess="write"
                  onAuthCallback={handleAuthSuccess}
                />
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              Войдите, чтобы создавать запросы помощи или стать волонтером
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage; 