import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Badge,
  Avatar,
  Tooltip,
  useMediaQuery,
  Divider,
  ListItemIcon,
  Switch
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
  AccountCircle,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useThemeStore, useAuthStore } from '../../lib/store';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '@mui/material/styles';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { user: userStoreUser } = useUserStore();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: 'primary.main',
        color: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="открыть меню"
          edge="start"
          onClick={toggleSidebar}
          sx={{ 
            mr: 2,
            padding: isMobile ? 1 : 1.2,
          }}
          size="large"
        >
          <MenuIcon fontSize="medium" />
        </IconButton>
        
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 'bold',
          }}
        >
          МосПомощь
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {!isMobile && (
            <>
              <IconButton 
                color="inherit"
                onClick={() => navigate('/help-request')}
                size="large"
              >
                <Badge badgeContent={0} color="error">
                  <HelpIcon />
                </Badge>
              </IconButton>
              
              <IconButton 
                color="inherit"
                onClick={() => navigate('/notifications')}
                size="large"
              >
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </>
          )}
          
          {isAuthenticated ? (
            <IconButton 
              sx={{ ml: 1 }}
              onClick={() => navigate('/profile')}
              size="large"
            >
              <Avatar 
                src={userStoreUser?.photoUrl} 
                alt={userStoreUser?.firstName}
                sx={{ width: 35, height: 35 }}
              >
                {!userStoreUser?.photoUrl && (userStoreUser?.firstName?.[0] || 'U')}
              </Avatar>
            </IconButton>
          ) : (
            <Button 
              variant="contained" 
              color="secondary" 
              size="small"
              onClick={() => navigate('/login')}
              sx={{ ml: 1 }}
            >
              Войти
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 