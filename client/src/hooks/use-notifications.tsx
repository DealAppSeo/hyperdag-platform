import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Notification } from '@shared/schema';
import { useRealtimeQuery } from './use-realtime-query';

export interface NotificationResponse {
  success: boolean;
  data: Notification[];
}

export interface UnreadCountResponse {
  success: boolean;
  data: { count: number };
}

export function useNotifications() {
  // ✅ REAL-TIME: Notifications (NO 60s polling!)
  const {
    data: notificationsResponse,
    isLoading: isLoadingNotifications,
    error: notificationsError
  } = useRealtimeQuery<NotificationResponse>({
    queryKey: ["/api/notifications"],
    placeholderData: { success: true, data: [] },
    staleTime: 30000,
    supabaseTable: 'notifications' // ✅ Real-time instead of polling
  });

  // ✅ REAL-TIME: Unread count (NO 60s polling!)
  const {
    data: unreadCountResponse,
    isLoading: isLoadingUnreadCount,
    error: unreadCountError
  } = useRealtimeQuery<UnreadCountResponse>({
    queryKey: ["/api/notifications/unread-count"],
    placeholderData: { success: true, data: { count: 0 } },
    staleTime: 30000,
    supabaseTable: 'notifications' // ✅ Real-time instead of polling
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("POST", `/api/notifications/${notificationId}/mark-read`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark notification as read",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notifications/mark-all-read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "All notifications marked as read",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark all notifications as read",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAsRead = useCallback((notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  // Extract the actual data from the wrapped responses
  const notifications = notificationsResponse?.success ? notificationsResponse.data || [] : [];
  const unreadCount = unreadCountResponse?.success ? unreadCountResponse.data?.count || 0 : 0;

  return {
    notifications,
    unreadCount,
    isLoadingNotifications,
    isLoadingUnreadCount,
    markAsRead,
    markAllAsRead,
    error: notificationsError || unreadCountError,
  };
}
