import React, { ReactNode, useState, useEffect } from 'react';
import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import Header from './Header';
import Footer from './Footer';
import Sidebar from '../Sidebar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(false); // Начинаем с закрытого сайдбара по умолчанию

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Обработка свайпа на мобильных устройствах
  const iOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Закрываем сайдбар при изменении размера окна на мобильный
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      closeSidebar();
    }
  }, [isMobile]);

  // Обработчик для закрытия сайдбара при клике на основное содержимое (на мобильных устройствах)
  const handleContentClick = () => {
    if (isMobile && sidebarOpen) {
      closeSidebar();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header toggleSidebar={toggleSidebar} />
      
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Боковая панель */}
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />
        
        {/* Основное содержимое */}
        <Box
          component="main"
          onClick={handleContentClick}
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            width: '100%',
            transition: theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            ml: { md: '240px' }, // Фиксированный отступ для ПК версии
          }}
        >
          <Container maxWidth="lg" sx={{ pt: { xs: 2, sm: 4 }, pb: { xs: 6, sm: 8 } }}>
            {children}
          </Container>
        </Box>
      </Box>
      
      <Footer />
    </Box>
  );
};

export default Layout; 