import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  SelectChangeEvent,
  FormHelperText,
} from '@mui/material';
import { useRequestStore, RequestCreateParams } from '../store/requestStore';
import { useUserStore } from '../store/userStore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

interface HelpRequestFormProps {
  onSuccess?: () => void;
}

const HelpRequestForm: React.FC<HelpRequestFormProps> = ({ onSuccess }) => {
  const { createRequest, isLoading } = useRequestStore();
  const { user } = useUserStore();
  const navigate = useNavigate();
  
  // Состояние формы
  const [formData, setFormData] = useState<RequestCreateParams>({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    location: '',
    status: 'new',
  });
  
  // Ошибки валидации
  const [errors, setErrors] = useState<{
    title: boolean;
    description: boolean;
    category: boolean;
    location: boolean;
  }>({
    title: false,
    description: false,
    category: false,
    location: false,
  });

  // Обработка изменений в форме
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Сбрасываем ошибку при изменении поля
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: false,
      });
    }
  };

  // Обработка изменения категории и приоритета
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Сбрасываем ошибку при изменении поля
    if (name === 'category' && errors.category) {
      setErrors({
        ...errors,
        category: false,
      });
    }
  };

  // Валидация формы
  const validateForm = () => {
    const newErrors = {
      title: !formData.title.trim(),
      description: !formData.description.trim() || formData.description.length < 10,
      category: !formData.category.trim(),
      location: !formData.location.trim(),
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const result = await createRequest(formData);
      
      if (result) {
        toast.success('Заявка успешно отправлена!');
        
        if (onSuccess) onSuccess();
        else navigate('/requests');
        
        setFormData({
          title: '',
          description: '',
          category: '',
          priority: 'medium',
          location: '',
          status: 'new',
        });
        
        setErrors({
          title: false,
          description: false,
          category: false,
          location: false,
        });
      }
    } else {
      toast.error('Пожалуйста, заполните все поля корректно');
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>
        Запросить помощь
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Заполните форму, и наши волонтеры свяжутся с вами в ближайшее время
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          id="title"
          label="Заголовок запроса"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          helperText={errors.title ? 'Укажите заголовок запроса' : ''}
        />
        
        <FormControl 
          fullWidth 
          margin="normal" 
          required
          error={errors.category}
        >
          <InputLabel id="category-label">Категория запроса</InputLabel>
          <Select
            labelId="category-label"
            id="category"
            name="category"
            value={formData.category}
            label="Категория запроса"
            onChange={handleSelectChange}
          >
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
          {errors.category && <FormHelperText>Выберите категорию запроса</FormHelperText>}
        </FormControl>
        
        <FormControl 
          fullWidth 
          margin="normal" 
        >
          <InputLabel id="priority-label">Приоритет</InputLabel>
          <Select
            labelId="priority-label"
            id="priority"
            name="priority"
            value={formData.priority}
            label="Приоритет"
            onChange={handleSelectChange}
          >
            <MenuItem value="low">Низкий</MenuItem>
            <MenuItem value="medium">Средний</MenuItem>
            <MenuItem value="high">Высокий</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          margin="normal"
          required
          fullWidth
          id="location"
          label="Местоположение"
          name="location"
          placeholder="Например: 'Палата 302' или 'Холл 1 этажа'"
          value={formData.location}
          onChange={handleChange}
          error={errors.location}
          helperText={errors.location ? 'Укажите ваше местоположение' : ''}
        />
        
        <TextField
          margin="normal"
          required
          fullWidth
          id="description"
          label="Опишите ваш запрос"
          name="description"
          multiline
          rows={4}
          value={formData.description}
          onChange={handleChange}
          error={errors.description}
          helperText={errors.description ? 'Опишите ваш запрос (минимум 10 символов)' : ''}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={isLoading}
        >
          {isLoading ? 'Отправка...' : 'Отправить запрос'}
        </Button>
      </Box>
    </Paper>
  );
};

export default HelpRequestForm; 