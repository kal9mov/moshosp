import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Avatar,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  Divider,
  useTheme,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Insights as InsightsIcon,
  CheckCircle as CheckCircleIcon,
  Extension as QuestIcon,
  Stars as StarsIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Celebration as CelebrationIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/system';
import { Achievement } from '../../store/gameStore';

// Экспортирую интерфейс Player для использования в других компонентах
export interface Player {
  id: string;
  name: string;
  avatar?: string;
  level: number;
  experience: number;
  nextLevelExperience: number;
  gamesCompleted?: number;
  achievements: string[] | Achievement[];
  completedQuests: number;
  totalQuests: number;
}

// Интерфейс пропсов компонента
export interface PlayerProfileProps {
  player: Player;
  onAchievementClick?: (achievement: Achievement) => void;
}

// Анимация для постепенного заполнения шкалы прогресса
const progressAnimation = keyframes`
  0% { width: 0%; }
  100% { width: 100%; }
`;

// Анимированная шкала прогресса
const AnimatedLinearProgress = styled(LinearProgress)({
  height: 10,
  borderRadius: 5,
  '& .MuiLinearProgress-bar': {
    animation: `${progressAnimation} 1.5s ease-out`,
    borderRadius: 5
  }
});

// Анимация сияния
const glowAnimation = keyframes`
  0% { box-shadow: 0 0 5px 0px rgba(33, 150, 243, 0.3); }
  50% { box-shadow: 0 0 15px 5px rgba(33, 150, 243, 0.5); }
  100% { box-shadow: 0 0 5px 0px rgba(33, 150, 243, 0.3); }
`;

// Анимация пульсации для новых достижений
const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Анимированный аватар
const AnimatedAvatar = styled(Avatar)({
  width: 100,
  height: 100,
  border: '4px solid white',
  boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.2)',
  transition: 'transform 0.3s ease',
  animation: `${glowAnimation} 3s infinite`,
  '&:hover': {
    transform: 'scale(1.05)',
  }
});

// Вычисление текущего прогресса
const calculateProgress = (experience: number, nextLevelExperience: number): number => {
  return Math.min(Math.floor((experience / nextLevelExperience) * 100), 100);
};

