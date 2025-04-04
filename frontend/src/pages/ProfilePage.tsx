import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Avatar,
  Button,
  TextField,
  Divider,
  Chip,
  Card,
  CardContent,
  useTheme,
  IconButton,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Assignment as TaskIcon,
  Favorite as HeartIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useUserStore } from '../store/userStore';
import { useGameStore } from '../store/gameStore';
import { useRequestStore } from '../store/requestStore';

const ProfilePage: React.FC = () => {
  const theme = useTheme();
  const { user, updateUserProfile, isLoading: userLoading } = useUserStore();
  const { player, syncGameDataWithBackend } = useGameStore();
  const { userRequests, fetchUserRequests, isLoading: requestsLoading } = useRequestStore();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    phone: user?.phone || '+7 (999) 123-45-67',
    address: user?.address || 'г. Москва, ул. Ленина, д. 10, кв. 5',
    about: user?.about || 'Люблю помогать людям и участвовать в волонтерских проектах.',
  });

  // Загружаем данные пользователя и запросы при монтировании
  useEffect(() => {
    if (user) {
      // Синхронизируем данные игры с бэкендом
      syncGameDataWithBackend();
      // Получаем запросы пользователя
      fetchUserRequests();
      
      // Обновляем локальный стейт профиля
      setProfileData({
        phone: user.phone || profileData.phone,
        address: user.address || profileData.address,
        about: user.about || profileData.about,
      });
    }
  }, [user?.id]);

  // Индикатор загрузки
  const isLoading = userLoading || requestsLoading;

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" align="center">
            Загрузка данных пользователя...
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <CircularProgress />
          </Box>
        </Paper>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" align="center" color="error">
            Пользователь не найден. Пожалуйста, войдите в систему.
          </Typography>
        </Paper>
      </Container>
    );
  }

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    // Сохраняем данные через API
    await updateUserProfile({
      ...profileData
    });
    setIsEditing(false);
  };

  // Статистика пользователя из игровых данных
  const userLevel = player?.level || user?.stats?.level || 1;
  const userExperience = player?.experience || user?.stats?.experience || 0;
  const nextLevelExperience = player?.nextLevelExperience || 100;
  const experienceProgress = (userExperience / nextLevelExperience) * 100;

  // Статистика запросов
  const completedRequests = userRequests?.filter(req => req.status === 'completed')?.length || 0;
  const totalRequests = userRequests?.length || 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontWeight: 'bold',
            color: theme.palette.primary.main,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              width: '40px',
              height: '4px',
              bottom: '-8px',
              left: '0',
              backgroundColor: theme.palette.primary.main,
              borderRadius: '2px',
            } 
          }}
        >
          Профиль пользователя
        </Typography>
        
        <Button
          variant={isEditing ? "contained" : "outlined"}
          color={isEditing ? "success" : "primary"}
          startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
          onClick={isEditing ? handleSave : handleEditToggle}
        >
          {isEditing ? "Сохранить" : "Редактировать"}
        </Button>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                src={user.photoUrl}
                alt={user.firstName}
                sx={{ width: 120, height: 120, mb: 2, boxShadow: 2 }}
              />
              <Typography variant="h5" gutterBottom>
                {user.firstName} {user.lastName}
              </Typography>
              <Chip 
                label={user.role === 'volunteer' ? "Волонтёр" : "Пользователь"} 
                color={user.role === 'volunteer' ? "primary" : "default"}
                size="small"
              />
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Уровень
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <StarIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {userLevel}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Опыт
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrophyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {userExperience} XP
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={experienceProgress} 
                sx={{ mt: 1, height: 6, borderRadius: 3 }} 
              />
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Контактная информация
              </Typography>
              
              {isEditing ? (
                <TextField
                  name="phone"
                  label="Телефон"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  fullWidth
                  margin="normal"
                  size="small"
                />
              ) : (
                <Typography variant="body2" gutterBottom>
                  {profileData.phone}
                </Typography>
              )}
              
              {isEditing ? (
                <TextField
                  name="address"
                  label="Адрес"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  fullWidth
                  margin="normal"
                  size="small"
                />
              ) : (
                <Typography variant="body2">
                  {profileData.address}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              О себе
            </Typography>
            
            {isEditing ? (
              <TextField
                name="about"
                label="О себе"
                value={profileData.about}
                onChange={handleProfileChange}
                fullWidth
                multiline
                rows={4}
                margin="normal"
              />
            ) : (
              <Typography variant="body1" paragraph>
                {profileData.about}
              </Typography>
            )}
          </Paper>
          
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Статистика
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ bgcolor: theme.palette.primary.light, color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TaskIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h5" gutterBottom>
                      {totalRequests}
                    </Typography>
                    <Typography variant="body2">
                      Всего запросов
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {user.role === 'volunteer' && (
                <>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ bgcolor: theme.palette.success.light, color: 'white' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <HeartIcon sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h5" gutterBottom>
                          {completedRequests}
                        </Typography>
                        <Typography variant="body2">
                          Выполненных запросов
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ bgcolor: theme.palette.warning.light, color: 'white' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <TimeIcon sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h5" gutterBottom>
                          {user.stats?.volunteerHours || 0}
                        </Typography>
                        <Typography variant="body2">
                          Часов волонтёрства
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ bgcolor: theme.palette.info.light, color: 'white' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <StarIcon sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h5" gutterBottom>
                          {user.stats?.rating || 0}
                        </Typography>
                        <Typography variant="body2">
                          Рейтинг
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage; 