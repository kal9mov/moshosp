import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  useTheme,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardActions,
  SelectChangeEvent
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Sort as SortIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useUserStore } from '../store/userStore';
import { useRequestStore, HelpRequest, FilterParams } from '../store/requestStore';
import { 
  getCategoryName, 
  getStatusName, 
  getPriorityName, 
  formatDate 
} from '../utils/helpers';

const RequestsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { 
    requests, 
    totalCount, 
    isLoading, 
    error,
    fetchRequests,
    limit: storeLimit,
    page: storePage,
    setPage: setStorePage
  } = useRequestStore();

  // Состояние фильтров
  const [filters, setFilters] = useState<FilterParams>({
    status: '',
    category: '',
    priority: '',
    searchTerm: '',
    limit: storeLimit || 10,
    offset: 0
  });

  // Состояние для пагинации
  const [page, setPage] = useState(storePage || 1);

  // Состояние для отображения/скрытия фильтров
  const [showFilters, setShowFilters] = useState(false);

  // Инициализация данных при загрузке страницы
  useEffect(() => {
    const updatedFilters = {
      ...filters,
      offset: (page - 1) * (filters.limit || 10)
    };
    fetchRequests(updatedFilters);
  }, []);

  // Загрузка данных при изменении фильтров или страницы
  useEffect(() => {
    const updatedFilters = {
      ...filters,
      offset: (page - 1) * (filters.limit || 10)
    };
    fetchRequests(updatedFilters);
    // Синхронизируем страницу с store
    setStorePage(page);
  }, [filters, page]);

  // Обработчики изменения фильтров
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchTerm: e.target.value }));
    setPage(1);
  };

  const handleFilterChange = (e: React.ChangeEvent<{ name?: string; value: unknown }> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name as string]: value }));
    setPage(1);
  };

  const handleSortChange = (field: string) => {
    // Здесь можно добавить сортировку при необходимости
    // В данный момент она не реализована в API
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      category: '',
      priority: '',
      searchTerm: '',
      limit: 10,
      offset: 0
    });
    setPage(1);
    setShowFilters(false);
  };

  // Получение цвета статуса
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

  // Получение русского названия приоритета
  const getPriorityName = (priority: string): string => {
    switch (priority) {
      case 'low': return 'Низкий';
      case 'medium': return 'Средний';
      case 'high': return 'Высокий';
      default: return priority;
    }
  };

  // Получение цвета приоритета
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'low': return theme.palette.info.light;
      case 'medium': return theme.palette.info.main;
      case 'high': return theme.palette.warning.main;
      case 'urgent': return theme.palette.error.main;
      default: return theme.palette.info.main;
    }
  };

  // Функция для определения, может ли пользователь создавать запросы
  const canCreateRequest = user && user.id;

  // Отфильтрованные запросы с учетом поиска, статуса и приоритета
  const filteredRequests = requests.filter(request => {
    // Фильтр по поиску
    const matchesSearch = !filters.searchTerm || (
      request.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(filters.searchTerm.toLowerCase())
    );
    
    // Фильтр по статусу
    const matchesStatus = !filters.status || request.status === filters.status;
    
    // Фильтр по приоритету
    const matchesPriority = !filters.priority || request.priority === filters.priority;
    
    // Фильтр по категории
    const matchesCategory = !filters.category || request.category === filters.category;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Запросы о помощи
        </Typography>
        {canCreateRequest && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/new-request')}
          >
            Создать запрос
          </Button>
        )}
      </Box>

      {/* Строка поиска и фильтры */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Поиск запросов..."
              value={filters.searchTerm || ''}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: filters.searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        setFilters(prev => ({ ...prev, searchTerm: '' }));
                        setPage(1);
                      }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <Button
              fullWidth
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              variant={showFilters ? "contained" : "outlined"}
            >
              Фильтры
            </Button>
          </Grid>
          <Grid item xs={6} md={3}>
            <Button
              fullWidth
              startIcon={<SortIcon />}
              variant="outlined"
              onClick={() => handleSortChange('createdAt')}
            >
              По дате
            </Button>
          </Grid>
        </Grid>

        {/* Расширенные фильтры */}
        {showFilters && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Статус</InputLabel>
                  <Select
                    name="status"
                    value={filters.status || ''}
                    onChange={handleFilterChange}
                    label="Статус"
                  >
                    <MenuItem value="">Все статусы</MenuItem>
                    <MenuItem value="new">Новые</MenuItem>
                    <MenuItem value="in_progress">В работе</MenuItem>
                    <MenuItem value="completed">Выполненные</MenuItem>
                    <MenuItem value="cancelled">Отмененные</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Категория</InputLabel>
                  <Select
                    name="category"
                    value={filters.category || ''}
                    onChange={handleFilterChange}
                    label="Категория"
                  >
                    <MenuItem value="">Все категории</MenuItem>
                    <MenuItem value="medicine">Медицинская помощь</MenuItem>
                    <MenuItem value="food">Продукты питания</MenuItem>
                    <MenuItem value="household">Бытовая помощь</MenuItem>
                    <MenuItem value="transport">Транспорт</MenuItem>
                    <MenuItem value="translate">Перевод</MenuItem>
                    <MenuItem value="tech">Техническая помощь</MenuItem>
                    <MenuItem value="paperwork">Помощь с документами</MenuItem>
                    <MenuItem value="basic">Базовые потребности</MenuItem>
                    <MenuItem value="escort">Сопровождение</MenuItem>
                    <MenuItem value="shopping">Покупки</MenuItem>
                    <MenuItem value="other">Другое</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Приоритет</InputLabel>
                  <Select
                    name="priority"
                    value={filters.priority || ''}
                    onChange={handleFilterChange}
                    label="Приоритет"
                  >
                    <MenuItem value="">Все приоритеты</MenuItem>
                    <MenuItem value="low">Низкий</MenuItem>
                    <MenuItem value="medium">Средний</MenuItem>
                    <MenuItem value="high">Высокий</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={handleClearFilters} startIcon={<ClearIcon />}>
                  Сбросить фильтры
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Отображение ошибки */}
      {!isLoading && error && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: theme.palette.error.light }}>
          <Typography color="error">
            Ошибка при загрузке запросов: {error}
          </Typography>
        </Paper>
      )}

      {/* Список запросов */}
      {!isLoading && !error && (
        <>
          {filteredRequests.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6">
                Запросы не найдены
              </Typography>
              <Typography color="textSecondary" sx={{ mt: 1 }}>
                {filters.searchTerm || filters.status || filters.category || filters.priority
                  ? 'Попробуйте изменить параметры фильтрации'
                  : 'В системе пока нет запросов о помощи'}
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {filteredRequests.map((request) => (
                <Grid item xs={12} sm={6} md={4} key={request.id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                      } 
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="h2" sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          maxHeight: '3em' 
                        }}>
                          {request.title}
                        </Typography>
                        <Chip 
                          label={getStatusName(request.status)} 
                          size="small"
                          sx={{ 
                            backgroundColor: getStatusColor(request.status),
                            color: 'white',
                            ml: 1,
                            fontWeight: 'bold'
                          }}
                        />
                      </Box>
                      <Typography 
                        color="textSecondary" 
                        sx={{ 
                          mb: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {request.description}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {request.category && (
                          <Chip 
                            label={getCategoryName(request.category)} 
                            size="small" 
                            variant="outlined" 
                            color="primary"
                          />
                        )}
                        {request.priority && (
                          <Chip 
                            label={getPriorityName(request.priority)} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              borderColor: getPriorityColor(request.priority),
                              color: getPriorityColor(request.priority)
                            }}
                          />
                        )}
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => navigate(`/requests/${request.id}`)}
                      >
                        Подробнее
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Пагинация */}
      {totalCount > (filters.limit || 10) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={Math.ceil(totalCount / (filters.limit || 10))}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Container>
  );
};

export default RequestsPage;