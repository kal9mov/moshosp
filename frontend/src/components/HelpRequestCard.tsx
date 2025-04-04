import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { HelpRequest } from '../store/requestStore';
import { 
  getCategoryName, 
  getStatusName, 
  getPriorityName, 
  formatDate 
} from '../utils/helpers';

interface HelpRequestCardProps {
  request: HelpRequest;
}

const HelpRequestCard: React.FC<HelpRequestCardProps> = ({ request }) => {
  const navigate = useNavigate();

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
      } 
    }}>
      <CardContent sx={{ pt: 2, pb: 1, flexGrow: 1 }}>
        <Typography
          variant="h6"
          component="div"
          sx={{ fontWeight: 'bold', mb: 1 }}
        >
          {request.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip
            label={getCategoryName(request.category)}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            label={getPriorityName(request.priority)}
            size="small"
            color="secondary"
            variant="outlined"
          />
          <Chip
            label={getStatusName(request.status)}
            size="small"
            color={
              request.status === 'new' ? 'info' :
              request.status === 'in_progress' ? 'warning' :
              request.status === 'completed' ? 'success' : 'default'
            }
          />
        </Box>

        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {request.description}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Локация: {request.location}
        </Typography>
        
        {request.createdAt && (
          <Typography variant="body2" color="text.secondary">
            Создан: {formatDate(request.createdAt)}
          </Typography>
        )}
      </CardContent>
      
      <CardActions>
        <Button 
          size="small" 
          onClick={() => navigate(`/requests/${request.id}`)}
        >
          Подробнее
        </Button>
      </CardActions>
    </Card>
  );
};

export default HelpRequestCard; 