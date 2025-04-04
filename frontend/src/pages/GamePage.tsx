import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Tab,
  Tabs,
  Button,
  useTheme,
  Divider,
  Card,
  CardContent,
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  Fade,
  Zoom
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  EmojiEvents as TrophyIcon,
  Leaderboard as LeaderboardIcon,
  Stars as StarsIcon,
  ExtensionOutlined as GameIcon,
  EmojiEventsOutlined as AchievementsIcon,
  HistoryOutlined as HistoryIcon,
  NewReleases as TestIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';
import PlayerProfile from '../components/game/PlayerProfile';
import Leaderboard from '../components/game/Leaderboard';
import AchievementsGrid from '../components/game/AchievementsGrid';
import GameCard from '../components/game/GameCard';
import { useGameStore, useInitializeGameData } from '../store/gameStore';
import EventsHistory from '../components/game/EventsHistory';

// Анимированный контейнер для вкладок
const AnimatedTabPanel = styled(Box)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  minHeight: '400px',
  padding: theme.spacing(3),
  transition: 'all 0.3s ease-in-out',
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Создаем правильный тип для children внутри табов
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  const isActive = value === index;

  return (
    <AnimatedTabPanel
      role="tabpanel"
      hidden={!isActive}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      sx={{ 
        display: isActive ? 'block' : 'none',
        opacity: isActive ? 1 : 0,
        transition: 'opacity 300ms ease-in-out'
      }}
    >
      {isActive && children}
    </AnimatedTabPanel>
  );
};

function a11yProps(index: number) {
  return {
    id: `game-tab-${index}`,
    'aria-controls': `game-tabpanel-${index}`,
  };
}

