import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  useTheme,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Divider,
  Badge,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as CompletedIcon,
  HourglassEmpty as PendingIcon,
  Assignment as TaskIcon,
  Star as StarIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  NotificationsActive as NotificationIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  StarBorder as StarBorderIcon,
  DoneAll as DoneAllIcon,
  Schedule as ScheduleIcon,
  PeopleAlt as PeopleAltIcon
} from '@mui/icons-material';
import { useUserStore } from '../store/userStore';
import { useNavigate } from 'react-router-dom';
import { useRequestStore, HelpRequest } from '../store/requestStore';
import { useGameStore } from '../store/gameStore';
import { 
  getCategoryName, 
  getStatusName, 
  getPriorityName, 
  formatDate 
} from '../utils/helpers';

// Интерфейс для статистики волонтера
interface VolunteerStats {
  completedRequests: number;
  totalRequests: number;
  rating: number;
  hoursVolunteered: number;
  badges?: string[];
  level?: number;
  experience?: number;
  nextLevelExperience?: number;
}

const VolunteerPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const { user } = useUserStore();
  const { 
    isLoading, 
    error, 
    requests,
    fetchRequests,
    assignRequest,
    completeRequest
  } = useRequestStore();
  
  const { player } = useGameStore();

  // Фильтрация запросов по волонтеру
  const assignedRequests = requests.filter(req => 
    req.assignedTo === user?.id && 
    req.status === 'in_progress'
  );
  const completedRequests = requests.filter(req => 
    req.assignedTo === user?.id && 
    req.status === 'completed'
  );

  // Фильтруем запросы по статусу для соответствующих вкладок
  const availableRequests = requests.filter(req => req.status === 'new');

  // Загружаем данные при монтировании
  useEffect(() => {
    // Получаем все запросы
    fetchRequests();
  }, [fetchRequests]);

  // Устанавливаем статистику на основе данных игрока
  const stats: VolunteerStats = {
    completedRequests: completedRequests.length,
    totalRequests: assignedRequests.length + completedRequests.length,
    rating: player?.rating || 0,
    hoursVolunteered: player?.stats?.hoursVolunteered || 0,
    badges: player?.achievements?.map(a => typeof a === 'string' ? a : a.title) || [],
    level: player?.level || 1,
    experience: player?.experience || 0,
    nextLevelExperience: player?.nextLevelExperience || 100
  };

  // Обработчик изменения вкладки
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Функция для отображения статуса запроса с соответствующим цветом
  const renderRequestStatus = (status: string) => {
    switch (status) {
      case 'new':
        return <Chip 
          icon={<PendingIcon />} 
          label="Новый" 
          color="info" 
          size="small" 
        />;
      case 'in_progress':
        return <Chip 
          icon={<ScheduleIcon />} 
          label="В работе" 
          color="warning" 
          size="small" 
        />;
      case 'completed':
        return <Chip 
          icon={<CompletedIcon />} 
          label="Выполнен" 
          color="success" 
          size="small" 
        />;
      default:
        return <Chip 
          label={status} 
          size="small" 
        />;
    }
  };

  // Функция для отображения приоритета запроса
  const renderRequestPriority = (priority: string) => {
    let color = 'default';
    
    switch (priority) {
      case 'low':
        color = 'info';
        break;
      case 'medium':
        color = 'primary';
        break;
      case 'high':
        color = 'warning';
        break;
      case 'urgent':
        color = 'error';
        break;
    }
    
    return <Chip label={getPriorityName(priority)} size="small" color={color as any} variant="outlined" />;
  };

  // Обработчик принятия запроса
  const handleAcceptRequest = async (requestId: number) => {
    await assignRequest(requestId);
    // Обновляем список запросов
    fetchRequests();
  };

  // Обработчик завершения запроса
  const handleCompleteRequest = async (requestId: number) => {
    await completeRequest(requestId);
    // Обновляем список запросов
    fetchRequests();
  };

  // Создаем доступные вкладки
  const tabs = [
    { label: 'Доступные запросы', value: 0, count: availableRequests.length, color: 'info.main' },
    { label: 'Мои запросы', value: 1, count: assignedRequests.length, color: 'warning.main' },
    { label: 'Выполненные', value: 2, count: completedRequests.length, color: 'success.main' },
  ];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 'bold',
            color: theme.palette.primary.main,
            position: 'relative',
            mb: 3,
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
          Личный кабинет волонтера
        </Typography>

        {/* Статистика волонтера */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    src={user?.photoUrl} 
                    sx={{ width: 70, height: 70, mr: 2 }}
                  >
                    {!user?.photoUrl && <PersonIcon fontSize="large" />}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{user?.firstName || 'Волонтер'}</Typography>
                    <Chip 
                      label={`Уровень ${stats.level}`} 
                      size="small" 
                      color="primary" 
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      label={`${stats.rating} ★`} 
                      size="small" 
                      color="secondary"
                    />
                  </Box>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Опыт: {stats.experience || 0} / {stats.nextLevelExperience || 100}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(stats.experience || 0) / (stats.nextLevelExperience || 100) * 100} 
                    sx={{ height: 8, borderRadius: 4, mt: 1, mb: 2 }} 
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Достижения
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {stats.badges && stats.badges.map((badge, index) => (
                    <Chip 
                      key={index} 
                      label={badge} 
                      size="small" 
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Ваша статистика
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <TaskIcon fontSize="large" color="primary" />
                      <Typography variant="h5" sx={{ fontWeight: 'bold', my: 1 }}>
                        {stats.completedRequests}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Выполнено заданий
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <StarIcon fontSize="large" color="primary" />
                      <Typography variant="h5" sx={{ fontWeight: 'bold', my: 1 }}>
                        {stats.rating.toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Рейтинг
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <CalendarIcon fontSize="large" color="primary" />
                      <Typography variant="h5" sx={{ fontWeight: 'bold', my: 1 }}>
                        {stats.hoursVolunteered}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Часов помощи
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <PersonIcon fontSize="large" color="primary" />
                      <Typography variant="h5" sx={{ fontWeight: 'bold', my: 1 }}>
                        {assignedRequests.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Активных заданий
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Вкладки с запросами */}
        <Paper sx={{ mb: 4, borderRadius: 2, boxShadow: 2 }}>
          <Box 
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              backgroundColor: theme.palette.background.paper,
              borderRadius: '8px 8px 0 0',
            }} 
          >
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  minHeight: '64px',
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 'medium',
                }
              }}
            >
              {tabs.map((tab) => (
                <Tab 
                  key={tab.value}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {tab.label}
                      {tab.count > 0 && (
                        <Chip
                          size="small"
                          label={tab.count}
                          sx={{ 
                            ml: 1, 
                            backgroundColor: tab.color,
                            color: 'white',
                            height: 20,
                            minWidth: 20,
                            fontSize: '0.75rem',
                          }}
                        />
                      )}
                    </Box>
                  } 
                />
              ))}
            </Tabs>
          </Box>

          <Box role="tabpanel" hidden={tabValue !== 0} id="tabpanel-0" aria-labelledby="tab-0">
            {tabValue === 0 && (
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Доступные запросы помощи
                  </Typography>
                  <Box>
                    <Tooltip title="Фильтровать">
                      <IconButton>
                        <FilterIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Обновить">
                      <IconButton>
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <TableContainer component={Paper} sx={{ boxShadow: 'none', mb: 3 }}>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Запрос</TableCell>
                        <TableCell>Категория</TableCell>
                        <TableCell>Приоритет</TableCell>
                        <TableCell>Местоположение</TableCell>
                        <TableCell>Статус</TableCell>
                        <TableCell align="right">Действия</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {availableRequests.length > 0 ? (
                        availableRequests.map((request) => (
                          <TableRow key={request.id} hover>
                            <TableCell>
                              <Typography variant="subtitle2">{request.title}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                от {request.requester?.firstName || 'Анонимный пользователь'} • {new Date(request.createdAt).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={getCategoryName(request.category)} size="small" color="primary" variant="outlined" />
                            </TableCell>
                            <TableCell>{renderRequestPriority(request.priority)}</TableCell>
                            <TableCell>{request.location}</TableCell>
                            <TableCell>{renderRequestStatus(request.status)}</TableCell>
                            <TableCell align="right">
                              <Button 
                                variant="contained" 
                                size="small" 
                                onClick={() => handleAcceptRequest(request.id)}
                              >
                                Принять
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography variant="body1" sx={{ py: 2 }}>
                              Нет доступных запросов помощи
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>

          <Box role="tabpanel" hidden={tabValue !== 1} id="tabpanel-1" aria-labelledby="tab-1">
            {tabValue === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Мои запросы
                </Typography>

                <TableContainer component={Paper} sx={{ boxShadow: 'none', mb: 3 }}>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Запрос</TableCell>
                        <TableCell>Категория</TableCell>
                        <TableCell>Местоположение</TableCell>
                        <TableCell>Статус</TableCell>
                        <TableCell align="right">Действия</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assignedRequests.length > 0 ? (
                        assignedRequests.map((request) => (
                          <TableRow key={request.id} hover>
                            <TableCell>
                              <Typography variant="subtitle2">{request.title}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                от {request.requester?.firstName || 'Анонимный пользователь'} • {new Date(request.createdAt).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={getCategoryName(request.category)} size="small" color="primary" variant="outlined" />
                            </TableCell>
                            <TableCell>{request.location}</TableCell>
                            <TableCell>{renderRequestStatus(request.status)}</TableCell>
                            <TableCell align="right">
                              {request.status === 'in_progress' && (
                                <Button 
                                  variant="contained" 
                                  color="success" 
                                  size="small" 
                                  onClick={() => handleCompleteRequest(request.id)}
                                >
                                  Завершить
                                </Button>
                              )}
                              {request.status === 'completed' && (
                                <Chip icon={<CompletedIcon />} label="Выполнено" color="success" size="small" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography variant="body1" sx={{ py: 2 }}>
                              У вас нет активных запросов
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>

          <Box role="tabpanel" hidden={tabValue !== 2} id="tabpanel-2" aria-labelledby="tab-2">
            {tabValue === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Выполненные запросы
                </Typography>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Название</TableCell>
                        <TableCell>Категория</TableCell>
                        <TableCell>Статус</TableCell>
                        <TableCell>Дата выполнения</TableCell>
                        <TableCell align="right">Действия</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {completedRequests.length > 0 ? (
                        completedRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>{request.title}</TableCell>
                            <TableCell>
                              <Chip label={getCategoryName(request.category)} size="small" color="primary" variant="outlined" />
                            </TableCell>
                            <TableCell>{renderRequestStatus(request.status)}</TableCell>
                            <TableCell>
                              {request.completedAt 
                                ? new Date(request.completedAt).toLocaleDateString() 
                                : 'Нет данных'}
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                variant="text"
                                size="small"
                                onClick={() => navigate(`/requests/${request.id}`)}
                              >
                                Детали
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            <Typography>
                              У вас пока нет выполненных запросов.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default VolunteerPage; 