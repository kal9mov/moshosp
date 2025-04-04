import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Paper, Box, Grid, useTheme, Button } from '@mui/material';
import TelegramLoginButton from '../components/TelegramLoginButton';
import { TelegramAuthData } from '../lib/api';
import { useUserStore } from '../store/userStore';

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated, login } = useUserStore();
  
  // Если пользователь уже авторизован, перенаправляем на главную
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Обработчик успешной авторизации
  const handleAuthSuccess = (user: TelegramAuthData) => {
    console.log('Успешная авторизация через Telegram:', user);
    // Навигация будет выполнена после успешного логина через эффект
  };

  // Обработчик тестового входа
  const handleTestLogin = async () => {
    try {
      // Используем тестовые данные, имитирующие ответ Telegram
      const testUser: TelegramAuthData = {
        id: "123456789",
        first_name: "Тестовый",
        last_name: "Пользователь",
        username: "test_user",
        photo_url: "",
        auth_date: Math.floor(Date.now() / 1000),
        hash: "fake_hash_for_testing"
      };
      
      // Сначала выполняем авторизацию через store
      await login(testUser);
      console.log('Тестовая авторизация успешна');
      
      // Navigate будет вызван автоматически через эффект после изменения isAuthenticated
    } catch (error) {
      console.error('Ошибка при тестовом входе:', error);
    }
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
              
              {/* Инструкции для разработки */}
              <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 2, display: 'block' }}>
                Для локальной разработки:
                <br />
                1. Укажите в BotFather полный URL: {window.location.origin}
                <br />
                2. Проверьте консоль браузера для диагностики
              </Typography>
              
              {/* Альтернативная кнопка для тестирования */}
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" mb={1}>
                  Для тестирования без Telegram:
                </Typography>
                <Button 
                  variant="outlined"
                  size="small"
                  onClick={handleTestLogin}
                >
                  Тестовый вход
                </Button>
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