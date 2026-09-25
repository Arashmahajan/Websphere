import { apiClient } from './apiClient.ts';
import {
  User,
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

export const authApi = {
  getMe: () => apiClient.get<{ user: User }>('/api/v1/auth/me'),
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
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.departmentId) query.set('departmentId', params.departmentId);
    else if (params?.department) query.set('department', params.department);
    if (params?.status) query.set('status', params.status);
    if (params?.locationId) query.set('locationId', params.locationId);
    else if (params?.location) query.set('location', params.location);
    if (params?.employmentType) query.set('employmentType', params.employmentType);
    else if (params?.contract) query.set('contract', params.contract);
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
  getDepartments: () => apiClient.get<{ data: Array<{ id: string; code: string; name: string; headcountTarget?: number }> }>('/api/v1/departments'),
  getLocations: () => apiClient.get<{ data: Array<{ id: string; code: string; name: string; city: string; state: string; country: string }> }>('/api/v1/locations'),
  getManagers: () => apiClient.get<{ data: Employee[]; managers?: Employee[] }>('/api/v1/employees/managers'),
};

export const attendanceApi = {
  getAttendance: () =>
    apiClient.get<{
      records: AttendanceRecord[];
      userSession: {
        active: boolean;
        checkInTime: string;
        shift: string;
        location: string;
        onBreak: boolean;
        breakCount: number;
        remoteLogged: boolean;
      };
      totalRecords: number;
    }>('/api/v1/attendance'),
  punchIn: () => apiClient.post<{ success: boolean; session: any }>('/api/v1/attendance/punch-in'),
  punchOut: () => apiClient.post<{ success: boolean; message: string }>('/api/v1/attendance/punch-out'),
  toggleBreak: () => apiClient.post<{ success: boolean; session: any }>('/api/v1/attendance/toggle-break'),
  getRegularizations: () => apiClient.get<{ regularizations: RegularizationRequest[] }>('/api/v1/attendance/regularizations'),
  createRegularization: (data: {
    employeeName?: string;
    employeeCode?: string;
    incidentDate: string;
    category: string;
    proposedTime: string;
    reason: string;
  }) => apiClient.post<{ regularization: RegularizationRequest }>('/api/v1/attendance/regularize', data),
  actionRegularization: (id: string, action: 'APPROVE' | 'REJECT') =>
    apiClient.post<{ regularization: RegularizationRequest }>(`/api/v1/attendance/regularizations/${id}/action`, { action }),
};

export const leaveApi = {
  getLeaves: () => apiClient.get<{ requests: LeaveRequest[]; balances: LeaveBalance[] }>('/api/v1/leave/requests'),
  applyLeave: (data: { leaveType: string; startDate: string; endDate: string; reason: string }) =>
    apiClient.post<{ request: LeaveRequest; balances: LeaveBalance[] }>('/api/v1/leave/requests', data),
};

export const payrollApi = {
  getRuns: () => apiClient.get<{ currentRun: PayrollRun; exceptions: PayrollException[] }>('/api/v1/payroll/runs'),
  revalidate: (id: string) => apiClient.post<{ success: boolean; message: string; currentRun: PayrollRun; exceptions: PayrollException[] }>(`/api/v1/payroll/runs/${id}/revalidate`),
  resolveException: (runId: string, excId: string) =>
    apiClient.post<{ success: boolean; exception: PayrollException; currentRun: PayrollRun }>(`/api/v1/payroll/runs/${runId}/exceptions/${excId}/resolve`),
  approveRun: (id: string) => apiClient.post<{ success: boolean; currentRun: PayrollRun }>(`/api/v1/payroll/runs/${id}/approve`),
  getPayslip: (empCode: string) => apiClient.get<{ payslip: Payslip }>(`/api/v1/payroll/payslips/${empCode}`),
  getAiAdvice: () => apiClient.post<{ result: any }>('/api/v1/ai/payroll-assistant'),
};

export const approvalApi = {
  getApprovals: () => apiClient.get<{ items: ApprovalItem[] }>('/api/v1/approvals'),
  actionApproval: (id: string, action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES', comments?: string) =>
    apiClient.post<{ item: ApprovalItem }>(`/api/v1/approvals/${id}/action`, { action, comments }),
};

export const reportApi = {
  getReport: (type: string) =>
    apiClient.get<{
      reportType: string;
      generatedAt: string;
      filterSummary: any;
      departmentBreakdown: Array<{ name: string; headcount: number; present: number; rate: string; leave: number; remote: number; status: string }>;
    }>(`/api/v1/reports/${type}`),
};

export const auditApi = {
  getLogs: () => apiClient.get<{ logs: AuditLog[] }>('/api/v1/audit-logs'),
};

export const notificationApi = {
  getNotifications: () => apiClient.get<{ notifications: NotificationItem[] }>('/api/v1/notifications'),
  markRead: (id: string) => apiClient.post<{ success: boolean; notification: NotificationItem }>(`/api/v1/notifications/${id}/read`),
  markAllRead: () => apiClient.post<{ success: boolean; notifications: NotificationItem[] }>('/api/v1/notifications/read-all'),
};