const GamePage: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [testMenuAnchor, setTestMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Получаем данные и методы из хранилища
  const {
    name,
    avatar,
    level,
    experience,
    nextLevelExperience,
    completedQuests,
    totalQuests,
    achievements,
    games,
    addExperience,
    completeGame,
    unlockGame,
    leaderboard,
    showAnimatedReward,
    unlockAchievement
  } = useGameStore();
  
  // Инициализация демо-данными при разработке
  const initializeGameData = useInitializeGameData();
  
  // Инициализируем демо-данные при первой загрузке
  useEffect(() => {
    initializeGameData();
  }, [initializeGameData]);

  const handleChangeTab = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Обработчик завершения игры
  const handleGameComplete = (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (game && !game.isCompleted) {
      completeGame(gameId);
    }
  };

  // Тестовая функция для добавления опыта
  const handleAddExperience = () => {
    addExperience(25, 'Тестовый бонус');
  };
  
  // Тестовая функция для получения достижения
  const handleTestAchievement = () => {
    const unlockedAchievements = achievements.filter(a => !a.unlocked);
    if (unlockedAchievements.length > 0) {
      unlockAchievement(unlockedAchievements[0].id);
    }
  };
  
  // Тестовая функция для повышения уровня
  const handleTestLevelUp = () => {
    addExperience(nextLevelExperience, 'Тестовое повышение уровня');
  };
  
  // Меню тестирования
  const handleOpenTestMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setTestMenuAnchor(event.currentTarget);
  };
  
  const handleCloseTestMenu = () => {
    setTestMenuAnchor(null);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontWeight: 'bold',
            color: theme.palette.primary.main,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              width: '40px',
              height: '4px',
              bottom: '-8px',
              left: '0',
              backgroundColor: theme.palette.primary.main,
              borderRadius: '2px',
            } 
          }}
        >
          Игровая платформа
        </Typography>
        
        {/* Кнопка тестирования (только в режиме разработки) */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <Tooltip title="Тестовые функции">
              <IconButton 
                color="primary" 
                onClick={handleOpenTestMenu}
                sx={{ 
                  border: '1px dashed', 
                  borderColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <TestIcon />
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={testMenuAnchor}
              open={Boolean(testMenuAnchor)}
              onClose={handleCloseTestMenu}
            >
              <MenuItem onClick={() => {
                handleAddExperience();
                handleCloseTestMenu();
              }}>
                Получить опыт (+25)
              </MenuItem>
              <MenuItem onClick={() => {
                handleTestAchievement();
                handleCloseTestMenu();
              }}>
                Разблокировать достижение
              </MenuItem>
              <MenuItem onClick={() => {
                handleTestLevelUp();
                handleCloseTestMenu();
              }}>
                Повысить уровень
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <PlayerProfile player={{
              id: 'user-1',
              name: name,
              avatar: avatar,
              level: level,
              experience: experience,
              nextLevelExperience: nextLevelExperience,
              completedQuests: completedQuests,
              totalQuests: totalQuests,
              achievements: achievements
            }} />
          </Grid>
        </Grid>
      </Box>
      
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: 6
          }
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleChangeTab} 
            textColor="primary" 
            indicatorColor="primary"
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                transition: 'all 0.2s ease',
                minHeight: '60px',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.03)'
                }
              },
              '& .Mui-selected': {
                fontWeight: 'bold'
              }
            }}
          >
            <Tab 
              icon={<GameIcon />} 
              label="Задания" 
              iconPosition="start"
              {...a11yProps(0)}
            />
            <Tab 
              icon={<AchievementsIcon />} 
              label="Достижения" 
              iconPosition="start"
              {...a11yProps(1)}
            />
            <Tab 
              icon={<LeaderboardIcon />} 
              label="Рейтинг" 
              iconPosition="start"
              {...a11yProps(2)}
            />
            <Tab 
              icon={<HistoryIcon />} 
              label="История активности"
              iconPosition="start"
              {...a11yProps(3)}
            />
          </Tabs>
        </Box>
        
        <Box sx={{ minHeight: '400px' }}>
          {/* Задания */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              {games.length === 0 ? (
                <Grid item xs={12}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 5 }}>
                      <Typography variant="body1" color="text.secondary">
                        Задания пока недоступны
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ) : (
                games.map((game) => (
                  <Grid item xs={12} sm={6} md={4} key={game.id}>
                    <GameCard 
                      id={game.id}
                      title={game.title}
                      description={game.description}
                      imageSrc={game.imageSrc}
                      level={game.level}
                      points={game.points}
                      path={game.path}
                      isCompleted={game.isCompleted}
                      isLocked={game.isLocked}
                      category={game.category}
                      onComplete={() => handleGameComplete(game.id)}
                    />
                  </Grid>
                ))
              )}
            </Grid>
          </TabPanel>
          
          {/* Достижения */}
          <TabPanel value={activeTab} index={1}>
            <AchievementsGrid achievements={achievements} />
          </TabPanel>
          
          {/* Рейтинг */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ 
              mb: 3, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1 
            }}>
              <Typography variant="h6" fontWeight="bold">
                Таблица лидеров
              </Typography>
              <Leaderboard data={leaderboard.slice(0, 5)} />
            </Box>
          </TabPanel>
          
          {/* История активности */}
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <EventsHistory limit={20} />
              </Grid>
            </Grid>
          </TabPanel>
        </Box>
      </Paper>
      
      {/* Информация о игровой системе */}
      <Paper 
        sx={{ 
          mt: 4, 
          p: 3, 
          borderRadius: 2,
          backgroundColor: theme.palette.grey[50],
          border: '1px solid',
          borderColor: theme.palette.grey[200]
        }}
      >
        <Typography variant="h6" gutterBottom>
          Как работает игровая система?
        </Typography>
        <Typography variant="body2" paragraph>
          Выполняйте задания, получайте очки опыта и разблокируйте достижения. По мере накопления опыта вы будете повышать свой уровень и открывать доступ к новым заданиям.
        </Typography>
        <Typography variant="body2">
          За особые достижения и активность в системе вы получаете дополнительные награды и бонусы. Ваш прогресс сохраняется и отображается в таблице рейтинга среди других пользователей.
        </Typography>
      </Paper>
    </Container>
  );
};

export default GamePage; 