import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  InputAdornment,
  TextField,
  Tabs,
  Tab,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Badge,
  Zoom,
  Fade,
  Grow
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  School as SchoolIcon,
  Favorite as FavoriteIcon,
  Build as BuildIcon,
  HelpOutline as HelpIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/system';
import { useTheme, Theme } from '@mui/material/styles';
import { Achievement as GameStoreAchievement } from '../../store/gameStore';

// Локальное определение типа Achievement для компонента, совместимое с GameStoreAchievement
export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconSrc?: string;
  iconName?: string;
  category: 'educational' | 'social' | 'technical' | 'special';
  rarityLevel: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  isUnlocked?: boolean;
  progress?: {
    current: number;
    total: number;
  };
  unlockDate?: string;
  pointsReward: number;
}

// Конвертер из GameStoreAchievement в локальный тип Achievement
const convertAchievement = (achievement: GameStoreAchievement): Achievement => {
  return {
    ...achievement,
    unlockDate: achievement.unlockDate ? String(achievement.unlockDate) : undefined
  };
};

interface AchievementsGridProps {
  achievements: GameStoreAchievement[];
  onAchievementClick?: (achievement: Achievement) => void;
}

// Анимация свечения
const glow = keyframes`
  0% {
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
  }
  100% {
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
  }
`;

// Анимация вращения для бейджей
const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(3deg);
  }
  75% {
    transform: rotate(-3deg);
  }
  100% {
    transform: rotate(0deg);
  }
