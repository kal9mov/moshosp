import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  useTheme,
  TextField,
  Button,
  Snackbar,
  Alert,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Send as SendIcon
} from '@mui/icons-material';

const ContactsPage: React.FC = () => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({
    name: false,
    email: false,
    subject: false,
    message: false
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Обработчик изменения полей формы
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Сбрасываем ошибку при вводе данных
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
  };

  // Валидация формы
  const validateForm = () => {
    const newErrors = {
      name: formData.name.trim() === '',
      email: !/^\S+@\S+\.\S+$/.test(formData.email),
      subject: formData.subject.trim() === '',
      message: formData.message.trim() === ''
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  // Отправка формы
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Здесь будет логика отправки данных на сервер
      console.log('Форма отправлена:', formData);
      
      // Показываем уведомление об успешной отправке
      setSnackbar({
        open: true,
        message: 'Ваше сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.',
        severity: 'success'
      });
      
      // Сбрасываем форму
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Пожалуйста, заполните все поля корректно.',
        severity: 'error'
      });
    }
  };

  // Закрытие уведомления
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // Контактная информация
  const contactInfo = [
    {
      icon: <PhoneIcon color="primary" />,
      primary: 'Телефон',
      secondary: '+7 (495) 123-45-67'
    },
    {
      icon: <EmailIcon color="primary" />,
      primary: 'Email',
      secondary: 'info@moshosp.ru'
    },
    {
      icon: <LocationIcon color="primary" />,
      primary: 'Адрес',
      secondary: 'г. Москва, ул. Примерная, д. 123'
    },
    {
      icon: <TimeIcon color="primary" />,
      primary: 'Время работы',
      secondary: 'Пн-Пт: 9:00 - 18:00'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
      <Box sx={{ mb: 6 }}>
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
          Связаться с нами
        </Typography>

        <Grid container spacing={4}>
          {/* Контактная информация */}
          <Grid item xs={12} md={5}>
            <Card 
              sx={{ 
                height: '100%',
                borderRadius: 2,
                boxShadow: 3
              }}
            >
              <CardContent>
                <Typography 
                  variant="h5" 
                  component="h2" 
                  sx={{ mb: 3, fontWeight: 'bold' }}
                >
                  Наши контакты
                </Typography>
                
                <List>
                  {contactInfo.map((item, index) => (
                    <React.Fragment key={index}>
                      <ListItem sx={{ py: 2 }}>
                        <ListItemIcon>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={
                            <Typography variant="subtitle1" fontWeight="bold">
                              {item.primary}
                            </Typography>
                          } 
                          secondary={item.secondary} 
                        />
                      </ListItem>
                      {index < contactInfo.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Форма обратной связи */}
          <Grid item xs={12} md={7}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                borderRadius: 2
              }}
            >
              <Typography 
                variant="h5" 
                component="h2" 
                sx={{ mb: 3, fontWeight: 'bold' }}
              >
                Обратная связь
              </Typography>
              
              <Typography variant="body1" paragraph>
                Заполните форму ниже, чтобы отправить нам сообщение. Мы свяжемся с вами в ближайшее время.
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Ваше имя"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      error={errors.name}
                      helperText={errors.name ? 'Пожалуйста, введите ваше имя' : ''}
                      required
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      helperText={errors.email ? 'Пожалуйста, введите корректный email' : ''}
                      required
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Тема"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      error={errors.subject}
                      helperText={errors.subject ? 'Пожалуйста, укажите тему' : ''}
                      required
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Сообщение"
                      name="message"
                      multiline
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      error={errors.message}
                      helperText={errors.message ? 'Пожалуйста, введите ваше сообщение' : ''}
                      required
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      startIcon={<SendIcon />}
                      sx={{ 
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        boxShadow: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: 4
                        }
                      }}
                    >
                      Отправить сообщение
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Карта */}
        <Box sx={{ mt: 6 }}>
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ mb: 3, fontWeight: 'bold' }}
          >
            Наше расположение
          </Typography>
          
          <Paper
            elevation={3}
            sx={{
              p: 2,
              borderRadius: 2,
              height: '400px',
              overflow: 'hidden'
            }}
          >
            {/* Заглушка для карты */}
            <Box 
              sx={{ 
                width: '100%', 
                height: '100%', 
                bgcolor: 'rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="body1" color="text.secondary">
                Здесь будет карта с нашим расположением
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Уведомление об отправке формы */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
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

export default ContactsPage; 