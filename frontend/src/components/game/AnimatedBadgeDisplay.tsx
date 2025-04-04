import React from 'react';
import { 
  LightbulbOutlined, 
  EmojiEvents, 
  School, 
  Public, 
  Code, 
  Star, 
  TrendingUp 
} from '@mui/icons-material';
import { AnimatedReward } from '../../store/gameStore';
import AnimatedBadge from './AnimatedBadge';

interface AnimatedBadgeDisplayProps {
  reward: AnimatedReward;
  onAnimationComplete?: () => void;
}

const AnimatedBadgeDisplay: React.FC<AnimatedBadgeDisplayProps> = ({ 
  reward, 
  onAnimationComplete 
}) => {
  // Определяем иконку по типу награды и категории достижения
  const getRewardIcon = () => {
    if (reward.type === 'achievement' && reward.achievement) {
      switch (reward.achievement.category) {
        case 'educational':
          return <School fontSize="large" />;
        case 'social':
          return <Public fontSize="large" />;
        case 'technical':
          return <Code fontSize="large" />;
        case 'special':
          return <Star fontSize="large" />;
        default:
          return <EmojiEvents fontSize="large" />;
      }
    } else if (reward.type === 'level_up') {
      return <TrendingUp fontSize="large" />;
    }
    
    return <LightbulbOutlined fontSize="large" />;
  };

  // Определяем цвет по типу награды и редкости достижения
  const getRewardColor = (): string => {
    if (reward.type === 'achievement' && reward.achievement) {
      switch (reward.achievement.rarityLevel) {
        case 'common':
          return '#9E9E9E'; // Серый
        case 'uncommon':
          return '#4CAF50'; // Зеленый
        case 'rare':
          return '#2196F3'; // Синий
        case 'epic':
          return '#9C27B0'; // Фиолетовый
        case 'legendary':
          return '#FFC107'; // Золотой
        default:
          return '#9E9E9E';
      }
    } else if (reward.type === 'level_up') {
      return '#4CAF50'; // Зеленый для повышения уровня
    }
    
    return '#2196F3'; // Синий по умолчанию
  };

  return (
    <AnimatedBadge
      achievement={reward.type === 'achievement' ? reward.achievement : undefined}
      level={reward.type === 'level_up' ? reward.level : undefined}
      points={reward.points}
      title={reward.title}
      description={reward.description}
      icon={getRewardIcon()}
      color={getRewardColor()}
      onAnimationComplete={onAnimationComplete}
      autoHide={true}
      hideDelay={6000}
    />
  );
};

export default AnimatedBadgeDisplay; 