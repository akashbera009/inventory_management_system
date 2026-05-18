import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, icon: Icon, description, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="p-2 bg-muted rounded-md">
          <Icon size={16} className="text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && (
          <div className={cn(
            "text-xs mt-1 font-medium",
            trend.isPositive ? "text-emerald-500" : "text-destructive"
          )}>
            {trend.isPositive ? '↑' : '↓'} {trend.value} from last month
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Add helper for cn
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
