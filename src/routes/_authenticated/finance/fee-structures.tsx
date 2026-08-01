import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
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
import { useFeeStructures, useFeeHeads } from "@/hooks/useFinance";

export const Route = createFileRoute("/_authenticated/finance/fee-structures")({
  component: FeeStructuresPage,
});

function FeeStructuresPage() {
  const { data: structures, isLoading: isLoadingStructures } = useFeeStructures();
  const { data: heads, isLoading: isLoadingHeads } = useFeeHeads();
  const [activeTab, setActiveTab] = useState<"structures" | "heads">("structures");

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Fee Structures & Heads"
        description="Configure fee heads and group them into structures for programs."
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {activeTab === "structures" ? "New Fee Structure" : "New Fee Head"}
          </Button>
        }
      />

      <div className="flex border-b border-border">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "structures"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("structures")}
        >
          Fee Structures
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "heads"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("heads")}
        >
          Fee Heads
        </button>
      </div>

      {activeTab === "structures" && (
        <Card>
          <CardHeader>
            <CardTitle>Fee Structures</CardTitle>
            <CardDescription>
              Combinations of fee heads applied to students for an academic year.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStructures ? (
              <div className="py-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Program ID</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {structures?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No fee structures found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    structures?.map((structure) => (
                      <TableRow key={structure.id}>
                        <TableCell className="font-medium">{structure.name}</TableCell>
                        <TableCell>{structure.program_id}</TableCell>
                        <TableCell>
                          $
                          {structure.total_amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Edit
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

      {activeTab === "heads" && (
        <Card>
          <CardHeader>
            <CardTitle>Fee Heads</CardTitle>
            <CardDescription>
              Individual components of a fee structure (e.g., Tuition, Library).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHeads ? (
              <div className="py-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Refundable</TableHead>
                    <TableHead className="text-right">Default Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {heads?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No fee heads found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    heads?.map((head) => (
                      <TableRow key={head.id}>
                        <TableCell className="font-medium">{head.name}</TableCell>
                        <TableCell>{head.code}</TableCell>
                        <TableCell className="capitalize">
                          {head.frequency.replace("_", " ")}
                        </TableCell>
                        <TableCell>{head.is_refundable ? "Yes" : "No"}</TableCell>
                        <TableCell className="text-right">
                          {head.default_amount ? `$${head.default_amount.toLocaleString()}` : "-"}
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
