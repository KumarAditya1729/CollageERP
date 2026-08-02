import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IntegrationCatalogItem, TenantIntegration } from "@/lib/integrations";
import { CreditCard, DollarSign, MessageCircle, ScanFace, ScanLine, Video, Plug, Settings2, CheckCircle2, XCircle } from "lucide-react";

interface IntegrationCardProps {
  catalogItem: IntegrationCatalogItem;
  integration?: TenantIntegration;
  onConfigure: (item: IntegrationCatalogItem, existing?: TenantIntegration) => void;
}

export function IntegrationCard({ catalogItem, integration, onConfigure }: IntegrationCardProps) {
  const isConnected = integration?.is_enabled && integration?.status === "connected";

  const renderIcon = () => {
    switch (catalogItem.icon_name) {
      case "CreditCard":
        return <CreditCard className="size-6 text-primary" />;
      case "DollarSign":
        return <DollarSign className="size-6 text-primary" />;
      case "MessageCircle":
        return <MessageCircle className="size-6 text-emerald-600" />;
      case "ScanFace":
        return <ScanFace className="size-6 text-blue-600" />;
      case "ScanLine":
        return <ScanLine className="size-6 text-amber-600" />;
      case "Video":
        return <Video className="size-6 text-indigo-600" />;
      default:
        return <Plug className="size-6 text-muted-foreground" />;
    }
  };

  return (
    <Card className="flex flex-col h-full justify-between shadow-sm hover:shadow-md transition-shadow">
      <div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 flex items-center justify-center">
              {renderIcon()}
            </div>
            <CardTitle className="text-base font-semibold">{catalogItem.display_name}</CardTitle>
          </div>
          {isConnected ? (
            <Badge variant="default" className="flex items-center gap-1 text-xs">
              <CheckCircle2 className="size-3" /> Connected
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1 text-xs text-muted-foreground">
              <XCircle className="size-3" /> Disconnected
            </Badge>
          )}
        </CardHeader>
        <CardContent className="pt-2">
          <CardDescription className="text-sm leading-relaxed text-muted-foreground">
            {catalogItem.description}
          </CardDescription>
        </CardContent>
      </div>
      <CardFooter className="pt-4 border-t bg-muted/20 flex items-center justify-between">
        <span className="text-xs text-muted-foreground capitalize font-medium">
          {catalogItem.category} Module
        </span>
        <Button
          variant={isConnected ? "outline" : "default"}
          size="sm"
          onClick={() => onConfigure(catalogItem, integration)}
          className="gap-2 text-xs h-8"
        >
          <Settings2 className="size-3.5" />
          {isConnected ? "Configure / Disable" : "Connect"}
        </Button>
      </CardFooter>
    </Card>
  );
}
