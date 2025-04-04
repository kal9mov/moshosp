import React, { useEffect, useRef } from 'react';
import { Button, Typography, Box, CircularProgress } from '@mui/material';
import TelegramIcon from '@mui/icons-material/Telegram';
import { useUserStore } from '../store/userStore';
import { TelegramAuthData } from '../lib/api';

declare global {
  interface Window {
    TelegramLoginWidget: {
      dataOnauth: (user: TelegramAuthData) => void;
    };
  }
}

interface TelegramLoginButtonProps {
  botName: string;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: 'write' | undefined;
  usePic?: boolean;
  lang?: string;
  widgetVersion?: number;
  className?: string;
  onAuthCallback?: (user: TelegramAuthData) => void;
}

const TelegramLoginButton: React.FC<TelegramLoginButtonProps> = ({
  botName,
  buttonSize = 'large',
  cornerRadius = 4,
  requestAccess,
  usePic = false,
  lang = 'ru',
  widgetVersion = 19,
  className,
  onAuthCallback,
}) => {
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { login, isLoading, error } = useUserStore();

  useEffect(() => {
    // Если скрипт уже загружен, не добавляем его снова
    if (document.getElementById('telegram-login-script')) {
      return;
    }

    // Показываем текущий домен для диагностики
    console.log('Текущий домен для Telegram Login:', window.location.origin);
    console.log('Убедитесь, что этот домен добавлен в настройках бота в BotFather');

    // Функция для обработки авторизации
    window.TelegramLoginWidget = {
      dataOnauth: (user: TelegramAuthData) => {
        // Вызываем функцию логина из хранилища
        login(user);
        
        // Если есть колбэк, вызываем его
        if (onAuthCallback) {
          onAuthCallback(user);
        }
      },
    };

    // Создаем и добавляем скрипт
    const script = document.createElement('script');
    script.id = 'telegram-login-script';
    script.src = `https://telegram.org/js/telegram-widget.js?${widgetVersion}`;
    script.async = true;
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-radius', cornerRadius.toString());
    script.setAttribute('data-onauth', 'TelegramLoginWidget.dataOnauth(user)');
    script.setAttribute('data-lang', lang);
    
    if (requestAccess) {
      script.setAttribute('data-request-access', requestAccess);
    }
    if (usePic) {
      script.setAttribute('data-userpic', 'true');
    }

    // Добавляем скрипт в контейнер
    if (containerRef.current) {
      containerRef.current.appendChild(script);
      scriptRef.current = script;
    }

    // Удаляем скрипт и очищаем глобальные данные
    if (containerRef.current && scriptRef.current) {
      containerRef.current.removeChild(scriptRef.current);
    }
    
    // Используем правильный синтаксис для удаления свойства из window
    if ('TelegramLoginWidget' in window) {
      (window as any).TelegramLoginWidget = undefined;
    }
  }, [botName, buttonSize, cornerRadius, lang, requestAccess, usePic, widgetVersion, login, onAuthCallback]);

  // Если официальная кнопка не загрузилась, показываем собственную
  const handleManualLogin = () => {
    // Здесь можно реализовать переход на страницу авторизации Telegram
    window.open(`https://oauth.telegram.org/auth?bot_id=${botName}`, '_blank');
  };

  return (
    <Box ref={containerRef} className={className}>
      {isLoading && <CircularProgress size={24} />}
      
      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
      
      {/* Резервная кнопка */}
      {!scriptRef.current && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<TelegramIcon />}
          onClick={handleManualLogin}
          disabled={isLoading}
          sx={{ mt: 2 }}
        >
          Войти через Telegram
        </Button>
      )}
    </Box>
  );
};

export default TelegramLoginButton; 