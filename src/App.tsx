import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Sidebar, NavigationTab } from './components/layout/Sidebar.tsx';
import { TopHeader } from './components/layout/TopHeader.tsx';
import { QuickActionModal } from './components/modals/QuickActionModal.tsx';
import { AddEmployeeModal } from './components/modals/AddEmployeeModal.tsx';
import { RegularizationModal } from './components/modals/RegularizationModal.tsx';
import { ApplyLeaveModal } from './components/modals/ApplyLeaveModal.tsx';
import { AIPayrollAssistantModal } from './components/modals/AIPayrollAssistantModal.tsx';
import { DiagnosticsModal } from './components/modals/DiagnosticsModal.tsx';

// Views
import { ExecutiveDashboardView } from './features/dashboard/ExecutiveDashboardView.tsx';
import { EmployeeDirectoryView } from './features/employees/EmployeeDirectoryView.tsx';
import { AttendanceOperationsView } from './features/attendance/AttendanceOperationsView.tsx';
import { PayrollOperationsView } from './features/payroll/PayrollOperationsView.tsx';
import { PayslipView } from './features/payroll/PayslipView.tsx';
import { LeaveManagementView } from './features/leave/LeaveManagementView.tsx';
import { ApprovalsView } from './features/approvals/ApprovalsView.tsx';
import { ReportsView } from './features/reports/ReportsView.tsx';
import { AuditLogsView } from './features/audit/AuditLogsView.tsx';
import { UsersAndRolesView } from './features/admin/UsersAndRolesView.tsx';
import { LoginPage } from './features/auth/LoginPage.tsx';

// Services
import {
  dashboardApi,
  employeeApi,
  attendanceApi,
  payrollApi,
  approvalApi,
  leaveApi,
} from './services/apiServices.ts';

import {
  DashboardMetrics,
  Employee,
  AttendanceRecord,
  RegularizationRequest,
  PayrollRun,
  PayrollException,
  ApprovalItem,
  LeaveBalance,
  LeaveRequest,
} from './types/index.ts';

