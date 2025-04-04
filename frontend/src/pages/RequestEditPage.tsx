import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useRequestStore } from '../store/requestStore';
import type { HelpRequest } from '../lib/api';
import { useUserStore } from '../store/userStore';

interface FormData {
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high";
  location: string;
}

interface RequestUpdateParams {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high";
  location: string;
}

const RequestEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewRequest = !id;

  // Состояния формы
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    location: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Получаем данные из хранилищ
  const { 
    currentRequest, 
    isLoading, 
    error
  } = useRequestStore();
  const { user } = useUserStore();

  // Загружаем данные запроса при монтировании компонента (для режима редактирования)
  useEffect(() => {
    if (!isNewRequest && id) {
      fetchRequest(parseInt(id));
    }
  }, [id, isNewRequest]);

  // Заполняем форму данными из запроса (для режима редактирования)
  useEffect(() => {
    if (!isNewRequest && currentRequest) {
      setFormData({
        title: currentRequest.title,
        description: currentRequest.description,
        category: currentRequest.category,
        priority: currentRequest.priority,
        location: currentRequest.location || '',
      });
    }
  }, [currentRequest, isNewRequest]);

  // Проверка прав на редактирование
  const canEdit = !isNewRequest && currentRequest && user && (
    currentRequest.requesterId === user.id || 
    user.role === 'admin'
  );

  // Если нет прав на редактирование, перенаправляем на список запросов
  useEffect(() => {
    if (!isNewRequest && currentRequest && user && !canEdit) {
      navigate('/requests');
      setSnackbar({
        open: true,
        message: 'У вас нет прав на редактирование этого запроса',
        severity: 'error',
      });
    }
  }, [currentRequest, user, canEdit, navigate, isNewRequest]);

  // Обработчики изменения полей формы
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value,
    });

    // Очищаем ошибку поля при изменении
    if (errors[name as string]) {
      setErrors({
        ...errors,
        [name as string]: '',
      });
    }
  };

  // Валидация формы
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название запроса обязательно';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Название должно содержать минимум 5 символов';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Описание запроса обязательно';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Описание должно содержать минимум 20 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let success = false;

      if (isNewRequest) {
        // Создание нового запроса
        success = await createRequest({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          location: formData.location,
        });
      } else if (id) {
        // Обновление существующего запроса
        const updateData: RequestUpdateParams = {
          id: parseInt(id),
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority as "low" | "medium" | "high",
          location: formData.location,
        };
        success = await updateRequest(id, updateData);
      }

      if (success) {
        setSnackbar({
          open: true,
          message: isNewRequest 
            ? 'Запрос успешно создан' 
            : 'Запрос успешно обновлен',
          severity: 'success',
        });
        // Перенаправляем на страницу запроса или список запросов
        navigate(isNewRequest ? '/requests' : `/requests/${id}`);
      } else {
        setSnackbar({
          open: true,
          message: 'Произошла ошибка при сохранении запроса',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Error saving request:', error);
      setSnackbar({
        open: true,
        message: 'Произошла ошибка при сохранении запроса',
        severity: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обработчик отмены
  const handleCancel = () => {
    navigate(isNewRequest ? '/requests' : `/requests/${id}`);
  };

  // Обработчик закрытия snackbar
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // Заглушки для API функций
  const fetchRequest = async (id: number) => {
    console.log(`Fetching request with id: ${id}`);
    // В реальном приложении здесь будет API-запрос
  };
  
  const createRequest = async (data: any): Promise<boolean> => {
    console.log('Creating request with data:', data);
    // В реальном приложении здесь будет API-запрос
    return true;
  };
  
  const updateRequest = async (id: string, data: any): Promise<boolean> => {
    console.log(`Updating request ${id} with data:`, data);
    // В реальном приложении здесь будет API-запрос
    return true;
  };

  // Отображение загрузки
  if (!isNewRequest && isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Отображение ошибки
  if (!isNewRequest && error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" color="error">
            Ошибка: {error}
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/requests')}
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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleCancel}
            sx={{ mr: 2 }}
          >
            Назад
          </Button>
          <Typography variant="h4" component="h1">
            {isNewRequest ? 'Создание запроса' : 'Редактирование запроса'}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Название запроса"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={!!errors.title}
                helperText={errors.title}
                required
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Описание"
                name="description"
                value={formData.description}
                onChange={handleChange}
                error={!!errors.description}
                helperText={errors.description}
                required
                multiline
                rows={4}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Категория</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Категория"
                >
                  <MenuItem value="medicine">Медицинская помощь</MenuItem>
                  <MenuItem value="food">Продукты питания</MenuItem>
                  <MenuItem value="household">Бытовая помощь</MenuItem>
                  <MenuItem value="transport">Транспорт</MenuItem>
                  <MenuItem value="other">Другое</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Приоритет</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  label="Приоритет"
                >
                  <MenuItem value="low">Низкий</MenuItem>
                  <MenuItem value="medium">Средний</MenuItem>
                  <MenuItem value="high">Высокий</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Адрес (необязательно)"
                name="location"
                value={formData.location}
                onChange={handleChange}
                variant="outlined"
                placeholder="Укажите адрес, где требуется помощь"
              />
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} />
                ) : isNewRequest ? (
                  'Создать запрос'
                ) : (
                  'Сохранить изменения'
                )}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RequestEditPage; 