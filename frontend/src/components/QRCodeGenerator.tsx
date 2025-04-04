import React from 'react';
import QRCode from 'react-qr-code';
import { Box, Typography, Paper, useTheme } from '@mui/material';

interface QRCodeGeneratorProps {
  url: string;
  title?: string;
  description?: string;
  size?: number;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  url,
  title = 'Сканируйте QR-код',
  description = 'Наведите камеру смартфона для доступа к платформе',
  size = 200,
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: size + 100,
        mx: 'auto',
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {title && (
        <Typography variant="h6" gutterBottom textAlign="center">
          {title}
        </Typography>
      )}
      
      <Box
        sx={{
          p: 2,
          backgroundColor: 'white',
          borderRadius: 1,
          mb: 2,
          boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.05)',
        }}
      >
        <QRCode value={url} size={size} />
      </Box>
      
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ maxWidth: size - 20 }}
        >
          {description}
        </Typography>
      )}
    </Paper>
  );
};

export default QRCodeGenerator; 