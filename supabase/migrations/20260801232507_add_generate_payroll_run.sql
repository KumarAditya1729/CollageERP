-- ============================================================================
-- HRMS: Generate Payroll Run Function
-- dynamically calculates PF, TDS and Unpaid Leave deductions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_payroll_run(
    p_tenant_id UUID,
    p_name TEXT,
    p_pay_period_start DATE,
    p_pay_period_end DATE,
    p_working_days INT DEFAULT 30
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payroll_run_id UUID;
    v_pf_percentage NUMERIC;
    v_tds_percentage NUMERIC;
    v_staff RECORD;
    v_unpaid_leaves NUMERIC;
    v_lop_deduction NUMERIC;
    v_gross_salary NUMERIC;
    v_pf_deduction NUMERIC;
    v_tds_deduction NUMERIC;
    v_total_deductions NUMERIC;
    v_net_salary NUMERIC;
    
    v_total_run_gross NUMERIC := 0;
    v_total_run_deductions NUMERIC := 0;
    v_total_run_net NUMERIC := 0;
    v_employee_count INT := 0;
BEGIN
    -- 1. Create payroll run record
    INSERT INTO public.hr_payroll_runs (
        tenant_id, name, pay_period_start, pay_period_end, status
    ) VALUES (
        p_tenant_id, p_name, p_pay_period_start, p_pay_period_end, 'processing'
    ) RETURNING id INTO v_payroll_run_id;

    -- 2. Fetch config
    SELECT (config->>'percentage')::NUMERIC INTO v_pf_percentage 
    FROM public.hr_statutory_config 
    WHERE tenant_id = p_tenant_id AND component = 'pf' AND is_active = true LIMIT 1;
    
    SELECT (config->>'percentage')::NUMERIC INTO v_tds_percentage 
    FROM public.hr_statutory_config 
    WHERE tenant_id = p_tenant_id AND component = 'tds' AND is_active = true LIMIT 1;
    
    v_pf_percentage := COALESCE(v_pf_percentage, 12);
    v_tds_percentage := COALESCE(v_tds_percentage, 10);

    -- 3. Loop through staff
    FOR v_staff IN 
        SELECT 
            s.id AS staff_id,
            s.staff_code,
            s.first_name || ' ' || s.last_name AS employee_name,
            sa.basic_salary
        FROM public.staff s
        JOIN public.hr_salary_assignments sa ON sa.staff_id = s.id
        WHERE s.tenant_id = p_tenant_id AND s.status = 'active'
    LOOP
        -- Calculate unpaid leaves
        SELECT COALESCE(SUM(
            CASE 
                WHEN la.start_date >= p_pay_period_start AND la.end_date <= p_pay_period_end THEN (la.end_date - la.start_date) + 1
                WHEN la.start_date < p_pay_period_start AND la.end_date <= p_pay_period_end THEN (la.end_date - p_pay_period_start) + 1
                WHEN la.start_date >= p_pay_period_start AND la.end_date > p_pay_period_end THEN (p_pay_period_end - la.start_date) + 1
                ELSE (p_pay_period_end - p_pay_period_start) + 1
            END
        ), 0) INTO v_unpaid_leaves
        FROM public.hr_leave_applications la
        WHERE la.staff_id = v_staff.staff_id 
          AND la.status = 'approved'
          AND la.leave_type_id IN (SELECT id FROM public.hr_leave_types WHERE tenant_id = p_tenant_id AND is_paid = false)
          AND la.start_date <= p_pay_period_end 
          AND la.end_date >= p_pay_period_start;

        -- Calculations
        v_lop_deduction := ROUND(COALESCE(v_staff.basic_salary, 0) / p_working_days * v_unpaid_leaves, 2);
        v_gross_salary := COALESCE(v_staff.basic_salary, 0) - COALESCE(v_lop_deduction, 0);
        v_pf_deduction := ROUND(v_gross_salary * (v_pf_percentage / 100.0), 2);
        v_tds_deduction := ROUND(v_gross_salary * (v_tds_percentage / 100.0), 2);
        
        v_total_deductions := v_pf_deduction + v_tds_deduction;
        v_net_salary := v_gross_salary - v_total_deductions;

        -- Insert payslip
        INSERT INTO public.hr_payslips (
            tenant_id, payroll_run_id, staff_id, employee_code, employee_name,
            pay_period_start, pay_period_end, working_days, present_days, leave_days,
            gross_salary, total_deductions, net_salary,
            earnings, deductions
        ) VALUES (
            p_tenant_id, v_payroll_run_id, v_staff.staff_id, v_staff.staff_code, v_staff.employee_name,
            p_pay_period_start, p_pay_period_end, p_working_days, p_working_days - v_unpaid_leaves, v_unpaid_leaves,
            v_gross_salary, v_total_deductions, v_net_salary,
            jsonb_build_object('basic', v_gross_salary),
            jsonb_build_object('lop', v_lop_deduction, 'pf', v_pf_deduction, 'tds', v_tds_deduction)
        );

        -- Aggregate
        v_total_run_gross := v_total_run_gross + v_gross_salary;
        v_total_run_deductions := v_total_run_deductions + v_total_deductions;
        v_total_run_net := v_total_run_net + v_net_salary;
        v_employee_count := v_employee_count + 1;
    END LOOP;

    -- 4. Loop through faculty
    FOR v_staff IN 
        SELECT 
            f.id AS staff_id,
            f.faculty_code AS staff_code,
            f.first_name || ' ' || f.last_name AS employee_name,
            sa.basic_salary
        FROM public.faculty f
        JOIN public.hr_salary_assignments sa ON sa.faculty_id = f.id
        WHERE f.tenant_id = p_tenant_id AND f.status = 'active'
    LOOP
        -- Calculate unpaid leaves
        SELECT COALESCE(SUM(
            CASE 
                WHEN la.start_date >= p_pay_period_start AND la.end_date <= p_pay_period_end THEN (la.end_date - la.start_date) + 1
                WHEN la.start_date < p_pay_period_start AND la.end_date <= p_pay_period_end THEN (la.end_date - p_pay_period_start) + 1
                WHEN la.start_date >= p_pay_period_start AND la.end_date > p_pay_period_end THEN (p_pay_period_end - la.start_date) + 1
                ELSE (p_pay_period_end - p_pay_period_start) + 1
            END
        ), 0) INTO v_unpaid_leaves
        FROM public.hr_leave_applications la
        WHERE la.faculty_id = v_staff.staff_id 
          AND la.status = 'approved'
          AND la.leave_type_id IN (SELECT id FROM public.hr_leave_types WHERE tenant_id = p_tenant_id AND is_paid = false)
          AND la.start_date <= p_pay_period_end 
          AND la.end_date >= p_pay_period_start;

        -- Calculations
        v_lop_deduction := ROUND(COALESCE(v_staff.basic_salary, 0) / p_working_days * v_unpaid_leaves, 2);
        v_gross_salary := COALESCE(v_staff.basic_salary, 0) - COALESCE(v_lop_deduction, 0);
        v_pf_deduction := ROUND(v_gross_salary * (v_pf_percentage / 100.0), 2);
        v_tds_deduction := ROUND(v_gross_salary * (v_tds_percentage / 100.0), 2);
        
        v_total_deductions := v_pf_deduction + v_tds_deduction;
        v_net_salary := v_gross_salary - v_total_deductions;

        -- Insert payslip
        INSERT INTO public.hr_payslips (
            tenant_id, payroll_run_id, faculty_id, employee_code, employee_name,
            pay_period_start, pay_period_end, working_days, present_days, leave_days,
            gross_salary, total_deductions, net_salary,
            earnings, deductions
        ) VALUES (
            p_tenant_id, v_payroll_run_id, v_staff.staff_id, v_staff.staff_code, v_staff.employee_name,
            p_pay_period_start, p_pay_period_end, p_working_days, p_working_days - v_unpaid_leaves, v_unpaid_leaves,
            v_gross_salary, v_total_deductions, v_net_salary,
            jsonb_build_object('basic', v_gross_salary),
            jsonb_build_object('lop', v_lop_deduction, 'pf', v_pf_deduction, 'tds', v_tds_deduction)
        );

        -- Aggregate
        v_total_run_gross := v_total_run_gross + v_gross_salary;
        v_total_run_deductions := v_total_run_deductions + v_total_deductions;
        v_total_run_net := v_total_run_net + v_net_salary;
        v_employee_count := v_employee_count + 1;
    END LOOP;

    -- 5. Update payroll run summary
    UPDATE public.hr_payroll_runs
    SET 
        status = 'draft',
        total_gross = v_total_run_gross,
        total_deductions = v_total_run_deductions,
        total_net = v_total_run_net,
        employee_count = v_employee_count,
        processed_at = now()
    WHERE id = v_payroll_run_id;

    RETURN v_payroll_run_id;
END;
$$;
