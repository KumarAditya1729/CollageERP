import { supabase } from "@/integrations/supabase/client";

export interface PayrollConfig {
  pf_percentage: number;
  tds_percentage: number;
}

export interface PayrollCalculationInput {
  baseSalary: number;
  workingDays: number;
  leaveDays: number;
  config: PayrollConfig;
}

export interface PayrollCalculationResult {
  gross_salary: number;
  lop_deduction: number;
  pf_deduction: number;
  tds_deduction: number;
  total_deductions: number;
  net_salary: number;
  earnings: Record<string, number>;
  deductions: Record<string, number>;
}

export class PayrollService {
  /**
   * Fetch dynamic statutory config from hr_statutory_config
   */
  static async getStatutoryConfig(tenantId: string): Promise<PayrollConfig> {
    const { data } = await supabase
      .from("hr_statutory_config" as any)
      .select("component, config")
      .eq("tenant_id", tenantId)
      .eq("is_active", true);

    const config: PayrollConfig = {
      pf_percentage: 12, // Default 12%
      tds_percentage: 10, // Default 10%
    };

    if (data) {
      data.forEach((row: any) => {
        if (row.component === "pf" && row.config?.percentage) {
          config.pf_percentage = row.config.percentage;
        } else if (row.component === "tds" && row.config?.percentage) {
          config.tds_percentage = row.config.percentage;
        }
      });
    }

    return config;
  }

  /**
   * Calculate payroll for a single employee
   */
  static calculatePayslip(input: PayrollCalculationInput): PayrollCalculationResult {
    const { baseSalary, workingDays, leaveDays, config } = input;

    // Loss of Pay (LOP) deduction
    const perDaySalary = workingDays > 0 ? baseSalary / workingDays : 0;
    const lop_deduction = Math.round(leaveDays * perDaySalary);

    // Adjusted Gross Salary
    const gross_salary = baseSalary - lop_deduction;

    // Deductions
    const pf_deduction = Math.round(gross_salary * (config.pf_percentage / 100));
    const tds_deduction = Math.round(gross_salary * (config.tds_percentage / 100));

    const total_deductions = pf_deduction + tds_deduction;
    const net_salary = gross_salary - total_deductions;

    return {
      gross_salary,
      lop_deduction,
      pf_deduction,
      tds_deduction,
      total_deductions,
      net_salary,
      earnings: {
        basic: gross_salary,
      },
      deductions: {
        lop: lop_deduction,
        pf: pf_deduction,
        tds: tds_deduction,
      },
    };
  }
}