function AppContent() {
  const { currentUser, isLoading } = useAuth();

  // Navigation & Layout
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPayslipEmpCode, setSelectedPayslipEmpCode] = useState<string>('WSP-1092');

  // Modals state
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [regularizationOpen, setRegularizationOpen] = useState(false);
  const [regTargetEmp, setRegTargetEmp] = useState<{ name?: string; code?: string }>({});
  const [applyLeaveOpen, setApplyLeaveOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  // Data states
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [regularizations, setRegularizations] = useState<RegularizationRequest[]>([]);
  const [payrollRun, setPayrollRun] = useState<PayrollRun | null>(null);
  const [payrollExceptions, setPayrollExceptions] = useState<PayrollException[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  // Initial Data Fetch
  const refreshAllData = async () => {
    try {
      const [
        metricsRes,
        empRes,
        attRes,
        regRes,
        payrollRes,
        approvalRes,
        leaveRes,
      ] = await Promise.all([
        dashboardApi.getMetrics(),
        employeeApi.getEmployees({ limit: 100 }),
        attendanceApi.getAttendance(),
        attendanceApi.getRegularizations(),
        payrollApi.getRuns(),
        approvalApi.getApprovals(),
        leaveApi.getLeaves(),
      ]);

      setMetrics(metricsRes.metrics);
      setEmployees(empRes.data);
      setAttendanceRecords(attRes.records);
      setRegularizations(regRes.regularizations);
      setPayrollRun(payrollRes.currentRun);
      setPayrollExceptions(payrollRes.exceptions);
      setApprovals(approvalRes.items);
      setLeaveBalances(leaveRes.balances);
      setLeaveRequests(leaveRes.requests);
    } catch (err) {
      console.error('Failed to load application data', err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleQuickAction = (actionKey: string) => {
    if (actionKey === 'punch') {
      setActiveTab('attendance');
    } else if (actionKey === 'regularize') {
      setRegularizationOpen(true);
    } else if (actionKey === 'leave') {
      setApplyLeaveOpen(true);
    } else if (actionKey === 'add-employee') {
      setAddEmployeeOpen(true);
    } else if (actionKey === 'payroll-run') {
      setActiveTab('payroll-runs');
    } else if (actionKey === 'view-payslip') {
      setSelectedPayslipEmpCode(currentUser?.employeeId || 'WSP-1092');
      setActiveTab('payslips');
    }
  };

  const handleApproveItem = async (id: string, comments?: string) => {
    try {
      await approvalApi.actionApproval(id, 'APPROVE', comments);
      refreshAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRejectItem = async (id: string, comments?: string) => {
    try {
      await approvalApi.actionApproval(id, 'REJECT', comments);
      refreshAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Data refresh on currentUser changes
  useEffect(() => {
    if (currentUser) {
      refreshAllData();
    }
  }, [currentUser?.email]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="font-semibold text-slate-300 text-sm">
          Authenticating WorkSphere Enterprise Session...
        </span>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  if (!metrics || !payrollRun) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="font-semibold text-slate-700 text-sm">
          Loading WorkSphere Enterprise Mission Control...
        </span>
      </div>
    );
  }

  // Active module breadcrumb title
  const moduleTitles: Record<string, string> = {
    dashboard: 'Executive Mission Control',
    employees: 'Workforce · Employees',
    departments: 'Workforce · Departments',
    teams: 'Workforce · Teams',
    organization: 'Workforce · Organization',
    attendance: 'Time & Attendance · Operations',
    shifts: 'Time & Attendance · Shifts',
    holidays: 'Time & Attendance · Gazetted Holidays',
    overtime: 'Time & Attendance · Overtime',
    'leave-requests': 'Leave · Requests & History',
    'leave-balances': 'Leave · Balances & Policies',
    policies: 'Leave · Policies',
    'payroll-overview': 'Payroll · Overview',
    'payroll-runs': 'Payroll · Lifecycle & Exception Resolver',
    payslips: 'Payroll · Payslips & Statements',
    components: 'Payroll · Salary Components',
    'my-approvals': 'Governance · My Approvals',
    'approval-history': 'Governance · Approval History',
    'reports-workforce': 'Analytics · Workforce Report',
    'reports-attendance': 'Analytics · Attendance Report',
    'reports-payroll': 'Analytics · Payroll Report',
    'reports-leave': 'Analytics · Leave Report',
    'users-and-roles': 'Administration · Users & Roles',
    'audit-logs': 'Administration · Audit Trail',
    settings: 'Administration · Settings',
  };

  return (
    <div className="bg-background min-h-screen font-body-md text-on-surface antialiased flex flex-row">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden animate-in fade-in"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Rail */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setMobileMenuOpen(false);
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        pendingApprovalsCount={approvals.filter((a) => a.status === 'PENDING').length + 124}
      />

      {/* App Area (Header + Main Content) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <TopHeader
          collapsed={sidebarCollapsed}
          activeModuleName={moduleTitles[activeTab] || 'Enterprise Workspace'}
          onOpenQuickAction={() => setQuickActionOpen(true)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-full">
        {activeTab === 'dashboard' && (
          <ExecutiveDashboardView
            metrics={metrics}
            approvalItems={approvals}
            onNavigateTab={setActiveTab}
            onApproveItem={(id) => handleApproveItem(id)}
            onRejectItem={(id) => handleRejectItem(id)}
            onOpenDiagnostics={() => setDiagnosticsOpen(true)}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeeDirectoryView
            onOpenAddModal={() => setAddEmployeeOpen(true)}
            onSelectEmployeeForPayslip={(empCode) => {
              setSelectedPayslipEmpCode(empCode);
              setActiveTab('payslips');
            }}
          />
        )}

        {(activeTab === 'departments' || activeTab === 'teams' || activeTab === 'organization') && (
          <div className="flex flex-col gap-4">
            <h1 className="font-display-lg text-2xl font-bold text-on-surface">
              {activeTab === 'departments' ? 'Enterprise Departments' : activeTab === 'teams' ? 'Organizational Teams' : 'Corporate Organization Tree'}
            </h1>
            <p className="text-secondary text-sm">
              WorkSphere structure spanning 5 major enterprise divisions: Engineering & Product, Operations & Supply, Sales & Growth, Finance & Legal, and People Operations.
            </p>
            <div className="mt-4">
              <ReportsView />
            </div>
          </div>
        )}

        {(activeTab === 'attendance' || activeTab === 'shifts' || activeTab === 'holidays' || activeTab === 'overtime') && (
          <AttendanceOperationsView
            records={attendanceRecords}
            regularizations={regularizations}
            onOpenRegularizationModal={(name, code) => {
              setRegTargetEmp({ name, code });
              setRegularizationOpen(true);
            }}
            onRefresh={refreshAllData}
          />
        )}

        {(activeTab === 'leave-requests' || activeTab === 'leave-balances' || activeTab === 'policies') && (
          <LeaveManagementView
            balances={leaveBalances}
            requests={leaveRequests}
            onOpenApplyModal={() => setApplyLeaveOpen(true)}
          />
        )}

        {(activeTab === 'payroll-overview' || activeTab === 'payroll-runs' || activeTab === 'components') && (
          <PayrollOperationsView
            currentRun={payrollRun}
            exceptions={payrollExceptions}
            onOpenAiAssistant={() => setAiAssistantOpen(true)}
            onRefresh={refreshAllData}
            onSelectEmployeeForPayslip={(empCode) => {
              setSelectedPayslipEmpCode(empCode);
              setActiveTab('payslips');
            }}
          />
        )}

        {activeTab === 'payslips' && (
          <PayslipView
            selectedEmpCode={selectedPayslipEmpCode}
            employees={employees}
            onBackToPayroll={() => setActiveTab('payroll-runs')}
          />
        )}

        {(activeTab === 'my-approvals' || activeTab === 'approval-history') && (
          <ApprovalsView
            items={approvals}
            onApprove={handleApproveItem}
            onReject={handleRejectItem}
          />
        )}

        {activeTab.startsWith('reports-') && <ReportsView />}

        {activeTab === 'audit-logs' && <AuditLogsView />}

        {(activeTab === 'users-and-roles' || activeTab === 'settings') && <UsersAndRolesView />}
        </main>
      </div>

      {/* Modals & Dialogs */}
      <QuickActionModal
        isOpen={quickActionOpen}
        onClose={() => setQuickActionOpen(false)}
        onSelectAction={handleQuickAction}
      />

      <AddEmployeeModal
        isOpen={addEmployeeOpen}
        onClose={() => setAddEmployeeOpen(false)}
        onSubmit={async (empData) => {
          await employeeApi.createEmployee(empData);
          refreshAllData();
        }}
      />

      <RegularizationModal
        isOpen={regularizationOpen}
        onClose={() => {
          setRegularizationOpen(false);
          setRegTargetEmp({});
        }}
        defaultEmpName={regTargetEmp.name}
        defaultEmpCode={regTargetEmp.code}
        onSuccess={refreshAllData}
      />

      <ApplyLeaveModal
        isOpen={applyLeaveOpen}
        onClose={() => setApplyLeaveOpen(false)}
        balances={leaveBalances}
        onSuccess={refreshAllData}
      />

      <AIPayrollAssistantModal
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
      />

      <DiagnosticsModal
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
