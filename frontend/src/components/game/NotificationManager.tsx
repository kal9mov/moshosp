import React from 'react';
import { useGameStore } from '../../store/gameStore';
import GameNotification from './GameNotification';

/**
 * Компонент для управления игровыми уведомлениями
 * Он подписывается на состояние уведомлений из хранилища 
 * и отображает их, когда они появляются
 */
const NotificationManager: React.FC = () => {
  const { currentNotification, isNotificationOpen, hideNotification } = useGameStore();

  const handleClose = () => {
    hideNotification();
  };

  // Ничего не рендерим, если нет уведомления
  if (!currentNotification) {
    return null;
  }

  return (
    <GameNotification
      event={currentNotification}
      open={isNotificationOpen}
      onClose={handleClose}
      autoHideDuration={6000}
    />
  );
};

export default NotificationManager; 