import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Stepper,
  Step,
  StepLabel,
  Grid,
  useTheme,
  Alert
} from '@mui/material';
import HelpRequestForm from '../components/HelpRequestForm';

const RequestFormPage: React.FC = () => {
  const theme = useTheme();

  return (
    <Container maxWidth="md" sx={{ pt: 4, pb: 8 }}>
      <Box sx={{ mb: 4 }}>
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
          Запрос помощи волонтеров
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Заполните форму ниже, чтобы запросить помощь. Наши волонтеры готовы оказать поддержку в различных ситуациях.
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          После отправки запроса, вы получите уведомление когда волонтер примет его в работу.
        </Alert>
      </Box>

      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: 6
          }
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ mb: 4 }}>
              <Stepper activeStep={0} alternativeLabel>
                <Step>
                  <StepLabel>Заполнение формы</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Проверка модераторами</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Назначение волонтера</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Выполнение запроса</StepLabel>
                </Step>
              </Stepper>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <HelpRequestForm />
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default RequestFormPage; 