import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBankAccounts } from "@/hooks/finance/useReconciliation";
import { BankStatementImporter } from "@/components/finance/BankStatementImporter";


export const Route = createFileRoute("/_authenticated/finance/reconciliation")({
  component: ReconciliationPage,
});

function ReconciliationPage() {
  const { data: accounts, isLoading } = useBankAccounts();

  if (isLoading) return <div className="p-8">Loading bank accounts...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank Reconciliation</h1>
          <p className="text-muted-foreground">Match bank statements with ledger transactions</p>
        </div>
        <BankStatementImporter />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts?.map((acc) => (
          <Card key={acc.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">{acc.bank_name}</CardTitle>
              <CardDescription>Acct: {acc.account_number}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground">System Balance</p>
                <p className="text-2xl font-bold">{(`₹${Number(acc.current_balance).toLocaleString('en-IN')}`)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {accounts?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed rounded-lg">
            No bank accounts linked yet.
          </div>
        )}
      </div>
    </div>
  );
}
