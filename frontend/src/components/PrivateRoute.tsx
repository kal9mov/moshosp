import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { Box, CircularProgress } from '@mui/material';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'volunteer' | 'admin';
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  requiredRole
}) => {
  const { isAuthenticated, isLoading, user } = useUserStore();
  const location = useLocation();

  // Пока проверяем аутентификацию, показываем индикатор загрузки
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Если пользователь не аутентифицирован, перенаправляем на страницу логина
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Если требуется определенная роль и у пользователя ее нет
  if (requiredRole && user?.role !== requiredRole) {
    // Перенаправляем на домашнюю страницу или страницу с сообщением о недостаточных правах
    return <Navigate to="/" replace />;
  }

  // Если все проверки пройдены, отображаем защищенный контент
  return <>{children}</>;
};

export default PrivateRoute; 