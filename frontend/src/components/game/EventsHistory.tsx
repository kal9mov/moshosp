import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Paper,
  Divider,
  Chip,
  useTheme,
  alpha,
  Fade,
  Grow
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  CheckCircle as CompletedIcon,
  Lightbulb as PointsIcon,
  TrendingUp as LevelUpIcon,
  School as EducationalIcon,
  People as SocialIcon,
  Code as TechnicalIcon,
  Star as SpecialIcon
} from '@mui/icons-material';
import { useGameStore, GameEvent } from '../../store/gameStore';
import { styled } from '@mui/system';

interface EventsHistoryProps {
  limit?: number;
}

// Стилизованный компонент для анимированного элемента списка
const AnimatedListItem = styled(ListItem)(({ theme }) => ({
  transition: 'all 0.3s ease',
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(1),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    transform: 'translateX(5px)'
  }
}));

// Компонент для отображения времени события
const TimeStamp: React.FC<{ timestamp: number }> = ({ timestamp }) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="caption" color="text.secondary" fontWeight="bold">
        {formatTime(timestamp)}
      </Typography>
      <Typography variant="caption" color="text.disabled">
        {formatDate(timestamp)}
      </Typography>
    </Box>
  );
};

// Получение иконки в зависимости от типа события
const getEventIcon = (event: GameEvent) => {
  switch (event.type) {
    case 'achievement_unlocked':
      if (event.achievement) {
        switch (event.achievement.category) {
          case 'educational':
            return <EducationalIcon />;
          case 'social':
            return <SocialIcon />;
          case 'technical':
            return <TechnicalIcon />;
          case 'special':
            return <SpecialIcon />;
          default:
            return <TrophyIcon />;
        }
      }
      return <TrophyIcon />;
    case 'level_up':
      return <LevelUpIcon />;
    case 'quest_completed':
      return <CompletedIcon />;
    case 'points_earned':
      return <PointsIcon />;
    default:
      return <TrophyIcon />;
  }
};

// Получение цвета аватара в зависимости от типа события
const getEventColor = (event: GameEvent, theme: any) => {
  switch (event.type) {
    case 'achievement_unlocked':
      if (event.achievement) {
        switch (event.achievement.rarityLevel) {
          case 'legendary':
            return theme.palette.warning.main;
          case 'epic':
            return theme.palette.purple[500] || '#9c27b0';
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

// Получение названия типа события
const getEventTypeName = (type: string) => {
  switch (type) {
    case 'achievement_unlocked':
      return 'Достижение';
    case 'level_up':
      return 'Уровень';
    case 'quest_completed':
      return 'Задание';
    case 'points_earned':
      return 'Опыт';
    default:
      return 'Событие';
  }
};

const EventsHistory: React.FC<EventsHistoryProps> = ({ limit = 10 }) => {
  const theme = useTheme();
  const { eventsHistory } = useGameStore();
  const limitedEvents = eventsHistory.slice(0, limit);

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        borderRadius: 2, 
        overflow: 'hidden',
        height: '100%'
      }}
    >
      <Box
        sx={{
          p: 2,
          background: `linear-gradient(45deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'white',
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          История активности
        </Typography>
      </Box>
      
      {limitedEvents.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Пока нет истории событий
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 2, maxHeight: '600px', overflow: 'auto' }}>
          {limitedEvents.map((event, index) => (
            <Grow 
              in={true} 
              key={event.id} 
              timeout={(index + 1) * 200}
              style={{ transformOrigin: '0 0 0' }}
            >
              <Box>
                <AnimatedListItem
                  alignItems="flex-start"
                  sx={{
                    px: 2,
                    py: 1.5,
                    backgroundColor: alpha(getEventColor(event, theme), 0.08),
                    borderLeft: `4px solid ${getEventColor(event, theme)}`,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: getEventColor(event, theme),
                        boxShadow: 2,
                      }}
                    >
                      {getEventIcon(event)}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {event.title}
                        </Typography>
                        <TimeStamp timestamp={event.timestamp} />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        {event.description && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            {event.description}
                          </Typography>
                        )}
                        
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip
                            size="small"
                            label={getEventTypeName(event.type)}
                            sx={{
                              bgcolor: alpha(getEventColor(event, theme), 0.1),
                              color: getEventColor(event, theme),
                              fontWeight: 'bold',
                            }}
                          />
                          
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
                        </Box>
                      </Box>
                    }
                  />
                </AnimatedListItem>
                
                {index < limitedEvents.length - 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{ height: 16, width: 1, bgcolor: 'divider' }} />
                  </Box>
                )}
              </Box>
            </Grow>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default EventsHistory; 