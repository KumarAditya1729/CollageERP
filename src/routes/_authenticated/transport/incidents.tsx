/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import {
  useTransportIncidents,
  useCreateTransportIncident,
  useUpdateTransportIncident,
  useDeleteTransportIncident,
  useTransportVehicles,
} from "@/hooks/transport/useTransport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/transport/incidents")({
  component: TransportIncidents,
});

function IncidentCard({ incident, onClick }: { incident: any; onClick?: () => void }) {
  return (
    <Card
      className="hover:border-primary/50 cursor-pointer transition-all border-l-4 border-l-destructive"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-md font-bold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {incident.incident_type}
          </CardTitle>
          <Badge variant={incident.status === "resolved" ? "default" : "destructive"}>
            {incident.status?.toUpperCase() || "UNKNOWN"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground mt-2">
          <div className="line-clamp-1">{incident.description || "No description"}</div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" /> Date:{" "}
            {incident.incident_date ? new Date(incident.incident_date).toLocaleDateString() : "N/A"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TransportIncidents() {
  const { data, isLoading } = useTransportIncidents();
  const { data: vehicles } = useTransportVehicles();
  const createMutation = useCreateTransportIncident();
  const updateMutation = useUpdateTransportIncident();
  const deleteMutation = useDeleteTransportIncident();

  return (
    <GridResourcePage
      title="Incidents"
      description="Manage transport incidents and accidents"
      data={data || []}
      isLoading={isLoading}
      CardComponent={(props: any) => <IncidentCard incident={props.item} {...props} />}
      createMutation={createMutation}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
      formSchema={{
        vehicle_id: {
          type: "select",
          label: "Vehicle",
          options: vehicles?.map((v: any) => ({ label: v.registration_number, value: v.id })) || [],
        },
        incident_type: {
          type: "select",
          label: "Type",
          options: [
            { label: "Accident", value: "accident" },
            { label: "Breakdown", value: "breakdown" },
            { label: "Violation", value: "violation" },
          ],
        },
        description: { type: "textarea", label: "Description" },
        incident_date: { type: "text", label: "Date (YYYY-MM-DD)" },
        status: {
          type: "select",
          label: "Status",
          options: [
            { label: "Reported", value: "reported" },
            { label: "Investigating", value: "investigating" },
            { label: "Resolved", value: "resolved" },
          ],
        },
      }}
      searchPlaceholder="Search incidents..."
    />
  );
}
