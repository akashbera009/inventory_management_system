import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { notificationService } from '@/features/notifications/services/notificationService';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateStr)) + ' IST';
}

export function NotificationList() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isBuyer = user?.role === 'BUYER';

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getNotifications,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const markReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Marked as read');
    },
    onError: () => toast.error('Failed to mark as read'),
  });

  const notifications = data?.data || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Loading notifications…</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-14 bg-muted rounded-xl border border-dashed">
            <Bell size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">No notifications yet.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <Card
              key={notif.id}
              className={cn(
                'transition-all border',
                notif.is_read
                  ? 'opacity-55 bg-muted/30'
                  : 'border-primary/25 bg-primary/5 shadow-sm'
              )}
            >
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={cn(
                    'mt-0.5 p-2 rounded-full shrink-0',
                    notif.is_read ? 'bg-muted' : 'bg-primary/10'
                  )}>
                    <Bell
                      size={15}
                      className={notif.is_read ? 'text-muted-foreground' : 'text-primary'}
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{notif.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(notif.created_at)}</p>
                  </div>
                </div>

                {/* Mark as read — BUYER only */}
                {isBuyer && !notif.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 shrink-0 text-xs"
                    disabled={markReadMutation.isPending}
                    onClick={() => markReadMutation.mutate(notif.id)}
                  >
                    <CheckCircle size={13} />
                    Mark read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
