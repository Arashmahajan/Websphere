import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { OrganizationProvider, useOrganization } from './context/OrganizationContext.tsx';
import { Sidebar, NavigationTab } from './components/layout/Sidebar.tsx';
import { TopHeader } from './components/layout/TopHeader.tsx';
import { QuickActionModal } from './components/modals/QuickActionModal.tsx';
import { AddEmployeeModal } from './components/modals/AddEmployeeModal.tsx';
import { RegularizationModal } from './components/modals/RegularizationModal.tsx';
import { ApplyLeaveModal } from './components/modals/ApplyLeaveModal.tsx';
import { AIPayrollAssistantModal } from './components/modals/AIPayrollAssistantModal.tsx';
import { DiagnosticsModal } from './components/modals/DiagnosticsModal.tsx';
import { CreateOrganizationModal } from './components/modals/CreateOrganizationModal.tsx';
import { CreateDepartmentModal } from './components/modals/CreateDepartmentModal.tsx';
import { CreateLocationModal } from './components/modals/CreateLocationModal.tsx';

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
import { InitialSetupView } from './features/setup/InitialSetupView.tsx';
import { OrganizationListView } from './features/organization/OrganizationListView.tsx';
import { OrganizationDetailView } from './features/organization/OrganizationDetailView.tsx';
import { EmptyState } from './components/common/EmptyState.tsx';

// Icons
import { Building2, Network, MapPin, Plus } from 'lucide-react';

// Services
import {
  dashboardApi,
  employeeApi,
  attendanceApi,
  payrollApi,
  approvalApi,
  leaveApi,
  departmentApi,
  locationApi,
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
  Department,
  Location,
} from './types/index.ts';

