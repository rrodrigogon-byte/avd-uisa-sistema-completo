-- Índices para otimização de performance
-- Sistema AVD UISA

-- Índices em employeeActivities (queries frequentes)
CREATE INDEX IF NOT EXISTS idx_employee_activities_employee_id ON employeeActivities(employeeId);
CREATE INDEX IF NOT EXISTS idx_employee_activities_date ON employeeActivities(activityDate);
CREATE INDEX IF NOT EXISTS idx_employee_activities_category ON employeeActivities(category);
CREATE INDEX IF NOT EXISTS idx_employee_activities_employee_date ON employeeActivities(employeeId, activityDate);

-- Índices em timeClockRecords
CREATE INDEX IF NOT EXISTS idx_time_clock_employee_id ON timeClockRecords(employeeId);
CREATE INDEX IF NOT EXISTS idx_time_clock_date ON timeClockRecords(date);
CREATE INDEX IF NOT EXISTS idx_time_clock_employee_date ON timeClockRecords(employeeId, date);

-- Índices em timeDiscrepancies
CREATE INDEX IF NOT EXISTS idx_time_discrepancies_employee_id ON timeDiscrepancies(employeeId);
CREATE INDEX IF NOT EXISTS idx_time_discrepancies_date ON timeDiscrepancies(date);
CREATE INDEX IF NOT EXISTS idx_time_discrepancies_status ON timeDiscrepancies(status);
CREATE INDEX IF NOT EXISTS idx_time_discrepancies_employee_date ON timeDiscrepancies(employeeId, date);

-- Índices em alerts
CREATE INDEX IF NOT EXISTS idx_alerts_employee_id ON alerts(employeeId);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(createdAt);

-- Índices em goals
CREATE INDEX IF NOT EXISTS idx_goals_employee_id ON goals(employeeId);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_cycle ON goals(cycle);

-- Índices em smartGoals
CREATE INDEX IF NOT EXISTS idx_smart_goals_employee_id ON smartGoals(employeeId);
CREATE INDEX IF NOT EXISTS idx_smart_goals_status ON smartGoals(status);
CREATE INDEX IF NOT EXISTS idx_smart_goals_end_date ON smartGoals(endDate);
CREATE INDEX IF NOT EXISTS idx_smart_goals_updated_at ON smartGoals(updatedAt);

-- Índices em performanceEvaluations
CREATE INDEX IF NOT EXISTS idx_performance_evaluations_employee_id ON performanceEvaluations(employeeId);
CREATE INDEX IF NOT EXISTS idx_performance_evaluations_status ON performanceEvaluations(status);
CREATE INDEX IF NOT EXISTS idx_performance_evaluations_cycle ON performanceEvaluations(cycle);

-- Índices em pdiPlans
CREATE INDEX IF NOT EXISTS idx_pdi_plans_employee_id ON pdiPlans(employeeId);
CREATE INDEX IF NOT EXISTS idx_pdi_plans_status ON pdiPlans(status);

-- Índices em pdiItems
CREATE INDEX IF NOT EXISTS idx_pdi_items_plan_id ON pdiItems(planId);
CREATE INDEX IF NOT EXISTS idx_pdi_items_status ON pdiItems(status);
CREATE INDEX IF NOT EXISTS idx_pdi_items_end_date ON pdiItems(endDate);

-- Índices em employees
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_position ON employees(position);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);

-- Índices em jobDescriptions
CREATE INDEX IF NOT EXISTS idx_job_descriptions_position_id ON jobDescriptions(positionId);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_department_id ON jobDescriptions(departmentId);

-- Índices em scheduledReports
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active ON scheduledReports(active);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_execution ON scheduledReports(nextExecutionAt);

-- Índices compostos para queries complexas
CREATE INDEX IF NOT EXISTS idx_goals_employee_status_cycle ON goals(employeeId, status, cycle);
CREATE INDEX IF NOT EXISTS idx_evaluations_employee_status_cycle ON performanceEvaluations(employeeId, status, cycle);
CREATE INDEX IF NOT EXISTS idx_activities_employee_date_category ON employeeActivities(employeeId, activityDate, category);
