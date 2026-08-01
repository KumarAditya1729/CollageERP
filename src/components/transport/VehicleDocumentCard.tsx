/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Truck } from "lucide-react";

export function VehicleDocumentCard({
  document,
  onClick,
}: {
  document: any;
  onClick?: () => void;
}) {
  const isExpired = document.expiry_date ? new Date(document.expiry_date) < new Date() : false;

  return (
    <Card className="hover:border-primary/50 cursor-pointer transition-all" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-md font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-500" />
            {document.document_type}
          </CardTitle>
          <Badge variant={isExpired ? "destructive" : "default"}>
            {isExpired ? "EXPIRED" : "VALID"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Truck className="h-4 w-4" />{" "}
            {document.trn_vehicles?.registration_number || "Unknown Vehicle"}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" /> Expiry:{" "}
            {document.expiry_date ? new Date(document.expiry_date).toLocaleDateString() : "N/A"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
