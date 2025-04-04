import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  TablePagination,
  useTheme,
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  MoreVert as MoreIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

interface LeaderboardItemProps {
  id: string;
  rank: number;
  name: string;
  avatar?: string;
  level: number;
  points: number;
  completedQuests: number;
  achievements: number;
  department?: string;
  isCurrentUser?: boolean;
}

export interface LeaderboardProps {
  data: LeaderboardItemProps[];
  title?: string;
  loading?: boolean;
  onPlayerClick?: (playerId: string) => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  data,
  title = 'Рейтинг игроков',
  loading = false,
  onPlayerClick,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [timeFilter, setTimeFilter] = useState('all');

  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTimeFilterChange = (
    event: React.MouseEvent<HTMLElement>,
    newFilter: string,
  ) => {
    if (newFilter !== null) {
      setTimeFilter(newFilter);
    }
  };

  // Определение стиля строки для пользователя
  const getRowStyle = (player: LeaderboardItemProps) => {
    if (player.isCurrentUser) {
      return {
        backgroundColor: `${theme.palette.primary.main}22`,
        '&:hover': {
          backgroundColor: `${theme.palette.primary.main}44`,
        },
      };
    }
    return {};
  };

  // Стиль для рейтинга (топ-3)
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return { color: '#FFD700', fontWeight: 'bold' }; // Золото
      case 2:
        return { color: '#C0C0C0', fontWeight: 'bold' }; // Серебро
      case 3:
        return { color: '#CD7F32', fontWeight: 'bold' }; // Бронза
      default:
        return {};
    }
  };

  // Рендер иконки для топ-3
  const renderRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <TrophyIcon sx={{ ...getRankStyle(rank), fontSize: '1.2rem', ml: 0.5 }} />;
    }
    return null;
  };

  return (
    <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
        
        <Box display="flex" alignItems="center" gap={2}>
          <ToggleButtonGroup
            value={timeFilter}
            exclusive
            onChange={handleTimeFilterChange}
            size="small"
            aria-label="time filter"
          >
            <ToggleButton value="week" aria-label="week">
              Неделя
            </ToggleButton>
            <ToggleButton value="month" aria-label="month">
              Месяц
            </ToggleButton>
            <ToggleButton value="all" aria-label="all time">
              Всё время
            </ToggleButton>
          </ToggleButtonGroup>
          
          <IconButton size="small">
            <FilterIcon />
          </IconButton>
          
          <IconButton size="small">
            <SearchIcon />
          </IconButton>
        </Box>
      </Box>
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center" width={80}>Ранг</TableCell>
              <TableCell>Игрок</TableCell>
              <TableCell align="center">Уровень</TableCell>
              <TableCell align="center">Очки</TableCell>
              <TableCell align="center">Задания</TableCell>
              <TableCell align="center">Достижения</TableCell>
              <TableCell width={50}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((player) => (
                <TableRow 
                  key={player.id} 
                  hover 
                  onClick={() => onPlayerClick && onPlayerClick(player.id)}
                  sx={{ 
                    cursor: onPlayerClick ? 'pointer' : 'default',
                    ...getRowStyle(player)
                  }}
                >
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={getRankStyle(player.rank)}>
                        {player.rank}
                      </Typography>
                      {renderRankIcon(player.rank)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar 
                        src={player.avatar} 
                        alt={player.name}
                        sx={{ 
                          width: 40, 
                          height: 40,
                          border: player.isCurrentUser ? `2px solid ${theme.palette.primary.main}` : 'none'
                        }}
                      >
                        {!player.avatar && player.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight={player.isCurrentUser ? 'bold' : 'normal'}>
                          {player.name}
                          {player.isCurrentUser && (
                            <Chip
                              label="Вы"
                              size="small"
                              color="primary"
                              sx={{ ml: 1, height: 18, fontSize: '0.7rem' }}
                            />
                          )}
                        </Typography>
                        {player.department && (
                          <Typography variant="caption" color="text.secondary">
                            {player.department}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={player.level} 
                      size="small"
                      sx={{ 
                        backgroundColor: theme.palette.primary.main, 
                        color: 'white',
                        fontWeight: 'bold',
                        minWidth: 32,
                      }} 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight="bold">{player.points.toLocaleString()}</Typography>
                  </TableCell>
                  <TableCell align="center">{player.completedQuests}</TableCell>
                  <TableCell align="center">{player.achievements}</TableCell>
                  <TableCell>
                    <IconButton size="small">
                      <MoreIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        component="div"
        count={data.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        labelRowsPerPage="Строк на странице:"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} из ${count}`}
      />
    </Paper>
  );
};

export default Leaderboard; 