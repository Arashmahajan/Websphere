import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationApi } from '../../services/apiServices.ts';
import { Organization } from '../../types/index.ts';

export const organizationQueryKeys = {
  all: ['organizations'] as const,
  detail: (id: string) => ['organization', id] as const,
};

export function useOrganizations() {
  return useQuery({
    queryKey: organizationQueryKeys.all,
    queryFn: () => organizationApi.getOrganizations(),
    staleTime: 1000 * 30, // 30s
    retry: 1,
  });
}

export function useOrganization(id: string | null | undefined) {
  return useQuery({
    queryKey: organizationQueryKeys.detail(id || ''),
    queryFn: () => {
      if (!id) return null;
      return organizationApi.getOrganizationById(id);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60, // 1m
    retry: 1,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Organization>) => organizationApi.createOrganization(data),
    retry: false, // Do not auto-retry creation to prevent duplicate org codes
    onSuccess: (newOrg) => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all });
      if (newOrg?.id) {
        queryClient.setQueryData(organizationQueryKeys.detail(newOrg.id), newOrg);
      }
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Organization> }) =>
      organizationApi.updateOrganization(id, data),
    retry: false,
    onSuccess: (updatedOrg, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.detail(variables.id) });
    },
  });
}

export function useChangeOrganizationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      organizationApi.changeStatus(id, status),
    retry: false,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.detail(variables.id) });
    },
  });
}
