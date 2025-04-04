import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Button,
  useTheme,
  useMediaQuery,
  IconButton
} from '@mui/material';
import {
  Home as HomeIcon,
  Person as PersonIcon,
  ListAlt as ListAltIcon,
  Add as AddIcon,
  Favorite as FavoriteIcon,
  SportsEsports as GameIcon,
  Help as HelpIcon,
  ExitToApp as LogoutIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useUserStore } from '../store/userStore';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUserStore();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const drawerWidth = 240;
  
  // Отладочные сообщения
  console.log('Sidebar props:', { open, isMobile });
  
  const menuItems = [
    { text: 'Главная', icon: <HomeIcon />, path: '/' },
    { text: 'Мой профиль', icon: <PersonIcon />, path: '/profile' },
    { text: 'Запросы помощи', icon: <ListAltIcon />, path: '/requests' },
    { text: 'Новый запрос', icon: <AddIcon />, path: '/new-request' },
    { text: 'Волонтёрская панель', icon: <FavoriteIcon />, path: '/volunteer' },
    { text: 'Игровая платформа', icon: <GameIcon />, path: '/game' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onClose) onClose();
  };

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? open : true} // На ПК всегда открыт
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: isMobile ? { xs: '85%', sm: 280 } : drawerWidth,
          boxSizing: 'border-box',
          border: 'none',
          boxShadow: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.palette.primary.main,
        color: 'white'
      }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          МосПомощь
        </Typography>
        {isMobile && onClose && (
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.15)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {user && (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={user.photoUrl} 
            alt={user.firstName}
            sx={{ width: 40, height: 40, mr: 2 }}
          />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.role === 'volunteer' ? 'Волонтёр' : 'Пользователь'}
            </Typography>
          </Box>
        </Box>
      )}

      <Divider />
      
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton 
                onClick={() => handleNavigate(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.action.selected,
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  color: location.pathname === item.path 
                    ? theme.palette.primary.main 
                    : 'inherit' 
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    fontWeight: location.pathname === item.path ? 'medium' : 'normal'
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider />
        
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNavigate('/help')}>
              <ListItemIcon>
                <HelpIcon />
              </ListItemIcon>
              <ListItemText primary="Помощь" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding sx={{ mb: isMobile ? 0 : 2 }}>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Выйти" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
      
      {/* Кнопка закрытия для мобильных устройств */}
      {isMobile && onClose && (
        <Box sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider',
          mt: 'auto'
        }}>
          <ListItemButton 
            onClick={onClose}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: 'white',
              borderRadius: 1,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <CloseIcon sx={{ mr: 1 }} />
            <Typography>Закрыть меню</Typography>
          </ListItemButton>
        </Box>
      )}
    </Drawer>
  );
};

export default Sidebar; 