`;

const StyledCard = styled(Card)(() => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  transition: 'all 0.3s ease-in-out',
  overflow: 'hidden',
  backdropFilter: 'blur(5px)',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
  },
}));

const RarityBadge = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'rarity',
})<{ rarity: string }>(({ theme, rarity }) => {
  let badgeStyles = {};
  
  switch (rarity) {
    case 'common':
      badgeStyles = {
        backgroundColor: theme.palette.grey[500],
        boxShadow: '0 0 5px rgba(158, 158, 158, 0.8)',
      };
      break;
    case 'rare':
      badgeStyles = {
        backgroundColor: theme.palette.info.main,
        boxShadow: '0 0 8px rgba(33, 150, 243, 0.8)',
      };
      break;
    case 'epic':
      badgeStyles = {
        backgroundColor: (theme.palette as any).purple?.[500] || '#9c27b0',
        boxShadow: '0 0 12px rgba(156, 39, 176, 0.8)',
        animation: `${rotate} 3s ease-in-out infinite`,
      };
      break;
    case 'legendary':
      badgeStyles = {
        background: 'linear-gradient(45deg, #FF8E53 30%, #FE6B8B 90%)',
        boxShadow: '0 0 15px rgba(255, 215, 0, 0.8)',
        animation: `${glow} 2s infinite ease-in-out, ${rotate} 5s ease-in-out infinite`,
      };
      break;
    default:
      badgeStyles = {
        backgroundColor: theme.palette.grey[500],
      };
  }
  
  return {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    width: 36,
    height: 36,
    ...badgeStyles,
    '&:hover': {
      transform: 'scale(1.1)',
    },
    transition: 'transform 0.2s ease',
  };
});

const AchievementIcon = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'category' && prop !== 'unlocked' && prop !== 'rarity',
})<{ category: string; unlocked: boolean; rarity: string }>(({ theme, category, unlocked, rarity }) => {
  let iconColor = theme.palette.grey[500];
  let glowEffect = '';
  
  if (unlocked) {
    switch (category) {
      case 'educational':
        iconColor = theme.palette.info.main;
        break;
      case 'social':
        iconColor = theme.palette.success.main;
        break;
      case 'technical':
        iconColor = theme.palette.warning.main;
        break;
      case 'special':
        iconColor = theme.palette.error.main;
        break;
      default:
        iconColor = theme.palette.primary.main;
    }
    
    if (rarity === 'legendary') {
      glowEffect = `0 0 15px ${iconColor}`;
    } else if (rarity === 'epic') {
      glowEffect = `0 0 10px ${iconColor}`;
    } else if (rarity === 'rare') {
      glowEffect = `0 0 5px ${iconColor}`;
    }
  }
  
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    color: unlocked ? iconColor : theme.palette.grey[500],
    fontSize: 30,
    marginBottom: theme.spacing(2),
    boxShadow: unlocked ? glowEffect : 'none',
    filter: unlocked ? 'none' : 'grayscale(100%)',
    transition: 'all 0.3s ease',
  };
});

const CategoryTabsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(3),
  flexWrap: 'wrap',
  gap: theme.spacing(1),
}));

const AchievementsGrid: React.FC<AchievementsGridProps> = ({
  achievements,
  onAchievementClick,
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  // Конвертируем достижения в локальный формат
  const localAchievements: Achievement[] = achievements.map(convertAchievement);

  // Фильтрация достижений
  const filteredAchievements = localAchievements.filter((achievement) => {
    // Фильтрация по поиску
    const matchesSearch = 
      achievement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Фильтрация по вкладке
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'unlocked' && achievement.unlocked) ||
      (activeTab === 'locked' && !achievement.unlocked) ||
      activeTab === achievement.category;
    
    return matchesSearch && matchesTab;
  });

  // Функция для отображения иконки категории
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'educational':
        return <SchoolIcon />;
      case 'social':
        return <FavoriteIcon />;
      case 'technical':
        return <BuildIcon />;
      case 'special':
        return <TrophyIcon />;
      default:
        return <HelpIcon />;
    }
  };

  // Функция для определения цвета по редкости
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return '#78909C'; // Серый
      case 'uncommon':
        return '#4CAF50'; // Зеленый
      case 'rare':
        return '#2196F3'; // Синий
      case 'epic':
        return '#9C27B0'; // Фиолетовый
      case 'legendary':
        return '#FF9800'; // Оранжевый
      default:
        return '#78909C';
    }
  };

  // Функция для текста редкости
  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'Обычное';
      case 'uncommon':
        return 'Необычное';
      case 'rare':
        return 'Редкое';
      case 'epic':
        return 'Эпическое';
      case 'legendary':
        return 'Легендарное';
      default:
        return 'Неизвестно';
    }
  };

  // Функция для открытия диалога с деталями достижения
  const handleOpenDetails = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
  };

  // Функция для закрытия диалога
  const handleCloseDetails = () => {
    setSelectedAchievement(null);
  };

  return (
    <Box>
      {/* Заголовок и инструменты фильтрации */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Достижения
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Поиск достижений..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 220 }}
          />
          
          <Tooltip title="Сортировать">
            <IconButton size="small">
              <SortIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Фильтр">
            <IconButton size="small">
              <FilterIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Статистика достижений */}
      <Box 
        sx={{ 
          mb: 3, 
          p: 2, 
          borderRadius: 2, 
          backgroundColor: 'rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-around',
          gap: 2
        }}
      >
        <Box>
          <Typography variant="body2" color="text.secondary">Получено</Typography>
          <Typography variant="h6" fontWeight="bold">
            {localAchievements.filter(a => a.unlocked).length}/{localAchievements.length}
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="body2" color="text.secondary">Прогресс</Typography>
          <LinearProgress 
            variant="determinate" 
            value={(localAchievements.filter(a => a.unlocked).length / localAchievements.length) * 100}
            sx={{ width: 120, mt: 1, height: 8, borderRadius: 4 }}
          />
        </Box>
        
        <Box>
          <Typography variant="body2" color="text.secondary">Очки за достижения</Typography>
          <Typography variant="h6" fontWeight="bold">
            {localAchievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.pointsReward, 0)}
          </Typography>
        </Box>
      </Box>
      
      {/* Табы для категорий */}
      <CategoryTabsContainer>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            mb: { xs: 1, md: 0 },
            '& .MuiTab-root': {
              minWidth: 100,
              transition: 'all 0.2s ease',
            },
          }}
        >
          <Tab 
            icon={<TrophyIcon />} 
            label="Все" 
            value="all" 
            iconPosition="start"
          />
          <Tab 
            icon={<SchoolIcon />} 
            label="Обучение" 
            value="educational" 
            iconPosition="start"
          />
          <Tab 
            icon={<FavoriteIcon />} 
            label="Социальные" 
            value="social" 
            iconPosition="start"
          />
          <Tab 
            icon={<BuildIcon />} 
            label="Технические" 
            value="technical" 
            iconPosition="start"
          />
          <Tab 
            icon={<TrophyIcon />} 
            label="Особые" 
            value="special" 
            iconPosition="start"
          />
        </Tabs>
      </CategoryTabsContainer>
      
      {/* Сетка достижений */}
      <Grid container spacing={2}>
        {filteredAchievements.map((achievement) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={achievement.id}>
            <Grow in={true} timeout={(localAchievements.indexOf(achievement) + 1) * 200}>
              <StyledCard 
                elevation={achievement.unlocked ? 3 : 1}
                sx={{
                  borderRadius: 2,
                  opacity: achievement.unlocked ? 1 : 0.7,
                  backgroundColor: achievement.unlocked 
                    ? `rgba(${theme.palette.mode === 'dark' ? '255, 255, 255, 0.05' : '0, 0, 0, 0.02'})`
                    : undefined,
                  borderLeft: achievement.unlocked ? `4px solid ${
                    achievement.category === 'educational' ? theme.palette.info.main :
                    achievement.category === 'social' ? theme.palette.success.main :
                    achievement.category === 'technical' ? theme.palette.warning.main :
                    theme.palette.error.main
                  }` : undefined,
                }}
                onClick={() => handleOpenDetails(achievement)}
              >
                {/* Бейдж редкости */}
                <RarityBadge rarity={achievement.rarityLevel}>
                  <TrophyIcon fontSize="small" />
                </RarityBadge>

                {/* Значок блокировки для неразблокированных достижений */}
                {!achievement.unlocked && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(2px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                    }}
                  >
                    <LockIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                  </Box>
                )}

                <CardContent sx={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                    <AchievementIcon 
                      category={achievement.category} 
                      unlocked={achievement.unlocked}
                      rarity={achievement.rarityLevel}
                    >
                      {getCategoryIcon(achievement.category)}
                    </AchievementIcon>
                  </Box>

                  <Typography 
                    variant="h6" 
                    component="div" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 'bold',
                      color: achievement.unlocked ? 'text.primary' : 'text.disabled',
                    }}
                  >
                    {achievement.title}
                  </Typography>

                  <Typography 
                    variant="body2" 
                    color={achievement.unlocked ? "text.secondary" : "text.disabled"}
                    sx={{ mb: 2, flexGrow: 1 }}
                  >
                    {achievement.description}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                    <Chip 
                      size="small" 
                      label={getRarityText(achievement.rarityLevel)}
                      sx={{ 
                        color: achievement.unlocked ? undefined : 'text.disabled',
                        fontWeight: 'bold',
                        backgroundColor: achievement.unlocked 
                          ? `${
                              achievement.rarityLevel === 'legendary' ? theme.palette.warning.main :
                              achievement.rarityLevel === 'epic' ? '#9c27b0' :
                              achievement.rarityLevel === 'rare' ? theme.palette.info.main :
                              theme.palette.grey[500]
                            }1A` // 10% opacity
                          : undefined,
                      }}
                    />
                  </Box>

                  {achievement.unlocked && achievement.unlockDate && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                      Получено: {new Date(achievement.unlockDate).toLocaleDateString()}
                    </Typography>
                  )}
                </CardContent>
              </StyledCard>
            </Grow>
          </Grid>
        ))}
        
        {filteredAchievements.length === 0 && (
          <Box 
            sx={{ 
              width: '100%', 
              p: 4, 
              textAlign: 'center',
              color: 'text.secondary' 
            }}
          >
            <Typography>
              По вашему запросу ничего не найдено. Попробуйте изменить критерии поиска.
            </Typography>
          </Box>
        )}
      </Grid>
      
      {/* Диалог с деталями достижения */}
      <Dialog 
        open={selectedAchievement !== null} 
        onClose={handleCloseDetails}
        maxWidth="sm"
        fullWidth
      >
        {selectedAchievement && (
          <>
            <Box sx={{ position: 'relative' }}>
              <Box 
                sx={{ 
                  height: 8, 
                  backgroundColor: getRarityColor(selectedAchievement.rarityLevel),
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                }}
              />
              
              <DialogTitle sx={{ pt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{selectedAchievement.title}</Typography>
                  <IconButton onClick={handleCloseDetails} size="small">
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </DialogTitle>
            </Box>
            
            <DialogContent>
              <Box sx={{ display: 'flex', mb: 3, alignItems: 'center' }}>
                <Avatar
                  sx={{
                    bgcolor: selectedAchievement.unlocked ? getRarityColor(selectedAchievement.rarityLevel) : 'action.disabledBackground',
                    color: 'white',
                    width: 60,
                    height: 60,
                    mr: 2,
                  }}
                  src={selectedAchievement.iconSrc}
                >
                  {selectedAchievement.unlocked ? (
                    getCategoryIcon(selectedAchievement.category)
                  ) : (
                    <LockIcon />
                  )}
                </Avatar>
                
                <Box>
                  <Chip 
                    label={getRarityText(selectedAchievement.rarityLevel)} 
                    size="small"
                    sx={{ 
                      backgroundColor: `${getRarityColor(selectedAchievement.rarityLevel)}22`,
                      color: getRarityColor(selectedAchievement.rarityLevel),
                      fontWeight: 'bold',
                      mb: 1
                    }}
                  />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getCategoryIcon(selectedAchievement.category)}
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      {selectedAchievement.category === 'educational' && 'Образовательное'}
                      {selectedAchievement.category === 'social' && 'Социальное'}
                      {selectedAchievement.category === 'technical' && 'Техническое'}
                      {selectedAchievement.category === 'special' && 'Особое'}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ ml: 'auto' }}>
                  <Chip 
                    label={`+${selectedAchievement.pointsReward} XP`} 
                    sx={{ 
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              </Box>
              
              <Typography variant="body1" paragraph>
                {selectedAchievement.description}
              </Typography>
              
              {selectedAchievement.progress && !selectedAchievement.unlocked && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Прогресс
                    </Typography>
                    <Typography variant="body2">
                      {selectedAchievement.progress.current}/{selectedAchievement.progress.total}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(selectedAchievement.progress.current / selectedAchievement.progress.total) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}
              
              {selectedAchievement.unlocked && (
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  borderRadius: 2, 
                  backgroundColor: 'success.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <CheckCircleIcon sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      Достижение разблокировано
                    </Typography>
                    {selectedAchievement.unlockDate && (
                      <Typography variant="body2">
                        {selectedAchievement.unlockDate}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </DialogContent>
            
            <DialogActions>
              <Button onClick={handleCloseDetails}>Закрыть</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AchievementsGrid; 