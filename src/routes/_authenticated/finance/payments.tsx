import { createFileRoute } from "@tanstack/react-router";
import { Receipt, Search } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { usePayments } from "@/hooks/useFinance";
import { PaymentCollector } from "@/components/finance/PaymentCollector";

export const Route = createFileRoute("/_authenticated/finance/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const { data: payments, isLoading } = usePayments();
  const [search, setSearch] = useState("");

  const filteredPayments = payments?.filter(
    (p) =>
      p.receipt_number.toLowerCase().includes(search.toLowerCase()) ||
      p.student_id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Payments & Receipts"
        description="Record incoming payments, process refunds, and view transaction history."
        actions={<PaymentCollector />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>A chronological list of all payments received.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by receipt or student ID..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No payments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments?.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        {payment.receipt_number}
                      </TableCell>
                      <TableCell>{payment.student_id}</TableCell>
                      <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize">
                        {payment.payment_mode.replace("_", " ")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === "successful"
                              ? "default"
                              : payment.status === "failed"
                                ? "destructive"
                                : payment.status === "refunded"
                                  ? "secondary"
                                  : "outline"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Print
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
    </div>
  );
}
