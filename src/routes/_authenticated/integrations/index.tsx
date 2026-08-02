import { createFileRoute } from "@tanstack/react-router";
import { Plug, RefreshCw } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/common/page-header";
import { ErrorState, InlineLoader } from "@/components/common/states";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { IntegrationConfigModal } from "@/components/integrations/IntegrationConfigModal";
import { useTenantIntegrations } from "@/hooks/useIntegrations";
import { INTEGRATION_CATALOG, IntegrationCatalogItem, TenantIntegration } from "@/lib/integrations";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/integrations/")({
  head: () => ({
    meta: [
      { title: "Integrations & Gateways — CampusOS" },
      { name: "description", content: "Connect biometrics, WhatsApp messaging APIs, and online fee payment gateways." },
    ],
  }),
  component: IntegrationsPage,
  errorComponent: ({ error }) => <ErrorState title="Could not load integrations" description={error.message} />,
});

function IntegrationsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<IntegrationCatalogItem | null>(null);
  const [activeIntegration, setActiveIntegration] = useState<TenantIntegration | undefined>(undefined);

  const { data: tenantIntegrations = [], isLoading, error, refetch } = useTenantIntegrations(
    selectedCategory === "all" ? undefined : selectedCategory
  );

  const handleConfigure = (item: IntegrationCatalogItem, existing?: TenantIntegration) => {
    setActiveItem(item);
    setActiveIntegration(existing);
    setModalOpen(true);
  };

  if (error) {
    return (
      <ErrorState
        title="Could not load integration status"
        description={error.message}
        onRetry={() => void refetch()}
      />
    );
  }

  const filteredCatalog = selectedCategory === "all" 
    ? INTEGRATION_CATALOG 
    : INTEGRATION_CATALOG.filter(c => c.category === selectedCategory);

  return (
    <>
      <PageHeader
        title="App & Hardware Integrations"
        description="Connect third-party enterprise services, payment gateways, and physical biometric attendance devices directly to CampusOS."
        crumbs={[{ label: "Administration" }, { label: "Integrations" }]}
        actions={
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCw className="mr-2 size-4" />
            Refresh Status
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-4 mb-6">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-5 h-9">
            <TabsTrigger value="all" className="text-xs">All Modules</TabsTrigger>
            <TabsTrigger value="payment" className="text-xs">Payment</TabsTrigger>
            <TabsTrigger value="communication" className="text-xs">Communication</TabsTrigger>
            <TabsTrigger value="biometrics" className="text-xs">Biometrics & RFID</TabsTrigger>
            <TabsTrigger value="meeting" className="text-xs">Virtual Classrooms</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <InlineLoader label="Querying connection status..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCatalog.map((item) => {
            const existing = tenantIntegrations.find(ti => ti.provider_name === item.provider_name);
            return (
              <IntegrationCard
                key={item.provider_name}
                catalogItem={item}
                integration={existing}
                onConfigure={handleConfigure}
              />
            );
          })}
        </div>
      )}

      {modalOpen && (
        <IntegrationConfigModal
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) {
              setActiveItem(null);
              setActiveIntegration(undefined);
            }
          }}
          catalogItem={activeItem}
          existing={activeIntegration}
        />
      )}
    </>
  );
}
