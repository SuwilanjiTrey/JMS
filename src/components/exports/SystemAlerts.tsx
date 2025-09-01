import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import SystemAlert from '@/models/system_alert';


// System Alerts Component
const SystemAlerts = ({ alerts }: { alerts: SystemAlert[] }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <Alert key={alert.id} className={
          alert.type === 'error' ? 'border-red-500' :
            alert.type === 'warning' ? 'border-yellow-500' :
              'border-blue-500'
        }>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <span className="text-sm">{alert.message}</span>
            <span className="text-xs text-muted-foreground">
              {alert.timestamp}
            </span>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};


export default SystemAlerts;