function AppContent() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const {
    currentOrganization,
    organizations,
    isInitialized,
    isLoading: orgLoading,
    refreshOrganization,
  } = useOrganization();

  // Navigation & Layout
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPayslipEmpCode, setSelectedPayslipEmpCode] = useState<string>('EMP-001');

  // Selected Org for Details
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  // Modals state
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [createDeptOpen, setCreateDeptOpen] = useState(false);
  const [createLocOpen, setCreateLocOpen] = useState(false);
  const [regularizationOpen, setRegularizationOpen] = useState(false);
  const [regTargetEmp, setRegTargetEmp] = useState<{ name?: string; code?: string }>({});
  const [applyLeaveOpen, setApplyLeaveOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  // Data states
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
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
        deptRes,
        locRes,
        attRes,
        regRes,
        payrollRes,
        approvalRes,
        leaveRes,
      ] = await Promise.all([
        dashboardApi.getMetrics().catch(() => ({
          metrics: {
            totalWorkforce: 0,
            workforceDelta: 0,
            retentionRate: '100%',
            presentToday: 0,
            presentRate: '0%',
            lateOrHalfCount: 0,
            leaveCount: 0,
            pendingApprovalsCount: 0,
            slaRiskCount: 0,
            payrollGross: '₹0.0L',
            payrollNet: '₹0.0L',
            cycleLockInDays: 0,
            exceptionsCount: 0,
            criticalExceptionsCount: 0,
            shiftEfficiency: '0%',
            shiftEfficiencyDelta: '0%',
            totalEmployees: 0,
            activeHeadcount: 0,
            departmentsCount: 0,
            locationsCount: 0,
            organizationsCount: 0,
            onLeaveToday: 0,
            missingPunchToday: 0,
            attendanceRate: 0,
            monthlyPayrollDisbursed: 0,
            payrollCycleStatus: 'NOT_STARTED',
            pendingApprovals: 0,
            criticalExceptions: 0,
          },
        })),
        employeeApi.getEmployees({ limit: 100, organizationId: currentOrganization?.id }).catch(() => ({ data: [] })),
        departmentApi.getDepartments(currentOrganization?.id).catch(() => ({ data: [] })),
        locationApi.getLocations(currentOrganization?.id).catch(() => ({ data: [] })),
        attendanceApi.getAttendance().catch(() => ({ records: [], currentUserSession: {} })),
        attendanceApi.getRegularizations().catch(() => ({ regularizations: [] })),
        payrollApi.getRuns().catch(() => ({ currentRun: null, runs: [], exceptions: [] })),
        approvalApi.getApprovals().catch(() => ({ items: [] })),
        leaveApi.getLeaves().catch(() => ({ requests: [], balances: [] })),
      ]);

      setMetrics(metricsRes.metrics);
      setEmployees(empRes.data || []);
      setDepartments(deptRes.data || []);
      setLocations(locRes.data || []);
      setAttendanceRecords(attRes.records || []);
      setRegularizations(regRes.regularizations || []);
      setPayrollRun(payrollRes.currentRun || null);
      setPayrollExceptions(payrollRes.exceptions || []);
      setApprovals(approvalRes.items || []);
      setLeaveBalances(leaveRes.balances || []);
      setLeaveRequests(leaveRes.requests || []);
    } catch (err) {
      console.error('Failed to load application data', err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, [currentOrganization?.id, currentUser?.email]);

  const handleQuickAction = (actionKey: string) => {
    if (actionKey === 'create-org') {
      setCreateOrgOpen(true);
    } else if (actionKey === 'punch') {
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
      setSelectedPayslipEmpCode(currentUser?.employeeId || 'EMP-001');
      setActiveTab('payslips');
    }
  };

  const handleApproveItem = async (id: string, comments?: string) => {
    try {
      await approvalApi.actionApproval(id, 'APPROVE', comments);
      refreshAllData();
    } catch (err: any) {
      console.warn('Failed to approve item:', err?.message);
    }
  };

  const handleRejectItem = async (id: string, comments?: string) => {
    try {
      await approvalApi.actionApproval(id, 'REJECT', comments);
      refreshAllData();
    } catch (err: any) {
      console.warn('Failed to reject item:', err?.message);
    }
  };

  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="font-semibold text-slate-300 text-sm">
          Authenticating WorkSphere Enterprise Session...
        </span>
      </div>
    );
  }

  // If system has 0 organizations, start with initial onboarding setup
  if (!isInitialized && organizations.length === 0) {
    return (
      <InitialSetupView
        onComplete={async () => {
          await refreshOrganization();
          await refreshAllData();
          setActiveTab('organization');
        }}
      />
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  if (!metrics) {
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
    organization: 'Workforce · Organizations',
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
          if (tab === 'organization') {
            setSelectedOrgId(null);
          }
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        pendingApprovalsCount={approvals.filter((a) => a.status === 'PENDING').length}
      />

      {/* App Area (Header + Main Content) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <TopHeader
          collapsed={sidebarCollapsed}
          activeModuleName={moduleTitles[activeTab] || 'Enterprise Workspace'}
          onOpenQuickAction={() => setQuickActionOpen(true)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'organization') setSelectedOrgId(null);
          }}
        />

        {/* Main Content Area */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-full">
          {activeTab === 'dashboard' && (
            <ExecutiveDashboardView
              metrics={metrics}
              approvalItems={approvals}
              onNavigateTab={(tab) => {
                setActiveTab(tab);
                if (tab === 'organization') setSelectedOrgId(null);
              }}
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

          {activeTab === 'organization' && (
            <div>
              {selectedOrgId ? (
                <OrganizationDetailView
                  organizationId={selectedOrgId}
                  onBack={() => setSelectedOrgId(null)}
                />
              ) : (
                <OrganizationListView
                  onSelectOrganization={(id) => setSelectedOrgId(id)}
                  onCreateOrganization={() => setCreateOrgOpen(true)}
                />
              )}
            </div>
          )}

          {activeTab === 'departments' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-on-surface">
                    Enterprise Departments
                  </h1>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Organizational divisions and cost centers for {currentOrganization?.name || 'Enterprise'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateDeptOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-on-primary bg-primary hover:bg-primary/95 rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Department</span>
                </button>
              </div>

              {departments.length === 0 ? (
                <EmptyState
                  icon={Network}
                  title="No departments found"
                  description="Create your first department to organize your workforce and reporting lines."
                  primaryAction={{
                    label: 'Create Department',
                    onClick: () => setCreateDeptOpen(true),
                    icon: Plus,
                  }}
                />
              ) : (
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-xs overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface-container-low text-xs text-on-surface-variant uppercase font-semibold border-b border-outline-variant/40">
                      <tr>
                        <th className="px-6 py-3.5">Code</th>
                        <th className="px-6 py-3.5">Department Name</th>
                        <th className="px-6 py-3.5">Headcount Target</th>
                        <th className="px-6 py-3.5">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30">
                      {departments.map((d) => (
                        <tr key={d.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-primary">{d.code}</td>
                          <td className="px-6 py-4 font-semibold text-on-surface">{d.name}</td>
                          <td className="px-6 py-4 text-on-surface-variant">
                            {d.headcountTarget || 10} positions
                          </td>
                          <td className="px-6 py-4 text-xs text-secondary">
                            {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Active'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-on-surface">
                    Office Locations & Campuses
                  </h1>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Geographic facilities and physical worksites registered in PostgreSQL
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateLocOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-on-primary bg-primary hover:bg-primary/95 rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Location</span>
                </button>
              </div>

              {locations.length === 0 ? (
                <EmptyState
                  icon={MapPin}
                  title="No locations found"
                  description="Register your primary campus, office, or remote hub to anchor workforce attendance."
                  primaryAction={{
                    label: 'Create Location',
                    onClick: () => setCreateLocOpen(true),
                    icon: Plus,
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {locations.map((l) => (
                    <div
                      key={l.id}
                      className="p-5 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                            {l.code}
                          </span>
                          <span className="text-xs text-secondary">{l.country}</span>
                        </div>
                        <h3 className="font-bold text-base text-on-surface mt-2">{l.name}</h3>
                        <p className="text-xs text-on-surface-variant mt-1">
                          {l.city}, {l.state}
                        </p>
                        {l.address && (
                          <p className="text-xs text-secondary mt-2 line-clamp-2">{l.address}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(activeTab === 'attendance' ||
            activeTab === 'shifts' ||
            activeTab === 'holidays' ||
            activeTab === 'overtime') && (
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

          {(activeTab === 'leave-requests' ||
            activeTab === 'leave-balances' ||
            activeTab === 'policies') && (
            <LeaveManagementView
              balances={leaveBalances}
              requests={leaveRequests}
              onOpenApplyModal={() => setApplyLeaveOpen(true)}
            />
          )}

          {(activeTab === 'payroll-overview' ||
            activeTab === 'payroll-runs' ||
            activeTab === 'components') && (
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

      <CreateOrganizationModal
        isOpen={createOrgOpen}
        onClose={() => setCreateOrgOpen(false)}
        onSuccess={async () => {
          await refreshOrganization();
          await refreshAllData();
          setActiveTab('organization');
        }}
      />

      <CreateDepartmentModal
        isOpen={createDeptOpen}
        onClose={() => setCreateDeptOpen(false)}
        onSuccess={refreshAllData}
      />

      <CreateLocationModal
        isOpen={createLocOpen}
        onClose={() => setCreateLocOpen(false)}
        onSuccess={refreshAllData}
      />

      <AddEmployeeModal
        isOpen={addEmployeeOpen}
        onClose={() => setAddEmployeeOpen(false)}
        onSubmit={async (empData) => {
          await employeeApi.createEmployee(empData);
          refreshAllData();
          setAddEmployeeOpen(false);
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
      <OrganizationProvider>
        <AppContent />
      </OrganizationProvider>
    </AuthProvider>
  );
}
