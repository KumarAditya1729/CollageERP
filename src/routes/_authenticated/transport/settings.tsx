import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/transport/settings")({
  component: TransportSettings,
});

function TransportSettings() {
  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Transport Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable GPS Tracking</Label>
              <div className="text-sm text-muted-foreground">
                Turn on real-time vehicle GPS tracking.
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Automated Maintenance Alerts</Label>
              <div className="text-sm text-muted-foreground">
                Notify mechanics before scheduled maintenance.
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Student SMS Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Send SMS when vehicle is approaching stop.
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
