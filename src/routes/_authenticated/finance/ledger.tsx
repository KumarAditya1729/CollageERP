import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, RefreshCw } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLedgers, useTransactions } from "@/hooks/useFinance";

export const Route = createFileRoute("/_authenticated/finance/ledger")({
  component: LedgerPage,
});

function LedgerPage() {
  const { data: ledgers, isLoading: isLoadingLedgers } = useLedgers();
  const { data: transactions, isLoading: isLoadingTransactions } = useTransactions();
  const [activeTab, setActiveTab] = useState<"accounts" | "journal">("journal");

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Financial Ledger"
        description="Double-entry accounting, Chart of Accounts, and Journal Entries."
        actions={
          <Button>
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate Trial Balance
          </Button>
        }
      />

      <div className="flex border-b border-border">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "journal"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("journal")}
        >
          Journal Entries
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "accounts"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("accounts")}
        >
          Chart of Accounts
        </button>
      </div>

      {activeTab === "journal" && (
        <Card>
          <CardHeader>
            <CardTitle>Journal Entries</CardTitle>
            <CardDescription>
              Chronological record of all financial transactions (Invoices, Payments, Refunds).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTransactions ? (
              <div className="py-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions?.map((trx) => (
                      <TableRow key={trx.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          {new Date(trx.transaction_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="capitalize">{trx.reference_type}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {trx.description || "-"}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                            {trx.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "accounts" && (
        <Card>
          <CardHeader>
            <CardTitle>Chart of Accounts</CardTitle>
            <CardDescription>
              The complete list of all ledgers categorized by Asset, Liability, Equity, Revenue, and
              Expense.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingLedgers ? (
              <div className="py-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No ledgers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledgers?.map((ledger) => (
                      <TableRow key={ledger.id}>
                        <TableCell className="font-medium">{ledger.account_code}</TableCell>
                        <TableCell>{ledger.account_name}</TableCell>
                        <TableCell className="capitalize">{ledger.account_type}</TableCell>
                        <TableCell>{ledger.is_group ? "Yes" : "No"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