const PlayerProfile: React.FC<PlayerProfileProps> = ({ player, onAchievementClick }) => {
  const theme = useTheme();
  const [showAchievementsDialog, setShowAchievementsDialog] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  
  // Расчет процента до следующего уровня
  const experiencePercent = calculateProgress(player.experience, player.nextLevelExperience);

  // Обработчик для просмотра всех достижений
  const handleViewAllAchievements = () => {
    setShowAchievementsDialog(true);
  };

  // Обработчик для клика на достижение
  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    if (onAchievementClick) {
      onAchievementClick(achievement);
    }
  };

  // Преобразование строковых достижений в объекты
  const getAchievements = (): Achievement[] => {
    if (!player.achievements.length) return [];
    
    if (typeof player.achievements[0] === 'string') {
      // Преобразуем строки в объекты Achievement
      return (player.achievements as string[]).map(id => ({
        id,
        title: `Достижение ${id}`,
        description: 'Описание достижения',
        icon: '🏆',
        unlocked: true
      }));
    }
    
    return player.achievements as Achievement[];
  };

  const achievements = getAchievements();

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Декоративный элемент сверху */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: '5px', 
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})` 
        }} 
      />
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AnimatedAvatar 
          src={player.avatar} 
          sx={{ 
            width: 80, 
            height: 80, 
            mr: 2,
          }}
        >
          {!player.avatar && <PersonIcon fontSize="large" />}
        </AnimatedAvatar>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {player.name}
          </Typography>
          
          <Chip
            icon={<TrophyIcon />}
            label={`Уровень ${player.level}`}
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              fontWeight: 'bold',
              mb: 1,
              animation: player.level > 1 ? `${pulseAnimation} 2s infinite` : 'none',
            }}
          />
        </Box>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Опыт: {player.experience} / {player.nextLevelExperience}
          </Typography>
          <Typography variant="body2" fontWeight="bold" color="primary">
            {experiencePercent}%
          </Typography>
        </Box>
        
        <AnimatedLinearProgress 
          variant="determinate" 
          value={experiencePercent} 
          sx={{ 
            height: 8, 
            borderRadius: 4,
            '& .MuiLinearProgress-bar': {
              background: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.main})`,
            }
          }}
        />
      </Box>
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Box sx={{ 
            p: 2, 
            borderRadius: 2, 
            backgroundColor: theme.palette.action.hover,
            textAlign: 'center',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <TrophyIcon color="primary" />
            </Box>
            <Typography variant="h6" color="primary" fontWeight="bold">
              {achievements.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Достижения
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={6}>
          <Box sx={{ 
            p: 2, 
            borderRadius: 2, 
            backgroundColor: theme.palette.action.hover,
            textAlign: 'center',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <QuestIcon color="primary" />
            </Box>
            <Typography variant="h6" color="primary" fontWeight="bold">
              {player.completedQuests} / {player.totalQuests}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Задания
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      {/* Секция последних достижений */}
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Последние достижения
          </Typography>
          <Button 
            size="small" 
            color="primary" 
            onClick={handleViewAllAchievements}
            disabled={achievements.length === 0}
          >
            Все достижения
          </Button>
        </Box>
        
        {achievements.length > 0 ? (
          <Box sx={{ display: 'flex', gap: 1, overflow: 'auto', pb: 1 }}>
            {achievements.slice(0, 3).map((achievement, index) => (
              <Tooltip key={achievement.id} title={achievement.title}>
                <Chip
                  icon={<span style={{ fontSize: '1.2em' }}>{achievement.icon}</span>}
                  label={achievement.title}
                  onClick={() => handleAchievementClick(achievement)}
                  sx={{
                    backgroundColor: theme.palette.background.default,
                    cursor: 'pointer',
                    animation: `${pulseAnimation} ${2 + index * 0.5}s infinite`,
                    '&:hover': {
                      backgroundColor: theme.palette.action.selected,
                    }
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Нет достижений. Участвуйте в активностях, чтобы получить достижения!
          </Typography>
        )}
      </Box>
      
      {/* Диалог со всеми достижениями */}
      <Dialog 
        open={showAchievementsDialog} 
        onClose={() => setShowAchievementsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrophyIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            Достижения
          </Box>
          <IconButton onClick={() => setShowAchievementsDialog(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {achievements.length > 0 ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {achievements.map((achievement) => (
                <Grid item xs={12} sm={6} key={achievement.id}>
                  <Paper 
                    elevation={2} 
                    sx={{ 
                      p: 2, 
                      display: 'flex', 
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        transform: 'translateY(-2px)'
                      }
                    }}
                    onClick={() => handleAchievementClick(achievement)}
                  >
                    <Box 
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        backgroundColor: theme.palette.primary.light,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        fontSize: '1.5em'
                      }}
                    >
                      {achievement.icon}
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {achievement.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {achievement.description}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              p: 4 
            }}>
              <CelebrationIcon sx={{ fontSize: 60, color: theme.palette.action.disabled, mb: 2 }} />
              <Typography variant="h6" color="text.secondary" align="center">
                У вас пока нет достижений
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Выполняйте задания и получайте награды, чтобы разблокировать достижения
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

// Компонент для статистики пользователя
const StatBox: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({
  icon,
  value,
  label,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        p: 1.5,
        minWidth: 120,
      }}
    >
      <Box sx={{ mb: 1 }}>{icon}</Box>
      <Typography variant="h6" fontWeight="bold">
        {value}
      </Typography>
      <Typography variant="caption" sx={{ opacity: 0.9 }}>
        {label}
      </Typography>
    </Box>
  );
};

export default PlayerProfile; 