import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Stack,
  Paper,
  Divider,
  useTheme,
  CircularProgress
} from '@mui/material';
import {
  Handshake as VolunteerIcon,
  MedicalServices as MedicalIcon,
  Info as InfoIcon,
  SupportAgent as SupportIcon,
  Create as CreateIcon,
  Extension as GameIcon
} from '@mui/icons-material';
import { useUserStore } from '../store/userStore';
import { useRequestStore } from '../store/requestStore';

// Интерфейс для статистики
interface Stats {
  volunteers: number;
  completedRequests: number;
  partners: number;
  isSupport247: boolean;
}

const HomePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { fetchStats, isLoading } = useRequestStore();
  const [stats, setStats] = useState<Stats>({
    volunteers: 0,
    completedRequests: 0,
    partners: 0,
    isSupport247: true
  });

  useEffect(() => {
    // Загружаем статистику с сервера
    const loadStats = async () => {
      try {
        // Здесь будет реальный запрос к API, пока используем заглушку
        // const serverStats = await fetchStats();
        // setStats(serverStats);
        
        // Временная заглушка для демонстрации
        setTimeout(() => {
          setStats({
            volunteers: 530,
            completedRequests: 1278,
            partners: 53,
            isSupport247: true
          });
        }, 1000);
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
      }
    };
    
    loadStats();
  }, []);

  const actionCards = [
    {
      title: 'Запросить помощь',
      description: 'Заполните форму запроса помощи, и наши волонтеры откликнутся в ближайшее время',
      icon: <MedicalIcon fontSize="large" color="primary" />,
      action: () => navigate('/new-request'),
      actionText: 'Заполнить форму'
    },
    {
      title: 'Стать волонтером',
      description: 'Присоединяйтесь к нашей команде волонтеров и помогайте тем, кто в этом нуждается',
      icon: <VolunteerIcon fontSize="large" color="primary" />,
      action: () => navigate('/volunteer'),
      actionText: 'Присоединиться'
    },
    {
      title: 'О проекте',
      description: 'Узнайте больше о нашем проекте, миссии и целях, которые мы преследуем',
      icon: <InfoIcon fontSize="large" color="primary" />,
      action: () => navigate('/about'),
      actionText: 'Подробнее'
    },
    {
      title: 'Игровая платформа',
      description: 'Участвуйте в выполнении заданий, получайте награды и достижения',
      icon: <GameIcon fontSize="large" color="primary" />,
      action: () => navigate('/game'),
      actionText: 'Играть'
    }
  ];

  // Добавляем кнопку профиля, если пользователь авторизован
  if (user) {
    actionCards.push({
      title: 'Мой профиль',
      description: 'Просмотрите свой профиль, статистику и достижения',
      icon: <Create as CreateIcon fontSize="large" color="primary" />,
      action: () => navigate('/profile'),
      actionText: 'Перейти в профиль'
    });
  }

  // Статистика в красивом формате чисел
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // Компонент для отображения статистики с анимацией при загрузке
  const StatItem = ({ value, label }: { value: string | number, label: string }) => (
    <Box sx={{ textAlign: 'center' }}>
      <Typography 
        variant="h3" 
        color="primary" 
        fontWeight="bold"
        sx={{ 
          transition: 'all 0.5s ease-in-out',
          animation: isLoading ? 'none' : 'fade-in 1s ease-in-out',
          '@keyframes fade-in': {
            '0%': { opacity: 0, transform: 'translateY(10px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' }
          }
        }}
      >
        {isLoading ? <CircularProgress size={40} /> : value}
      </Typography>
      <Typography variant="body1">{label}</Typography>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
      {/* Hero Section */}
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          backgroundColor: 'transparent',
          color: 'white',
          mb: 6,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundImage: 'url(/images/hero-bg.jpg)',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            backgroundColor: 'rgba(0,0,0,.6)',
          }}
        />
        <Grid container>
          <Grid item md={6}>
            <Box
              sx={{
                position: 'relative',
                p: { xs: 3, md: 6 },
                pr: { md: 0 },
              }}
            >
              <Typography component="h1" variant="h3" color="inherit" gutterBottom>
                Московское волонтерское движение
              </Typography>
              <Typography variant="h5" color="inherit" paragraph>
                Платформа для координации помощи между волонтерами и теми, кто нуждается в поддержке
              </Typography>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => navigate('/new-request')}
                sx={{ mt: 2 }}
              >
                Запросить помощь
              </Button>
              {user && (
                <Button 
                  variant="outlined" 
                  size="large"
                  onClick={() => navigate('/profile')}
                  sx={{ mt: 2, ml: 2, color: 'white', borderColor: 'white' }}
                >
                  Мой профиль
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Action Cards */}
      <Typography
        variant="h4"
        component="h2"
        sx={{
          mb: 4,
          fontWeight: 'bold',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            width: '60px',
            height: '4px',
            bottom: '-12px',
            left: '0',
            backgroundColor: theme.palette.primary.main,
            borderRadius: '2px',
          }
        }}
      >
        Что вы можете сделать
      </Typography>

      <Grid container spacing={4}>
        {actionCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6
                },
                borderRadius: 2
              }}
            >
              <CardContent sx={{ 
                textAlign: 'center', 
                pt: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flexGrow: 1
              }}>
                <Box sx={{ 
                  mb: 2, 
                  display: 'flex', 
                  justifyContent: 'center',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: theme.palette.primary.light,
                  alignItems: 'center'
                }}>
                  {card.icon}
                </Box>
                <Typography gutterBottom variant="h5" component="h3">
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ padding: 2, pt: 0 }}>
                <Button 
                  fullWidth 
                  size="medium" 
                  variant="outlined" 
                  onClick={card.action}
                >
                  {card.actionText}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Statistics */}
      <Box sx={{ mt: 8, mb: 6 }}>
        <Paper
          sx={{
            p: 4,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
            boxShadow: 3
          }}
        >
          <Typography variant="h5" component="h3" sx={{ mb: 3, fontWeight: 'bold' }}>
            Наша статистика
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={3}>
              <StatItem value={formatNumber(stats.volunteers) + '+'} label="Волонтеров" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatItem value={formatNumber(stats.completedRequests) + '+'} label="Выполненных запросов" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatItem value={formatNumber(stats.partners) + '+'} label="Организаций-партнеров" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatItem value={stats.isSupport247 ? '24/7' : 'Пн-Пт'} label="Поддержка" />
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Call to action */}
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Готовы помочь?
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Станьте частью нашего сообщества и помогайте делать мир лучше
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button 
            variant="contained" 
            size="large" 
            startIcon={<VolunteerIcon />}
            onClick={() => navigate('/volunteer')}
          >
            Стать волонтером
          </Button>
          <Button 
            variant="outlined" 
            size="large" 
            startIcon={<SupportIcon />}
            onClick={() => navigate('/contacts')}
          >
            Связаться с нами
          </Button>
        </Stack>
      </Box>
    </Container>
  );
};

export default HomePage; 