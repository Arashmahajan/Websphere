import { apiClient } from './apiClient.ts';
import {
  User,
  Organization,
  Department,
  Location,
  Employee,
  AttendanceRecord,
  RegularizationRequest,
  LeaveRequest,
  LeaveBalance,
  ApprovalItem,
  PayrollRun,
  PayrollException,
  Payslip,
  AuditLog,
  NotificationItem,
  DashboardMetrics,
} from '../types/index.ts';

export const setupApi = {
  getStatus: () =>
    apiClient.get<{ initialized: boolean; organizationCount: number; userCount: number }>('/api/v1/setup/status'),
  initialize: (data: {
    organization: {
      organizationCode: string;
      name: string;
      legalName: string;
      industry?: string;
      country: string;
      timezone: string;
      primaryEmail: string;
      phone?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      website?: string;
    };
    administrator: {
      firstName: string;
      lastName: string;
      email: string;
      password?: string;
    };
  }) =>
    apiClient.post<{
      success: boolean;
      message: string;
      organization: Organization;
      adminEmail: string;
      adminFullName: string;
      token?: string;
      user?: User;
    }>('/api/v1/setup/initialize', data),
};

export const organizationApi = {
  getOrganizations: () => apiClient.get<Organization[]>('/api/v1/organizations'),
  getOrganizationById: (id: string) => apiClient.get<Organization>(`/api/v1/organizations/${id}`),
  createOrganization: (data: Partial<Organization>) => apiClient.post<Organization>('/api/v1/organizations', data),
  updateOrganization: (id: string, data: Partial<Organization>) => apiClient.put<Organization>(`/api/v1/organizations/${id}`, data),
  changeStatus: (id: string, status: string) => apiClient.patch<Organization>(`/api/v1/organizations/${id}/status`, { status }),
};

export const departmentApi = {
  getDepartments: (organizationId?: string) => {
    const q = organizationId ? `?organizationId=${organizationId}` : '';
    return apiClient.get<{ data: Department[] }>(`/api/v1/departments${q}`);
  },
  createDepartment: (data: Partial<Department>) => apiClient.post<{ data: Department }>('/api/v1/departments', data),
};

export const locationApi = {
  getLocations: (organizationId?: string) => {
    const q = organizationId ? `?organizationId=${organizationId}` : '';
    return apiClient.get<{ data: Location[] }>(`/api/v1/locations${q}`);
  },
  createLocation: (data: Partial<Location>) => apiClient.post<{ data: Location }>('/api/v1/locations', data),
};

export const authApi = {
  getMe: () => apiClient.get<{ user: User | null }>('/api/v1/auth/me'),
  getUsers: () => apiClient.get<{ users: User[] }>('/api/v1/auth/users'),
  switchUser: (email: string) => apiClient.post<{ success: boolean; user: User; token?: string }>('/api/v1/auth/switch-user', { email }),
  login: (email: string, password?: string) =>
    apiClient.post<{ success: boolean; user: User; token: string }>('/api/v1/auth/login', { email, password }),
  logout: () => apiClient.post<{ success: boolean; message: string }>('/api/v1/auth/logout'),
};

export const dashboardApi = {
  getMetrics: () => apiClient.get<{ metrics: DashboardMetrics }>('/api/v1/dashboard/metrics'),
};

export const employeeApi = {
  getEmployees: (params?: {
    search?: string;
    department?: string;
    departmentId?: string;
    status?: string;
    location?: string;
    locationId?: string;
    contract?: string;
    employmentType?: string;
    page?: number;
    size?: number;
    limit?: number;
    sort?: string;
    direction?: string;
    organizationId?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.departmentId) query.set('departmentId', params.departmentId);
    else if (params?.department) query.set('department', params.department);
    if (params?.status) query.set('status', params.status);
    if (params?.locationId) query.set('locationId', params.locationId);
    else if (params?.location) query.set('location', params.location);
    if (params?.employmentType) query.set('employmentType', params.employmentType);
    if (params?.contract) query.set('contract', params.contract);
    if (params?.organizationId) query.set('organizationId', params.organizationId);
    if (params?.page !== undefined) query.set('page', params.page.toString());
    if (params?.size !== undefined) query.set('size', params.size.toString());
    else if (params?.limit !== undefined) query.set('limit', params.limit.toString());
    if (params?.sort) query.set('sort', params.sort);
    if (params?.direction) query.set('direction', params.direction);

    return apiClient.get<{
      data: Employee[];
      content?: Employee[];
      page?: number;
      size?: number;
      totalElements?: number;
      totalPages?: number;
      first?: boolean;
      last?: boolean;
      pagination?: { totalEmployees: number; filteredTotal: number; page: number; limit: number; totalPages: number };
    }>(`/api/v1/employees?${query.toString()}`);
  },
  getEmployeeById: (id: string) => apiClient.get<{ employee: Employee; data: Employee }>(`/api/v1/employees/${id}`),
  createEmployee: (data: Partial<Employee>) => apiClient.post<{ employee: Employee; data: Employee }>('/api/v1/employees', data),
  updateEmployee: (id: string, data: Partial<Employee>) =>
    apiClient.put<{ employee: Employee; data: Employee }>(`/api/v1/employees/${id}`, data),
  changeStatus: (id: string, status: string, version?: number, reason?: string) =>
    apiClient.patch<{ employee: Employee; data: Employee }>(`/api/v1/employees/${id}/status`, { status, version, reason }),
  getDepartments: () => apiClient.get<{ data: Department[] }>('/api/v1/departments'),
  getLocations: () => apiClient.get<{ data: Location[] }>('/api/v1/locations'),
  getManagers: () => apiClient.get<{ data: Employee[]; managers?: Employee[] }>('/api/v1/employees/managers'),
};

