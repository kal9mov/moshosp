import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid,
  IconButton,
  useTheme
} from '@mui/material';
import { Link } from 'react-router-dom';
import { 
  Telegram as TelegramIcon,
  Mail as MailIcon, 
  Phone as PhoneIcon,
  GitHub as GitHubIcon
} from '@mui/icons-material';

const Footer: React.FC = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 3, 
        mt: 'auto',
        backgroundColor: theme.palette.primary.main,
        color: 'white'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              МосПомощь
            </Typography>
            <Typography variant="body2">
              Платформа взаимопомощи для жителей Москвы
            </Typography>
            <Box sx={{ mt: 2 }}>
              <IconButton color="inherit" size="small">
                <TelegramIcon />
              </IconButton>
              <IconButton color="inherit" size="small">
                <MailIcon />
              </IconButton>
              <IconButton color="inherit" size="small">
                <PhoneIcon />
              </IconButton>
              <IconButton color="inherit" size="small">
                <GitHubIcon />
              </IconButton>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Ссылки
            </Typography>
            <Link to="/about" style={{ color: 'inherit', display: 'block', marginBottom: '8px', textDecoration: 'none' }}>
              О проекте
            </Link>
            <Link to="/contacts" style={{ color: 'inherit', display: 'block', marginBottom: '8px', textDecoration: 'none' }}>
              Контакты
            </Link>
            <Link to="/game" style={{ color: 'inherit', display: 'block', marginBottom: '8px', textDecoration: 'none' }}>
              Игровая платформа
            </Link>
            <Link to="/requests" style={{ color: 'inherit', display: 'block', textDecoration: 'none' }}>
              Запросы помощи
            </Link>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Контакты
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Телефон: +7 (495) 123-45-67
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Email: info@moshelp.ru
            </Typography>
            <Typography variant="body2">
              Адрес: г. Москва, ул. Тверская, 1
            </Typography>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <Typography variant="body2" align="center">
            © {currentYear} МосПомощь. Все права защищены.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
