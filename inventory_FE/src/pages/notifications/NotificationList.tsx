import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notificationService } from '@/features/notifications/services/notificationService';

export function NotificationList() {
  const queryClient = useQueryClient();

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
    },
  });

  const notifications = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with system alerts and activity.</p>
        </div>
      </div>

      <div className="grid gap-4 max-w-3xl">
        {isLoading ? (
          <div className="text-center py-10">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10 bg-muted rounded-lg border border-dashed">
            <Bell size={40} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notifications found.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <Card key={notif.id} className={cn("transition-colors", notif.isRead ? "opacity-60" : "border-primary/20 bg-primary/5")}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-background rounded-full">
                    <Bell size={16} className="text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{notif.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {!notif.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => markReadMutation.mutate(notif.id)}
                  >
                    <CheckCircle size={14} />
                    Mark as read
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

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