export const attendanceApi = {
  getAttendance: () =>
    apiClient.get<{
      records: AttendanceRecord[];
      userSession?: any;
      currentUserSession?: any;
      totalRecords?: number;
    }>('/api/v1/attendance'),
  punchIn: () => apiClient.post<{ success: boolean; session: any }>('/api/v1/attendance/punch-in'),
  punchOut: () => apiClient.post<{ success: boolean; session: any }>('/api/v1/attendance/punch-out'),
  toggleBreak: () => apiClient.post<{ success: boolean; session: any }>('/api/v1/attendance/toggle-break'),
  getRegularizations: () => apiClient.get<{ regularizations: RegularizationRequest[] }>('/api/v1/attendance/regularizations'),
  createRegularization: (data: Partial<RegularizationRequest>) =>
    apiClient.post<{ success: boolean; request: RegularizationRequest; regularization?: RegularizationRequest }>('/api/v1/attendance/regularize', data),
  requestRegularization: (data: Partial<RegularizationRequest>) =>
    apiClient.post<{ success: boolean; request: RegularizationRequest; regularization?: RegularizationRequest }>('/api/v1/attendance/regularize', data),
  actionRegularization: (id: string, action: 'APPROVE' | 'REJECT') =>
    apiClient.post<{ success: boolean; request: RegularizationRequest }>(`/api/v1/attendance/regularizations/${id}/action`, { action }),
};

export const leaveApi = {
  getLeaves: () =>
    apiClient.get<{ requests: LeaveRequest[]; balances: LeaveBalance[] }>('/api/v1/leave/requests'),
  getBalances: () => apiClient.get<{ balances: LeaveBalance[] }>('/api/v1/leave/requests'),
  getRequests: () => apiClient.get<{ requests: LeaveRequest[] }>('/api/v1/leave/requests'),
  applyLeave: (data: { leaveType: string; startDate: string; endDate: string; duration?: number; durationDays?: number; reason: string }) =>
    apiClient.post<{ success: boolean; request: LeaveRequest }>('/api/v1/leave/requests', data),
  reviewLeave: (id: string, action: 'APPROVE' | 'REJECT', comments?: string) =>
    apiClient.post<{ success: boolean; request: LeaveRequest }>(`/api/v1/leave/${id}/review`, { action, comments }),
};

export const payrollApi = {
  getRuns: () =>
    apiClient.get<{ currentRun: PayrollRun | null; runs: PayrollRun[]; exceptions: PayrollException[] }>('/api/v1/payroll/runs'),
  getExceptions: (runId?: string) => {
    const q = runId ? `?runId=${runId}` : '';
    return apiClient.get<{ exceptions: PayrollException[] }>(`/api/v1/payroll/exceptions${q}`);
  },
  resolveException: (id: string, action: string, notes?: string) =>
    apiClient.post<{ success: boolean; exception: PayrollException }>(`/api/v1/payroll/runs/pr-default/exceptions/${id}/resolve`, { action, notes }),
  startRun: (period: string) => apiClient.post<{ success: boolean; run: PayrollRun }>('/api/v1/payroll/start-run', { period }),
  approveRun: (id: string) => apiClient.post<{ success: boolean; run: PayrollRun }>(`/api/v1/payroll/runs/${id}/approve`),
  revalidate: (id: string) => apiClient.post<{ success: boolean; run: PayrollRun }>(`/api/v1/payroll/runs/${id}/revalidate`),
  getPayslip: (empCode: string) => apiClient.get<{ payslip: Payslip | null }>(`/api/v1/payroll/payslips/${empCode}`),
  getAiAdvice: (prompt: string) => apiClient.post<{ response: string }>('/api/v1/ai/payroll-assistant', { prompt }),
};

export const payslipApi = {
  getPayslips: () => apiClient.get<{ payslips: Payslip[] }>('/api/v1/payslips'),
  getPayslipById: (id: string) => apiClient.get<{ payslip: Payslip }>(`/api/v1/payslips/${id}`),
};

export const approvalApi = {
  getApprovals: () => apiClient.get<{ items: ApprovalItem[] }>('/api/v1/approvals'),
  getPendingApprovals: () => apiClient.get<{ items: ApprovalItem[] }>('/api/v1/approvals'),
  actionApproval: (id: string, action: 'APPROVE' | 'REJECT', comments?: string) =>
    apiClient.post<{ success: boolean; item: ApprovalItem }>(`/api/v1/approvals/${id}/action`, { action, comments }),
  takeAction: (id: string, action: 'APPROVE' | 'REJECT', comments?: string) =>
    apiClient.post<{ success: boolean; item: ApprovalItem }>(`/api/v1/approvals/${id}/action`, { action, comments }),
};

export const auditApi = {
  getLogs: () => apiClient.get<{ logs: AuditLog[] }>('/api/v1/audit-logs'),
  getAuditLogs: () => apiClient.get<{ logs: AuditLog[] }>('/api/v1/audit-logs'),
};

export const notificationApi = {
  getNotifications: () => apiClient.get<{ notifications: NotificationItem[] }>('/api/v1/notifications'),
  markAsRead: (id: string) => apiClient.post<{ success: boolean }>(`/api/v1/notifications/${id}/read`),
  markAllRead: () => apiClient.post<{ success: boolean; notifications: NotificationItem[] }>('/api/v1/notifications/read-all'),
  markAllAsRead: () => apiClient.post<{ success: boolean; notifications: NotificationItem[] }>('/api/v1/notifications/read-all'),
};

export const reportApi = {
  getReport: (type: string) => apiClient.get<any>(`/api/v1/reports/${type}`),
  getReportData: (type: string) => apiClient.get<any>(`/api/v1/reports/${type}`),
};
