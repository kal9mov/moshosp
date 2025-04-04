import React, { useEffect, useState } from 'react';
import { 
  Snackbar, 
  Alert, 
  Box, 
  Typography, 
  Avatar, 
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  useTheme
} from '@mui/material';
import { 
  Close as CloseIcon, 
  EmojiEvents as TrophyIcon,
  CheckCircle as CompletedIcon,
  Lightbulb as PointsIcon,
  TrendingUp as LevelUpIcon,
  School as EducationalIcon,
  People as SocialIcon,
  Code as TechnicalIcon,
  Star as SpecialIcon
} from '@mui/icons-material';
import { alpha, styled } from '@mui/system';
import { Achievement } from '../../store/gameStore';

// Определение типов событий игры
export type GameNotificationType = 
  | 'achievement_unlocked' 
  | 'level_up' 
  | 'quest_completed' 
  | 'points_earned';

// Интерфейс для игрового события
export interface GameEvent {
  id: string;
  type: GameNotificationType;
  title: string;
  description?: string;
  points?: number;
  level?: number;
  achievement?: Achievement;
  timestamp: number;
}

interface GameNotificationProps {
  event: GameEvent;
  open: boolean;
  onClose: () => void;
  autoHideDuration?: number;
}

// Стилизованная обертка для уведомления
const NotificationAlert = styled(Alert)(({ theme }) => ({
  width: '100%',
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1.5),
  alignItems: 'flex-start',
  '& .MuiAlert-icon': {
    padding: theme.spacing(1, 0)
  }
}));

// Стилизованная иконка закрытия
const StyledCloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: 2,
  right: 2,
  padding: 4,
  color: 'inherit',
  opacity: 0.7,
  '&:hover': {
    opacity: 1,
    backgroundColor: alpha(theme.palette.common.white, 0.15)
  }
}));

const GameNotification: React.FC<GameNotificationProps> = ({ 
  event, 
  open, 
  onClose, 
  autoHideDuration = 5000 
}) => {
  const theme = useTheme();
  const [progressValue, setProgressValue] = useState(100);
  
  // Получение иконки в зависимости от типа события
  const getEventIcon = () => {
    switch (event.type) {
      case 'achievement_unlocked':
        if (event.achievement) {
          switch (event.achievement.category) {
            case 'educational':
              return <EducationalIcon fontSize="inherit" />;
            case 'social':
              return <SocialIcon fontSize="inherit" />;
            case 'technical':
              return <TechnicalIcon fontSize="inherit" />;
            case 'special':
              return <SpecialIcon fontSize="inherit" />;
            default:
              return <TrophyIcon fontSize="inherit" />;
          }
        }
        return <TrophyIcon fontSize="inherit" />;
      case 'level_up':
        return <LevelUpIcon fontSize="inherit" />;
      case 'quest_completed':
        return <CompletedIcon fontSize="inherit" />;
      case 'points_earned':
        return <PointsIcon fontSize="inherit" />;
      default:
        return <TrophyIcon fontSize="inherit" />;
    }
  };
  
  // Получение цвета в зависимости от типа события
  const getEventColor = () => {
    switch (event.type) {
      case 'achievement_unlocked':
        if (event.achievement) {
          switch (event.achievement.rarityLevel) {
            case 'legendary':
              return theme.palette.warning.main;
            case 'epic':
              return theme.palette.secondary.main;
            case 'rare':
              return theme.palette.info.main;
            default:
              return theme.palette.success.main;
          }
        }
        return theme.palette.success.main;
      case 'level_up':
        return theme.palette.primary.main;
      case 'quest_completed':
        return theme.palette.success.main;
      case 'points_earned':
        return theme.palette.warning.main;
      default:
        return theme.palette.primary.main;
    }
  };
  
  // Получение заголовка Alert в зависимости от типа события
  const getAlertTitle = () => {
    switch (event.type) {
      case 'achievement_unlocked':
        return 'Новое достижение!';
      case 'level_up':
        return 'Повышение уровня!';
      case 'quest_completed':
        return 'Задание выполнено!';
      case 'points_earned':
        return 'Получены очки опыта!';
      default:
        return 'Уведомление';
    }
  };
  
  // Получаем тип уведомления для Alert
  const getAlertSeverity = () => {
    switch (event.type) {
      case 'achievement_unlocked':
        if (event.achievement && ['legendary', 'epic'].includes(event.achievement.rarityLevel)) {
          return 'warning';
        }
        return 'success';
      case 'level_up':
        return 'info';
      case 'quest_completed':
        return 'success';
      case 'points_earned':
        return 'info';
      default:
        return 'info';
    }
  };

  // Эффект для постепенного уменьшения полосы прогресса
  useEffect(() => {
    if (!open) {
      setProgressValue(100);
      return;
    }

    const timer = setInterval(() => {
      setProgressValue((prevProgress) => {
        const newProgress = prevProgress - 100 / (autoHideDuration / 100);
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, [open, autoHideDuration]);

  // Отображение содержимого уведомления в зависимости от типа события
  const renderEventContent = () => {
    const eventColor = getEventColor();
    
    return (
      <Box sx={{ display: 'flex', width: '100%' }}>
        <Avatar 
          sx={{ 
            bgcolor: eventColor,
            width: 48,
            height: 48,
            mr: 2,
            boxShadow: 2
          }}
        >
          {getEventIcon()}
        </Avatar>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {event.title}
          </Typography>
          
          {event.description && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              {event.description}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {event.points && (
              <Chip 
                size="small" 
                label={`+${event.points} XP`}
                sx={{ 
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.main,
                  fontWeight: 'bold',
                }}
              />
            )}
            
            {event.level && (
              <Chip 
                size="small" 
                label={`Уровень ${event.level}`}
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  fontWeight: 'bold',
                }}
              />
            )}
            
            {event.achievement && (
              <Chip 
                size="small" 
                label={event.achievement.rarityLevel === 'common' ? 'Обычное' :
                       event.achievement.rarityLevel === 'rare' ? 'Редкое' :
                       event.achievement.rarityLevel === 'epic' ? 'Эпическое' :
                       'Легендарное'}
                sx={{ 
                  bgcolor: alpha(eventColor, 0.1),
                  color: eventColor,
                  fontWeight: 'bold',
                }}
              />
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <NotificationAlert
        severity={getAlertSeverity() as any}
        icon={false}
        action={
          <StyledCloseButton 
            size="small" 
            aria-label="close" 
            onClick={onClose}
          >
            <CloseIcon fontSize="small" />
          </StyledCloseButton>
        }
        sx={{
          minWidth: '350px',
          maxWidth: '450px',
          position: 'relative',
          '& .MuiAlert-action': {
            padding: 0,
            marginRight: 0
          }
        }}
      >
        <Box>
          <Typography variant="caption" fontWeight="medium" gutterBottom>
            {getAlertTitle()}
          </Typography>
          {renderEventContent()}
          <LinearProgress 
            variant="determinate" 
            value={progressValue} 
            sx={{ 
              mt: 1.5, 
              height: 4, 
              borderRadius: 2,
              backgroundColor: alpha(getEventColor(), 0.2),
              '& .MuiLinearProgress-bar': {
                backgroundColor: getEventColor()
              }
            }} 
          />
        </Box>
      </NotificationAlert>
    </Snackbar>
  );
};

export default GameNotification; 