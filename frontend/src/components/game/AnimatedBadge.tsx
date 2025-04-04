import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Avatar, Fade, Grow, Zoom } from '@mui/material';
import { keyframes } from '@mui/system';
import { Achievement } from '../../store/gameStore';
import Confetti from './Confetti';

interface AnimatedBadgeProps {
  achievement?: Achievement;
  points?: number;
  level?: number;
  title: string;
  description?: string;
  icon: React.ReactNode;
  color: string;
  onAnimationComplete?: () => void;
  autoHide?: boolean;
  hideDelay?: number;
  showConfetti?: boolean;
}

// Анимация пульсации
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

// Анимация вращения
const rotate = keyframes`
  0% { transform: rotate(-10deg); }
  100% { transform: rotate(10deg); }
`;

// Анимация сияния
const glow = keyframes`
  0% { box-shadow: 0 0 5px 2px rgba(255, 215, 0, 0.3); }
  50% { box-shadow: 0 0 20px 10px rgba(255, 215, 0, 0.6); }
  100% { box-shadow: 0 0 5px 2px rgba(255, 215, 0, 0.3); }
`;

const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  achievement,
  points,
  level,
  title,
  description,
  icon,
  color,
  onAnimationComplete,
  autoHide = true,
  hideDelay = 5000,
  showConfetti = true
}) => {
  const [visible, setVisible] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [showConfettiEffect, setShowConfettiEffect] = useState(false);

  // Запускаем появление элемента после монтирования
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setVisible(true);
    }, 100);

    // Запускаем основную анимацию после появления
    const timer2 = setTimeout(() => {
      setAnimationStarted(true);
      if (showConfetti) {
        // Запускаем конфетти с небольшой задержкой для синхронизации с анимацией
        setTimeout(() => {
          setShowConfettiEffect(true);
        }, 300);
      }
    }, 600);

    // Автоматически скрываем элемент через заданное время
    let timer3: NodeJS.Timeout;
    if (autoHide) {
      timer3 = setTimeout(() => {
        setVisible(false);
        if (onAnimationComplete) {
          setTimeout(onAnimationComplete, 500);
        }
      }, hideDelay);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (autoHide) {
        clearTimeout(timer3);
      }
    };
  }, [autoHide, hideDelay, onAnimationComplete, showConfetti]);

  // Определяем стиль анимации в зависимости от типа достижения
  const getAnimationStyle = () => {
    if (achievement) {
      switch (achievement.rarityLevel) {
        case 'legendary':
          return {
            animation: `${pulse} 1.5s infinite, ${glow} 3s infinite`,
            transition: 'all 0.5s ease'
          };
        case 'epic':
          return {
            animation: `${pulse} 2s infinite`,
            transition: 'all 0.5s ease'
          };
        case 'rare':
          return {
            animation: `${rotate} 2s alternate infinite`,
            transition: 'all 0.4s ease'
          };
        default:
          return {
            transition: 'all 0.3s ease'
          };
      }
    } else if (level) {
      return {
        animation: `${pulse} 1.5s infinite, ${glow} 3s infinite`,
        transition: 'all 0.5s ease'
      };
    } else {
      return {
        transition: 'all 0.3s ease'
      };
    }
  };

  // Определяем цвета для конфетти в зависимости от типа достижения
  const getConfettiColors = () => {
    if (achievement) {
      switch (achievement.rarityLevel) {
        case 'legendary':
          return ['#FFC107', '#FFD54F', '#FFE082', '#FFECB3', '#FF9800', '#FF6F00'];
        case 'epic':
          return ['#9C27B0', '#BA68C8', '#CE93D8', '#E1BEE7', '#8E24AA', '#6A1B9A'];
        case 'rare':
          return ['#2196F3', '#64B5F6', '#90CAF9', '#BBDEFB', '#1976D2', '#0D47A1'];
        case 'uncommon':
          return ['#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9', '#388E3C', '#1B5E20'];
        default:
          return ['#9E9E9E', '#BDBDBD', '#E0E0E0', '#EEEEEE', '#757575', '#424242'];
      }
    } else if (level) {
      // Цвета для повышения уровня
      return ['#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9', '#388E3C', '#1B5E20', '#FFC107', '#FFD54F'];
    } else {
      // Стандартные цвета
      return ['#1E88E5', '#43A047', '#FFC107', '#E53935', '#8E24AA', '#FF9800', '#00ACC1'];
    }
  };

  // Определяем количество частиц конфетти в зависимости от редкости достижения
  const getConfettiCount = () => {
    if (achievement) {
      switch (achievement.rarityLevel) {
        case 'legendary': return 200;
        case 'epic': return 150;
        case 'rare': return 120;
        case 'uncommon': return 80;
        default: return 50;
      }
    } else if (level) {
      return 150; // Много конфетти для повышения уровня
    } else {
      return 100; // Стандартное количество
    }
  };

  return (
    <>
      {showConfettiEffect && (
        <Confetti 
          colors={getConfettiColors()} 
          particleCount={getConfettiCount()} 
          duration={5000}
        />
      )}
      
      <Fade in={visible} timeout={500}>
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: '400px',
            pointerEvents: 'none'
          }}
        >
          <Zoom in={visible} timeout={800}>
            <Paper
              elevation={24}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                overflow: 'hidden',
                width: '100%',
                position: 'relative'
              }}
            >
              {/* Фоновые декоративные элементы */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0.1,
                  background: `radial-gradient(circle, ${color}, transparent 70%)`,
                  pointerEvents: 'none'
                }}
              />
              
              {/* Иконка достижения */}
              <Grow in={animationStarted} timeout={1000}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: color,
                    mb: 2,
                    border: '4px solid white',
                    boxShadow: 3,
                    ...getAnimationStyle()
                  }}
                >
                  {icon}
                </Avatar>
              </Grow>
              
              {/* Заголовок */}
              <Typography 
                variant="h5" 
                align="center" 
                sx={{ 
                  fontWeight: 'bold',
                  mb: 1,
                  textShadow: '0px 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                {title}
              </Typography>
              
              {/* Описание */}
              {description && (
                <Typography 
                  variant="body1" 
                  align="center" 
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {description}
                </Typography>
              )}
              
              {/* Дополнительная информация */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                {points && (
                  <Zoom in={animationStarted} timeout={{ enter: 1500 }}>
                    <Typography 
                      variant="h6" 
                      color="warning.main"
                      sx={{ 
                        fontWeight: 'bold',
                        px: 2,
                        animation: `${pulse} 2s infinite`
                      }}
                    >
                      +{points} XP
                    </Typography>
                  </Zoom>
                )}
                
                {level && (
                  <Zoom in={animationStarted} timeout={{ enter: 1500 }}>
                    <Typography 
                      variant="h6" 
                      color="success.main"
                      sx={{ 
                        fontWeight: 'bold',
                        px: 2,
                        animation: `${pulse} 2s infinite`
                      }}
                    >
                      Уровень {level}
                    </Typography>
                  </Zoom>
                )}
                
                {achievement && (
                  <Zoom in={animationStarted} timeout={{ enter: 1500 }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(0,0,0,0.08)',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                        letterSpacing: 1
                      }}
                    >
                      {achievement.rarityLevel}
                    </Typography>
                  </Zoom>
                )}
              </Box>
            </Paper>
          </Zoom>
        </Box>
      </Fade>
    </>
  );
};

export default AnimatedBadge; 