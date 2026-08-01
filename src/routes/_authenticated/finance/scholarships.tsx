import { createFileRoute } from "@tanstack/react-router";
import { Award, Percent } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useScholarships, useDiscounts } from "@/hooks/useFinance";

export const Route = createFileRoute("/_authenticated/finance/scholarships")({
  component: ScholarshipsPage,
});

function ScholarshipsPage() {
  const { data: scholarships, isLoading: isLoadingScholarships } = useScholarships();
  const { data: discounts, isLoading: isLoadingDiscounts } = useDiscounts();
  const [activeTab, setActiveTab] = useState<"scholarships" | "discounts">("scholarships");

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Scholarships & Discounts"
        description="Manage financial aid, merit scholarships, and fee waivers."
        actions={
          <Button>
            <Award className="mr-2 h-4 w-4" />
            {activeTab === "scholarships" ? "New Scholarship" : "New Discount"}
          </Button>
        }
      />

      <div className="flex border-b border-border">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "scholarships"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("scholarships")}
        >
          Scholarships
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "discounts"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("discounts")}
        >
          Discounts & Waivers
        </button>
      </div>

      {activeTab === "scholarships" && (
        <Card>
          <CardHeader>
            <CardTitle>Active Scholarships</CardTitle>
            <CardDescription>
              Scholarships available to students based on merit, sports, or need.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingScholarships ? (
              <div className="py-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scholarships?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No scholarships found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    scholarships?.map((scholarship) => (
                      <TableRow key={scholarship.id}>
                        <TableCell className="font-medium">
                          {scholarship.name}
                          <div className="text-xs text-muted-foreground">{scholarship.code}</div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {scholarship.type.replace("_", " ")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {scholarship.amount_type === "percentage"
                              ? `${scholarship.amount_value}%`
                              : `$${scholarship.amount_value.toLocaleString()}`}
                          </Badge>
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

      {activeTab === "discounts" && (
        <Card>
          <CardHeader>
            <CardTitle>Discounts & Waivers</CardTitle>
            <CardDescription>
              General fee waivers such as staff ward discounts or sibling concessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDiscounts ? (
              <div className="py-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discounts?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No discounts found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    discounts?.map((discount) => (
                      <TableRow key={discount.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Percent className="h-4 w-4 text-muted-foreground" />
                          {discount.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {discount.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {discount.amount_type === "percentage"
                              ? `${discount.amount_value}%`
                              : `$${discount.amount_value.toLocaleString()}`}
                          </Badge>
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
    </div>
  );
}
