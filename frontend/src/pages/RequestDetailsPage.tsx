import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Paper, Box, Grid, Chip, Button, 
  Divider, Avatar, CircularProgress, Dialog, DialogActions, 
  DialogContent, DialogContentText, DialogTitle, TextField, Rating
} from '@mui/material';
import { 
  AccessTime as AccessTimeIcon,
  LocationOn as LocationIcon, 
  Info as InfoIcon,
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  DoneAll as DoneAllIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { formatDistance } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useRequestStore } from '../store/requestStore';
import type { HelpRequest } from '../lib/api';
import { useUserStore } from '../store/userStore';

const RequestDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const navigate = useNavigate();

  // Состояния для диалоговых окон
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  // Получаем данные из хранилищ
  const { 
    currentRequest, 
    isLoading, 
    error, 
    fetchRequestById,
    updateRequest,
    assignRequest: assignRequestStore,
    completeRequest: completeRequestStore
  } = useRequestStore();
  const { user } = useUserStore();

  // Загружаем данные запроса при монтировании компонента
  useEffect(() => {
    if (id) {
      fetchRequestById(parseInt(id, 10));
    }
  }, [id, fetchRequestById]);

  // Проверка прав пользователя для различных действий
  const canDelete = currentRequest && user && (
    currentRequest.requesterId === user.id || 
    user.role === 'admin'
  );

  const canEdit = currentRequest && user && (
    currentRequest.requesterId === user.id || 
    user.role === 'admin'
  );

  const canAssign = currentRequest && user && 
    (user.role === 'volunteer' || user.role === 'admin') && 
    currentRequest.status === 'new';

  const canComplete = currentRequest && user && 
    (currentRequest.assignedTo === user.id) && 
    currentRequest.status === 'in_progress';

  // Определение цвета статуса
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'new': return theme.palette.info.main;
      case 'in_progress': return theme.palette.warning.main;
      case 'completed': return theme.palette.success.main;
      case 'cancelled': return theme.palette.error.main;
      default: return theme.palette.info.main;
    }
  };

  // Получение русского названия статуса
  const getStatusName = (status: string): string => {
    switch (status) {
      case 'new': return 'Новый';
      case 'in_progress': return 'В работе';
      case 'completed': return 'Выполнен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  // Получение цвета приоритета
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'low': return theme.palette.info.light;
      case 'medium': return theme.palette.info.main;
      case 'high': return theme.palette.warning.main;
      default: return theme.palette.info.main;
    }
  };

  // Получение русского названия приоритета
  const getPriorityName = (priority: string): string => {
    switch (priority) {
      case 'low': return 'Низкий';
      case 'medium': return 'Средний';
      case 'high': return 'Высокий';
      default: return priority;
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string): string => {
    return formatDistance(
      new Date(dateString),
      new Date(),
      { addSuffix: true, locale: ru }
    );
  };

  // Обработчики действий
  const handleBack = () => {
    navigate('/requests');
  };

  const handleEdit = () => {
    navigate(`/requests/${id}/edit`);
  };

  const handleDeleteConfirm = async () => {
    if (id && currentRequest) {
      const success = await updateRequest(parseInt(id, 10), { status: 'cancelled' });
      if (success) {
        navigate('/requests');
      }
      setDeleteDialogOpen(false);
    }
  };

  const handleAssign = async () => {
    if (id) {
      await assignRequestStore(parseInt(id, 10));
    }
  };

  const handleCompleteConfirm = async () => {
    if (id) {
      await completeRequestStore(parseInt(id, 10));
      setCompleteDialogOpen(false);
      setFeedbackDialogOpen(true);
    }
  };

  const handleFeedbackSubmit = () => {
    // В реальном приложении здесь был бы запрос к API для отправки отзыва
    console.log('Отзыв отправлен:', { rating: feedbackRating, comment: feedbackComment });
    setFeedbackDialogOpen(false);
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" color="error">
            Ошибка: {error}
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mt: 2 }}
          >
            Вернуться к списку
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!currentRequest) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">
            Запрос не найден
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mt: 2 }}
          >
            Вернуться к списку
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        {/* Шапка запроса */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
            Вернуться к списку
          </Button>
          <Box>
            {canEdit && (
              <Button
                startIcon={<EditIcon />}
                onClick={handleEdit}
                sx={{ mr: 1 }}
              >
                Редактировать
              </Button>
            )}
            {canDelete && (
              <Button
                startIcon={<DeleteIcon />}
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Удалить
              </Button>
            )}
          </Box>
        </Box>

        {/* Заголовок и статус */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {currentRequest.title}
          </Typography>
          <Chip 
            label={getStatusName(currentRequest.status)} 
            sx={{ 
              backgroundColor: getStatusColor(currentRequest.status),
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Box>

        {/* Информация о запросе */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Описание
            </Typography>
            <Typography paragraph>
              {currentRequest.description}
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Детали
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CategoryIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="body1">
                      Категория: {currentRequest.category}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <InfoIcon sx={{ mr: 1, color: getPriorityColor(currentRequest.priority) }} />
                    <Typography variant="body1">
                      Приоритет: {getPriorityName(currentRequest.priority)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="body1">
                      Адрес: {currentRequest.location || 'Не указан'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccessTimeIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="body1">
                      Создан: {formatDate(currentRequest.createdAt)}
                    </Typography>
                  </Box>
                </Grid>
                {currentRequest.completedAt && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CheckCircleIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                      <Typography variant="body1">
                        Выполнен: {formatDate(currentRequest.completedAt)}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, backgroundColor: theme.palette.background.default }}>
              <Typography variant="h6" gutterBottom>
                Создатель запроса
              </Typography>
              {currentRequest.requester ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    src={currentRequest.requester.photoUrl} 
                    alt={currentRequest.requester.firstName}
                    sx={{ mr: 2 }}
                  >
                    {currentRequest.requester.firstName.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1">
                      {`${currentRequest.requester.firstName} ${currentRequest.requester.lastName}`}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      @{currentRequest.requester.username}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Typography variant="body2" color="textSecondary">
                    Информация о создателе недоступна
                  </Typography>
                </Box>
              )}

              {/* Информация о волонтере */}
              {currentRequest.status !== 'new' && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Волонтер
                  </Typography>
                  {currentRequest.volunteer ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        src={currentRequest.volunteer.photoUrl} 
                        alt={currentRequest.volunteer.firstName}
                        sx={{ mr: 2 }}
                      >
                        {currentRequest.volunteer.firstName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1">
                          {`${currentRequest.volunteer.firstName} ${currentRequest.volunteer.lastName}`}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          @{currentRequest.volunteer.username}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2 }}>
                        <PersonIcon />
                      </Avatar>
                      <Typography variant="body2" color="textSecondary">
                        Информация о волонтере недоступна
                      </Typography>
                    </Box>
                  )}
                </>
              )}

              {/* Кнопки действий */}
              <Box sx={{ mt: 3 }}>
                {canAssign && (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth 
                    startIcon={<AssignmentIcon />}
                    onClick={handleAssign}
                    sx={{ mb: 1 }}
                  >
                    Взять в работу
                  </Button>
                )}
                {canComplete && (
                  <Button 
                    variant="contained" 
                    color="success" 
                    fullWidth 
                    startIcon={<DoneAllIcon />}
                    onClick={() => setCompleteDialogOpen(true)}
                  >
                    Отметить как выполненный
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Диалог подтверждения удаления */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Удаление запроса</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить запрос "{currentRequest.title}"? Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог подтверждения завершения */}
      <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)}>
        <DialogTitle>Завершение запроса</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите отметить запрос "{currentRequest.title}" как выполненный?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleCompleteConfirm} color="success" autoFocus>
            Выполнено
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог отзыва */}
      <Dialog open={feedbackDialogOpen} onClose={() => setFeedbackDialogOpen(false)}>
        <DialogTitle>Оценка выполнения</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Пожалуйста, оцените работу волонтера по выполнению запроса:
          </DialogContentText>
          <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
            <Typography component="legend">Оценка:</Typography>
            <Rating
              name="feedback-rating"
              value={feedbackRating}
              onChange={(event, newValue) => {
                setFeedbackRating(newValue || 5);
              }}
            />
          </Box>
          <TextField
            autoFocus
            margin="dense"
            id="comment"
            label="Комментарий"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialogOpen(false)}>Пропустить</Button>
          <Button onClick={handleFeedbackSubmit} color="primary">
            Отправить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RequestDetailsPage; 