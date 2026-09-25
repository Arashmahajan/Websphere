import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../../services/apiServices.ts';
import { Employee, EmployeeStatus, EmploymentType } from '../../types/index.ts';

export interface EmployeeQueryParams {
  search?: string;
  departmentId?: string;
  locationId?: string;
  status?: string;
  employmentType?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: string;
}

export function useEmployees(params: EmployeeQueryParams = {}) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: async () => {
      const res = await employeeApi.getEmployees(params);
      const items = res.content || res.data || [];
      const pagination = res.pagination || {
        totalEmployees: res.totalElements || items.length,
        filteredTotal: res.totalElements || items.length,
        page: (res.page !== undefined ? res.page : 0) + 1,
        limit: res.size || 25,
        totalPages: res.totalPages || 1,
      };
      return {
        employees: items,
        pagination,
        totalElements: res.totalElements !== undefined ? res.totalElements : items.length,
        totalPages: res.totalPages || 1,
        page: res.page !== undefined ? res.page : (params.page || 0),
        size: res.size || 25,
      };
    },
  });
}

export function useEmployee(id: string | null | undefined) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await employeeApi.getEmployeeById(id);
      return res.employee || res.data;
    },
    enabled: !!id,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await employeeApi.getDepartments();
      return res.data || [];
    },
  });
}

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await employeeApi.getLocations();
      return res.data || [];
    },
  });
}

export function useManagers() {
  return useQuery({
    queryKey: ['managers'],
    queryFn: async () => {
      const res = await employeeApi.getManagers();
      return res.data || res.managers || [];
    },
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newEmployeeData: Partial<Employee>) => employeeApi.createEmployee(newEmployeeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['managers'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) =>
      employeeApi.updateEmployee(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['managers'] });
    },
  });
}

export function useChangeEmployeeStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, version, reason }: { id: string; status: EmployeeStatus; version?: number; reason?: string }) =>
      employeeApi.changeStatus(id, status, version, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['managers'] });
    },
  });
}
