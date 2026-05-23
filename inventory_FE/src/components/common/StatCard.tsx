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
  variant?: 'default' | 'rose' | 'emerald' | 'blue' | 'amber' | 'violet';
}

const variantStyles = {
  default: {
    wrapper: "bg-muted text-muted-foreground",
    icon: "text-muted-foreground",
    card: "hover:border-primary/20",
  },
  rose: {
    wrapper: "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400",
    icon: "text-rose-600 dark:text-rose-400",
    card: "hover:border-rose-500/30 hover:shadow-md hover:shadow-rose-500/5",
  },
  emerald: {
    wrapper: "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    icon: "text-emerald-600 dark:text-emerald-400",
    card: "hover:border-emerald-500/30 hover:shadow-md hover:shadow-emerald-500/5",
  },
  blue: {
    wrapper: "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
    icon: "text-blue-600 dark:text-blue-400",
    card: "hover:border-blue-500/30 hover:shadow-md hover:shadow-blue-500/5",
  },
  amber: {
    wrapper: "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",
    icon: "text-amber-600 dark:text-amber-400",
    card: "hover:border-amber-500/30 hover:shadow-md hover:shadow-amber-500/5",
  },
  violet: {
    wrapper: "bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400",
    icon: "text-violet-600 dark:text-violet-400",
    card: "hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/5",
  },
};

export function StatCard({ title, value, icon: Icon, description, trend, variant = 'default' }: StatCardProps) {
  const styles = variantStyles[variant] || variantStyles.default;
  return (
    <Card className={cn("transition-all duration-300 hover:-translate-y-1 hover:shadow-lg", styles.card)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("p-2 rounded-md transition-colors", styles.wrapper)}>
          <Icon size={16} className={styles.icon} />
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
