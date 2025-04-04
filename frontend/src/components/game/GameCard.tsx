import React from 'react';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Typography,
  Button,
  useTheme,
  Zoom,
  Avatar,
} from '@mui/material';
import {
  CheckCircle as CompletedIcon,
  Lock as LockedIcon,
  School as EducationalIcon,
  People as SocialIcon,
  Code as TechnicalIcon,
  Star as SpecialIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/system';
import { useTheme as useThemeMui } from '@mui/material/styles';

// Анимация пульсации
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
  }
`;

// Анимация для наведения
const shine = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const StyledCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
  },
}));

const CardOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 1,
}));

const CompletionBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 10,
  right: 10,
  zIndex: 2,
  animation: `${pulse} 2s infinite`,
}));

const PulsingButton = styled(Button)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)',
    transform: 'rotate(30deg)',
    transition: 'all 0.6s ease',
    backgroundSize: '200% 200%',
    animation: `${shine} 3s infinite linear`,
    opacity: 0,
  },
  '&:hover::after': {
    opacity: 1,
  },
}));

const CategoryChip = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: 10,
  left: 10,
  zIndex: 2,
  fontWeight: 'bold',
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const PointsBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 10,
  right: 10,
  zIndex: 2,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  color: '#fff',
  borderRadius: '12px',
  padding: theme.spacing(0.5, 1),
  fontWeight: 'bold',
}));

// Интерфейс для карточки игры/задания
export interface GameCardProps {
  id: string;
  title: string;
  description: string;
  imageSrc?: string;
  level: number;
  points: number;
  path: string;
  isCompleted: boolean;
  isLocked: boolean;
  category: 'educational' | 'social' | 'technical' | 'special' | 'education' | 'practice' | 'challenge';
  onComplete?: (id: string) => void;
}

const defaultImages: Record<string, string> = {
  educational: 'https://source.unsplash.com/random/300x200/?education',
  social: 'https://source.unsplash.com/random/300x200/?social',
  technical: 'https://source.unsplash.com/random/300x200/?technology',
  special: 'https://source.unsplash.com/random/300x200/?award',
  education: 'https://source.unsplash.com/random/300x200/?education',
  practice: 'https://source.unsplash.com/random/300x200/?practice',
  challenge: 'https://source.unsplash.com/random/300x200/?challenge',
};

const GameCard: React.FC<GameCardProps> = ({
  id,
  title,
  description,
  imageSrc,
  level,
  points,
  path,
  isCompleted,
  isLocked,
  category,
  onComplete = () => {},
}) => {
  const theme = useThemeMui();

  // Определение цвета и имени категории
  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'educational':
      case 'education':
        return { color: theme.palette.info.main, name: 'Обучение', icon: <EducationalIcon /> };
      case 'social':
        return { color: theme.palette.success.main, name: 'Социальное', icon: <SocialIcon /> };
      case 'technical':
        return { color: theme.palette.warning.main, name: 'Техническое', icon: <TechnicalIcon /> };
      case 'special':
        return { color: theme.palette.error.main, name: 'Особое', icon: <SpecialIcon /> };
      case 'practice':
        return { color: theme.palette.secondary.main, name: 'Практика', icon: <EducationalIcon /> };
      case 'challenge':
        return { color: theme.palette.error.main, name: 'Испытание', icon: <SpecialIcon /> };
      default:
        return { color: theme.palette.primary.main, name: 'Обучение', icon: <EducationalIcon /> };
    }
  };

  const categoryInfo = getCategoryInfo(category);
  const imageUrl = imageSrc || defaultImages[category as keyof typeof defaultImages] || defaultImages.educational;

  // Обработчик нажатия на кнопку
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete(id);
  };

  return (
    <Zoom in={true} style={{ transitionDelay: '100ms' }}>
      <StyledCard elevation={isCompleted ? 1 : 3}>
        {/* Плашка категории */}
        <CategoryChip
          label={categoryInfo.name}
          icon={categoryInfo.icon}
          sx={{ backgroundColor: categoryInfo.color, color: '#fff' }}
        />

        {/* Бейдж очков */}
        <PointsBadge>
          <TrophyIcon fontSize="small" />
          <Typography variant="body2">{points} XP</Typography>
        </PointsBadge>

        {/* Бейдж завершения */}
        {isCompleted && (
          <CompletionBadge>
            <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
              <CompletedIcon fontSize="small" />
            </Avatar>
          </CompletionBadge>
        )}

        {/* Наложение для заблокированных заданий */}
        {isLocked && (
          <CardOverlay>
            <Box sx={{ textAlign: 'center', color: 'white' }}>
              <LockedIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                Доступно с уровня {level}
              </Typography>
            </Box>
          </CardOverlay>
        )}

        <CardMedia
          component="img"
          height="140"
          image={imageUrl}
          alt=""
          sx={{
            filter: isCompleted ? 'grayscale(80%)' : isLocked ? 'blur(2px)' : 'none',
            transition: 'filter 0.3s ease',
            backgroundColor: categoryInfo.color + '33',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />

        <CardContent sx={{ 
          flexGrow: 1, 
          position: 'relative', 
          pt: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '50%' 
        }}>
          <Typography
            gutterBottom
            variant="h6"
            component="div"
            sx={{
              fontWeight: 'bold',
              color: isCompleted ? 'text.secondary' : 'text.primary',
              mb: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              opacity: isCompleted ? 0.7 : 1,
            }}
          >
            {description}
          </Typography>

          <Box sx={{ mt: 'auto' }}>
            <PulsingButton
              variant={isCompleted ? "outlined" : "contained"}
              color={isCompleted ? "success" : "primary"}
              fullWidth
              disabled={isLocked}
              onClick={handleButtonClick}
              startIcon={isCompleted ? <CompletedIcon /> : undefined}
              sx={{
                textTransform: 'none',
                fontWeight: 'bold',
                position: 'relative',
              }}
            >
              {isCompleted ? 'Пройдено' : 'Начать'}
            </PulsingButton>
          </Box>
        </CardContent>
      </StyledCard>
    </Zoom>
  );
};

export default GameCard; 