import React, { useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MUIThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { useThemeStore } from '../lib/store';

// Создаем светлую и темную темы
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { mode, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  // Проверяем предпочтения системы при монтировании компонента
  useEffect(() => {
    setMounted(true);
    
    // Проверяем системные предпочтения темы, если пользователь еще не выбрал
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDarkMode && !localStorage.getItem('theme-storage')) {
      setTheme('dark');
    }
  }, [setTheme]);

  // Нужно предотвратить проблемы с SSR и гидратацией, рендерим только после монтирования
  if (!mounted) {
    // Возвращаем пустой div, чтобы избежать проблем с гидратацией
    return <div style={{ visibility: 'hidden' }} />;
  }

  return (
    <MUIThemeProvider theme={mode === 'light' ? lightTheme : darkTheme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}; 