import React, { useEffect, useRef } from 'react';
import { keyframes } from '@mui/system';
import { Box } from '@mui/material';

interface ConfettiProps {
  duration?: number;
  particleCount?: number;
  colors?: string[];
  onAnimationComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  vx: number;
  vy: number;
  vr: number;
  shape: 'square' | 'circle' | 'triangle';
}

const Confetti: React.FC<ConfettiProps> = ({
  duration = 4000,
  particleCount = 120,
  colors = [
    '#1E88E5', // blue
    '#43A047', // green
    '#FFC107', // amber
    '#E53935', // red
    '#8E24AA', // purple
    '#FF9800', // orange
    '#00ACC1', // cyan
  ],
  onAnimationComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number>(0);

  // Инициализация частиц конфетти
  const initParticles = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Устанавливаем размер холста равным размеру окна
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Создаем частицы
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      const shape = Math.random() < 0.33 
        ? 'circle' 
        : Math.random() < 0.5 
          ? 'square' 
          : 'triangle';
      
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5 - canvas.height * 0.2, // Начинаем сверху
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vx: Math.random() * 6 - 3, // Горизонтальная скорость
        vy: Math.random() * 3 + 2, // Вертикальная скорость (падение)
        vr: Math.random() * 4 - 2, // Скорость вращения
        shape
      });
    }
  };

  // Отрисовка частиц на холсте
  const drawParticles = (timestamp: number) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Очищаем холст
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Если это первый кадр, записываем начальное время
    if (startTimeRef.current === 0) {
      startTimeRef.current = timestamp;
    }
    
    // Проверяем, не истекло ли время анимации
    const elapsedTime = timestamp - startTimeRef.current;
    if (elapsedTime > duration) {
      // Останавливаем анимацию
      cancelAnimationFrame(animationRef.current);
      
      // Вызываем функцию завершения анимации, если она предоставлена
      if (onAnimationComplete) {
        setTimeout(onAnimationComplete, 100);
      }
      return;
    }
    
    // Фактор затухания для постепенного исчезновения частиц
    const fadeOut = Math.max(0, 1 - elapsedTime / duration);
    
    // Отрисовываем и обновляем каждую частицу
    particlesRef.current.forEach(particle => {
      ctx.save();
      
      // Применяем прозрачность
      ctx.globalAlpha = fadeOut;
      
      // Перемещаемся к позиции частицы и применяем вращение
      ctx.translate(particle.x, particle.y);
      ctx.rotate((particle.rotation * Math.PI) / 180);
      
      // Устанавливаем цвет
      ctx.fillStyle = particle.color;
      
      // Рисуем форму частицы
      if (particle.shape === 'square') {
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      } else if (particle.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (particle.shape === 'triangle') {
        const size = particle.size;
        ctx.beginPath();
        ctx.moveTo(0, -size / 2);
        ctx.lineTo(-size / 2, size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.restore();
      
      // Обновляем позицию и вращение частицы
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.rotation += particle.vr;
      
      // Слегка замедляем по горизонтали (сопротивление воздуха)
      particle.vx *= 0.99;
      
      // Эффект гравитации
      particle.vy += 0.1;
    });
    
    // Продолжаем анимацию
    animationRef.current = requestAnimationFrame(drawParticles);
  };

  // Инициализация и старт анимации
  useEffect(() => {
    initParticles();
    
    // Начинаем анимацию
    animationRef.current = requestAnimationFrame(drawParticles);
    
    // Сброс анимации при изменении размера окна
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Очистка при размонтировании
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </Box>
  );
};

export default Confetti; 