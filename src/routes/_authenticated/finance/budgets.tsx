import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBudgets } from "@/hooks/finance/useBudgets";
import { BudgetPlanner } from "@/components/finance/BudgetPlanner";

export const Route = createFileRoute("/_authenticated/finance/budgets")({
  component: BudgetsPage,
});

function BudgetsPage() {
  const { data: budgets, isLoading } = useBudgets();

  if (isLoading) return <div className="p-8">Loading budgets...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">Manage and track departmental and program budgets</p>
        </div>
        <BudgetPlanner />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets?.map((budget) => (
          <Card key={budget.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{budget.name}</CardTitle>
                  <CardDescription>
                    {new Date(budget.start_date).toLocaleDateString()} -{" "}
                    {new Date(budget.end_date).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge variant={budget.status === "active" ? "default" : "secondary"}>
                  {budget.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground">Total Envelope</p>
                <p className="text-2xl font-bold">{`₹${Number(budget.total_amount).toLocaleString("en-IN")}`}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {budgets?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed rounded-lg">
            No budgets created yet. Plan a new budget to get started.
          </div>
        )}
      </div>
    </div>
  );
}
