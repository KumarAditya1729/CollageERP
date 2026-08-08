import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { useResourceList } from "@/hooks/useResource";
import { supabase } from "@/integrations/supabase/client";
import type { LateFeePolicy } from "@/lib/finance";

/* ------------------------------------------------------------------ *
 * Row shapes
 * ------------------------------------------------------------------ */

export interface FeeCategoryRow extends Record<string, unknown> {
  id: string;
  name: string;
  description: string | null;
}

export interface FeeHeadRow extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_refundable: boolean;
  frequency: "one_time" | "recurring" | "optional";
  tax_percent: number;
  default_amount: number | null;
}

export interface FeeStructureRow extends Record<string, unknown> {
  id: string;
  program_id: string;
  academic_year_id: string;
  fee_category_id: string | null;
  name: string;
  total_amount: number;
}

export interface FeeStructureItemRow extends Record<string, unknown> {
  id: string;
  fee_structure_id: string;
  fee_head_id: string;
  amount: number;
  is_mandatory: boolean;
}

export interface InstallmentRow extends Record<string, unknown> {
  id: string;
  fee_structure_id: string;
  name: string;
  due_date: string;
  percentage: number;
  late_fee_policy: LateFeePolicy | null;
}

export interface ScholarshipRow extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  description: string | null;
  type: "merit" | "need_based" | "sports" | "category";
  amount_type: "percentage" | "flat";
  amount_value: number;
}

export interface StudentScholarshipRow extends Record<string, unknown> {
  id: string;
  student_id: string;
  scholarship_id: string;
  academic_year_id: string;
  status: string;
}

export interface DiscountRow extends Record<string, unknown> {
  id: string;
  name: string;
  description: string | null;
  amount_type: "percentage" | "flat";
  amount_value: number;
}

export interface InvoiceRow extends Record<string, unknown> {
  id: string;
  student_id: string;
  fee_structure_id: string | null;
  installment_id: string | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  late_fee_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: "draft" | "published" | "partial" | "paid" | "overdue" | "cancelled";
}

export interface InvoiceItemRow extends Record<string, unknown> {
  id: string;
  invoice_id: string;
  fee_head_id: string;
  amount: number;
}

export interface PaymentRow extends Record<string, unknown> {
  id: string;
  student_id: string;
  receipt_number: string;
  payment_date: string;
  amount: number;
  payment_mode: "cash" | "online" | "bank_transfer" | "demand_draft" | "cheque";
  reference_number: string | null;
  gateway_response: Record<string, unknown> | null;
  status: "pending" | "successful" | "failed" | "refunded";
}

export interface PaymentAllocationRow extends Record<string, unknown> {
  id: string;
  payment_id: string;
  invoice_id: string;
  amount: number;
}

export interface LedgerRow extends Record<string, unknown> {
  id: string;
  parent_ledger_id: string | null;
  account_name: string;
  account_code: string;
  account_type: "asset" | "liability" | "equity" | "revenue" | "expense";
  is_group: boolean;
}

export interface TransactionRow extends Record<string, unknown> {
  id: string;
  transaction_date: string;
  reference_type: string;
  reference_id: string | null;
  description: string | null;
  status: string;
}

export interface TransactionEntryRow extends Record<string, unknown> {
  id: string;
  transaction_id: string;
  ledger_id: string;
  debit_amount: number;
  credit_amount: number;
}

/* ------------------------------------------------------------------ *
 * Lists
 * ------------------------------------------------------------------ */

export function useFeeCategories() {
  return useResourceList<FeeCategoryRow>({
    table: "finance_fee_categories",
    select: "id, name, description",
    orderBy: { column: "name" },
  });
}

export function useFeeHeads() {
  return useResourceList<FeeHeadRow>({
    table: "finance_fee_heads",
    select: "id, name, code, description, is_refundable, frequency, tax_percent, default_amount",
    orderBy: { column: "name" },
  });
}

export function useFeeStructures() {
  return useResourceList<FeeStructureRow>({
    table: "finance_fee_structures",
    select: "id, program_id, academic_year_id, fee_category_id, name, total_amount",
    orderBy: { column: "name" },
  });
}

export function useInstallments(feeStructureId?: string) {
  return useQuery({
    queryKey: ["finance_installments", feeStructureId],
    enabled: Boolean(feeStructureId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_installments" as never)
        .select("id, fee_structure_id, name, due_date, percentage, late_fee_policy")
        .eq("fee_structure_id", feeStructureId!)
        .order("due_date");
      if (error) throw error;
      return (data ?? []) as unknown as InstallmentRow[];
    },
  });
}

export function useScholarships() {
  return useResourceList<ScholarshipRow>({
    table: "finance_scholarships",
    select: "id, name, code, description, type, amount_type, amount_value",
    orderBy: { column: "name" },
  });
}

export function useDiscounts() {
  return useResourceList<DiscountRow>({
    table: "finance_discounts",
    select: "id, name, description, amount_type, amount_value",
    orderBy: { column: "name" },
  });
}

export function useInvoices() {
  return useResourceList<InvoiceRow>({
    table: "finance_invoices",
    select:
      "id, student_id, fee_structure_id, installment_id, invoice_number, invoice_date, due_date, subtotal, tax_amount, late_fee_amount, discount_amount, total_amount, paid_amount, balance_amount, status",
    orderBy: { column: "invoice_date", ascending: false },
  });
}

