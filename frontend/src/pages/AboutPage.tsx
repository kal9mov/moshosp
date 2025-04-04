import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  useTheme,
  Divider,
  Avatar,
  Card,
  CardContent,
  CardMedia
} from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';
import {
  Handshake as VolunteerIcon,
  EmojiPeople as PeopleIcon,
  Favorite as HeartIcon,
  Public as WorldIcon
} from '@mui/icons-material';

const AboutPage: React.FC = () => {
  const theme = useTheme();

  // Массив с основными принципами
  const principles = [
    {
      title: 'Взаимопомощь',
      description: 'Мы верим, что взаимная поддержка делает общество сильнее и устойчивее к трудностям',
      icon: <PeopleIcon fontSize="large" />
    },
    {
      title: 'Доступность',
      description: 'Наша помощь доступна всем, кто в ней нуждается, независимо от социального статуса',
      icon: <WorldIcon fontSize="large" />
    },
    {
      title: 'Доброта',
      description: 'Мы руководствуемся искренним желанием сделать жизнь окружающих немного лучше',
      icon: <HeartIcon fontSize="large" />
    },
    {
      title: 'Ответственность',
      description: 'Мы берем на себя ответственность за свои действия и стараемся доводить начатое до конца',
      icon: <VolunteerIcon fontSize="large" />
    }
  ];

  // История проекта
  const historyTimeline = [
    {
      year: '2020',
      title: 'Основание движения',
      description: 'Начало деятельности в период пандемии COVID-19 с помощи пожилым людям'
    },
    {
      year: '2021',
      title: 'Расширение деятельности',
      description: 'Добавление новых направлений помощи и увеличение количества волонтеров'
    },
    {
      year: '2022',
      title: 'Запуск онлайн-платформы',
      description: 'Создание первой версии цифровой платформы для координации волонтеров'
    },
    {
      year: '2023',
      title: 'Создание учебных программ',
      description: 'Запуск программ обучения для волонтеров и профессионального развития'
    },
    {
      year: '2024',
      title: 'Обновление платформы',
      description: 'Выпуск новой версии с расширенными возможностями и геймификацией'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
      <Box sx={{ mb: 6 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 'bold',
            color: theme.palette.primary.main,
            position: 'relative',
            mb: 3,
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
          О проекте
        </Typography>

        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            mb: 5
          }}
        >
          <Typography variant="h5" component="h2" gutterBottom>
            Миссия
          </Typography>
          <Typography variant="body1" paragraph>
            Наша миссия — объединять людей для взаимопомощи и создавать сообщество, где каждый может получить поддержку в трудной ситуации. Мы стремимся сделать волонтерскую деятельность доступной, эффективной и приносящей удовлетворение каждому участнику.
          </Typography>
          <Typography variant="body1" paragraph>
            Проект "Московское волонтерское движение" был создан как ответ на растущую потребность в координации помощи между волонтерами и теми, кто нуждается в поддержке. Мы развиваем культуру добровольчества и взаимопомощи в городе, делая общество более гуманным и отзывчивым.
          </Typography>
        </Paper>

        {/* Основные принципы */}
        <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
          Наши принципы
        </Typography>
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {principles.map((principle, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 2,
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ 
                    mb: 2, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    color: theme.palette.primary.main 
                  }}>
                    {principle.icon}
                  </Box>
                  <Typography gutterBottom variant="h6" component="h3">
                    {principle.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {principle.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* История проекта */}
        <Typography variant="h5" component="h2" sx={{ mb: 4 }}>
          История проекта
        </Typography>
        <Box sx={{ mb: 6 }}>
          <Timeline position="alternate">
            {historyTimeline.map((item, index) => (
              <TimelineItem key={index}>
                <TimelineSeparator>
                  <TimelineDot color="primary" />
                  {index < historyTimeline.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Paper 
                    elevation={2} 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      '&:hover': {
                        boxShadow: 3
                      }
                    }}
                  >
                    <Typography variant="h6" component="span" color="primary">
                      {item.year}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2">
                      {item.description}
                    </Typography>
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </Box>

        {/* Команда */}
        <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
          Команда проекта
        </Typography>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="body1" paragraph>
            За проектом стоит команда энтузиастов, объединенных желанием сделать мир немного лучше. Мы работаем над развитием платформы, координацией волонтеров и поддержкой участников проекта.
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 6 }}>
          {[1, 2, 3, 4].map((item, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)'
                  }
                }}
              >
                <Avatar
                  src={`/images/team-${index + 1}.jpg`}
                  alt={`Член команды ${index + 1}`}
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    mb: 2,
                    boxShadow: 2
                  }}
                />
                <Typography variant="h6" gutterBottom>
                  {['Александр', 'Мария', 'Дмитрий', 'Елена'][index]}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  {[
                    'Руководитель проекта',
                    'Координатор волонтеров',
                    'Технический директор',
                    'Менеджер по развитию'
                  ][index]}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default AboutPage; 