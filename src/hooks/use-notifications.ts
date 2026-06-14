import { useNotifications as useNotificationsContext } from '../context/notification-context';

export function useNotifications() {
  return useNotificationsContext();
}