export function usePayments() {
  return useResourceList<PaymentRow>({
    table: "finance_payments",
    select:
      "id, student_id, receipt_number, payment_date, amount, payment_mode, reference_number, gateway_response, status",
    orderBy: { column: "payment_date", ascending: false },
  });
}

export function useLedgers() {
  return useResourceList<LedgerRow>({
    table: "finance_ledgers",
    select: "id, parent_ledger_id, account_name, account_code, account_type, is_group",
    orderBy: { column: "account_code" },
  });
}

export function useTransactions() {
  return useResourceList<TransactionRow>({
    table: "finance_transactions",
    select: "id, transaction_date, reference_type, reference_id, description, status",
    orderBy: { column: "transaction_date", ascending: false },
  });
}

/* ------------------------------------------------------------------ *
 * Nested queries
 * ------------------------------------------------------------------ */

export function useStudentInvoices(studentId: string | undefined) {
  return useQuery({
    queryKey: ["finance_invoices", "student", studentId],
    enabled: Boolean(studentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_invoices" as never)
        .select("*")
        .eq("student_id", studentId!)
        .order("due_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as InvoiceRow[];
    },
  });
}

export function useTransactionEntries(transactionId: string | undefined) {
  return useQuery({
    queryKey: ["finance_transaction_entries", transactionId],
    enabled: Boolean(transactionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_transaction_entries" as never)
        .select("*")
        .eq("transaction_id", transactionId!);
      if (error) throw error;
      return (data ?? []) as unknown as TransactionEntryRow[];
    },
  });
}

export function useInvoiceItems(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ["finance_invoice_items", invoiceId],
    enabled: Boolean(invoiceId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_invoice_items" as never)
        .select("*")
        .eq("invoice_id", invoiceId!);
      if (error) throw error;
      return (data ?? []) as unknown as InvoiceItemRow[];
    },
  });
}

/* ------------------------------------------------------------------ *
 * Mutations
 * ------------------------------------------------------------------ */

function useInvalidate() {
  const queryClient = useQueryClient();
  return (tables: string[]) => {
    for (const table of tables) {
      void queryClient.invalidateQueries({ queryKey: ["resource", table] });
    }
  };
}

export function useRecordPayment() {
  const { tenant } = useAccess();
  const { user } = useAuth();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      studentId,
      amount,
      mode,
      reference,
      allocations, // Array of { invoice_id, amount }
    }: {
      studentId: string;
      amount: number;
      mode: PaymentRow["payment_mode"];
      reference?: string;
      allocations: { invoice_id: string; amount: number }[];
    }) => {
      const receiptNumber = `RCT-${Date.now()}`;
      // 1. Create Payment
      const { data: payment, error: paymentError } = await supabase
        .from("finance_payments" as never)
        .insert({
          tenant_id: tenant?.id,
          student_id: studentId,
          receipt_number: receiptNumber,
          amount,
          payment_mode: mode,
          reference_number: reference || null,
          status: "successful",
          created_by: user?.id,
        } as never)
        .select("id")
        .single();
      if (paymentError) throw paymentError;

      const paymentId = (payment as unknown as { id: string }).id;

      // 2. Create Allocations and update Invoices
      for (const alloc of allocations) {
        const { error: allocError } = await supabase
          .from("finance_payment_allocations" as never)
          .insert({
            tenant_id: tenant?.id,
            payment_id: paymentId,
            invoice_id: alloc.invoice_id,
            amount: alloc.amount,
            created_by: user?.id,
          } as never);
        if (allocError) throw allocError;

        // Fetch invoice to update balance
        const { data: inv, error: fetchErr } = await supabase
          .from("finance_invoices" as never)
          .select("paid_amount, total_amount")
          .eq("id", alloc.invoice_id)
          .single();
        if (fetchErr) throw fetchErr;

        const typedInv = inv as unknown as { paid_amount: number; total_amount: number };
        const newPaid = Number(typedInv.paid_amount) + alloc.amount;
        const newBalance = Number(typedInv.total_amount) - newPaid;
        const newStatus = newBalance <= 0 ? "paid" : "partial";

        const { error: updErr } = await supabase
          .from("finance_invoices" as never)
          .update({
            paid_amount: newPaid,
            balance_amount: newBalance,
            status: newStatus,
          } as never)
          .eq("id", alloc.invoice_id);
        if (updErr) throw updErr;
      }
      return paymentId;
    },
    onSuccess: () => {
      toast.success("Payment recorded successfully");
      invalidate(["finance_payments", "finance_invoices"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateFeeStructure() {
  const { tenant } = useAccess();
  const { user } = useAuth();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async (data: Omit<FeeStructureRow, "id">) => {
      const { error } = await supabase
        .from("finance_fee_structures" as never)
        .insert({
          ...data,
          tenant_id: tenant?.id,
          created_by: user?.id,
        } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Fee Structure created successfully");
      invalidate(["finance_fee_structures"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateFeeHead() {
  const { tenant } = useAccess();
  const { user } = useAuth();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async (data: Omit<FeeHeadRow, "id">) => {
      const { error } = await supabase
        .from("finance_fee_heads" as never)
        .insert({
          ...data,
          tenant_id: tenant?.id,
          created_by: user?.id,
        } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Fee Head created successfully");
      invalidate(["finance_fee_heads"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
