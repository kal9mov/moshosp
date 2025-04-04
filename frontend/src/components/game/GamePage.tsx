import React, { useState } from 'react';
import { Container, Box, Grid, Tabs, Tab, Typography, useTheme, Paper, alpha } from '@mui/material';
import PlayerProfile, { Player } from './PlayerProfile';
import GameCard from './GameCard';
import Leaderboard from './Leaderboard';
import AchievementsGrid from './AchievementsGrid';
import EventsHistory from './EventsHistory';
import { useGameStore } from '../../store/gameStore';
import { Dashboard as DashboardIcon, EmojiEvents as TrophyIcon, Games as GamesIcon, History as HistoryIcon } from '@mui/icons-material';

const GamePage: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const { player, games, achievements, leaderboard } = useGameStore();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Фильтрация игр для отображения только доступных
  const availableGames = games.filter(game => !game.isLocked);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box 
        sx={{ 
          p: 2, 
          mb: 4, 
          borderRadius: 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'white',
          boxShadow: 3
        }}
      >
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
          Игровая платформа
        </Typography>
        <Typography variant="subtitle1">
          Выполняйте задания, получайте достижения и соревнуйтесь с коллегами
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          mb: 4,
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(8px)',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          sx={{
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              py: 2,
              textTransform: 'none',
              fontWeight: 'bold',
              fontSize: '1rem',
            },
          }}
        >
          <Tab icon={<DashboardIcon />} label="Общее" />
          <Tab icon={<GamesIcon />} label="Задания" />
          <Tab icon={<TrophyIcon />} label="Достижения" />
          <Tab icon={<HistoryIcon />} label="История" />
        </Tabs>
      </Paper>

      {/* Панель общего вида */}
      {activeTab === 0 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <PlayerProfile player={player} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Доступные задания
                </Typography>
                <Grid container spacing={2}>
                  {availableGames.slice(0, 3).map(game => (
                    <Grid item key={game.id} xs={12} sm={6} md={4}>
                      <GameCard {...game} />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight="bold">
                  Таблица лидеров
                </Typography>
                <Leaderboard data={leaderboard.slice(0, 5)} />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}

      {/* Панель заданий */}
      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
            Все доступные задания
          </Typography>
          <Grid container spacing={3}>
            {games.map((game) => (
              <Grid item key={game.id} xs={12} sm={6} md={4}>
                <GameCard {...game} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Панель достижений */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
            Ваши достижения
          </Typography>
          <AchievementsGrid achievements={achievements} />
        </Box>
      )}

      {/* Панель истории */}
      {activeTab === 3 && (
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
            История активности
          </Typography>
          <EventsHistory limit={20} />
        </Box>
      )}
    </Container>
  );
};

export default GamePage; 