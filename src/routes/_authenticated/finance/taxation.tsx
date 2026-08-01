import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTaxRules } from "@/hooks/finance/useTaxation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/finance/taxation")({
  component: TaxationPage,
});

function TaxationPage() {
  const { data: rules, isLoading } = useTaxRules();

  if (isLoading) return <div className="p-8">Loading tax rules...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Taxation</h1>
          <p className="text-muted-foreground">Manage GST, TDS, VAT rules and certificates</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Tax Rule
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rules?.map((rule) => (
          <Card key={rule.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{rule.name}</CardTitle>
                  <CardDescription>{rule.type.toUpperCase()}</CardDescription>
                </div>
                <Badge variant={rule.is_active ? "default" : "secondary"}>
                  {rule.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-4">
                <p className="text-3xl font-bold">{rule.percentage}%</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {rules?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed rounded-lg">
            No tax rules configured.
          </div>
        )}
      </div>
    </div>
  );
}
