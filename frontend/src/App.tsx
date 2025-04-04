import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, CircularProgress } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './styles/theme';
import { useUserStore } from './store/userStore';
import { useRequestStore } from './store/requestStore';
import { useGameStore } from './store/gameStore';

// Компоненты
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import RequestsPage from './pages/RequestsPage';
import RequestFormPage from './pages/RequestFormPage';
import VolunteerPage from './pages/VolunteerPage';
import GamePage from './pages/GamePage';

// Защищенный маршрут
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, checkSession, isLoading, user } = useUserStore();
  const { fetchRequests, fetchUserRequests } = useRequestStore();
  const { syncGameDataWithBackend } = useGameStore();

  useEffect(() => {
    // Проверяем сессию при монтировании компонента
    checkSession();
  }, [checkSession]);

  // При успешной аутентификации загружаем данные с бэкенда
  useEffect(() => {
    if (isAuthenticated && user) {
      // Загружаем запросы пользователя
      fetchUserRequests();
      
      // Загружаем все запросы (для просмотра и волонтеров)
      fetchRequests();
      
      // Синхронизируем игровые данные с бэкендом
      syncGameDataWithBackend();
    }
  }, [isAuthenticated, user, fetchRequests, fetchUserRequests, syncGameDataWithBackend]);

  // Пока проверяем аутентификацию, показываем индикатор загрузки
  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Если не аутентифицирован, перенаправляем на страницу входа
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Иначе показываем защищенный контент
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          <Route path="/requests" element={
            <ProtectedRoute>
              <RequestsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/new-request" element={
            <ProtectedRoute>
              <RequestFormPage />
            </ProtectedRoute>
          } />
          
          <Route path="/volunteer" element={
            <ProtectedRoute>
              <VolunteerPage />
            </ProtectedRoute>
          } />
          
          <Route path="/game" element={
            <ProtectedRoute>
              <GamePage />
            </ProtectedRoute>
          } />
          
          {/* Перенаправление для неизвестных маршрутов */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;