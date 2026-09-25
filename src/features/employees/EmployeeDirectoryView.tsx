import React, { useState, useEffect, useMemo } from 'react';
import { Employee, EmployeeStatus, EmploymentType } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  useEmployees,
  useDepartments,
  useLocations,
  useManagers,
  EmployeeQueryParams,
} from './useEmployeeQueries.ts';
import { EditEmployeeModal } from './EditEmployeeModal.tsx';
import { ChangeStatusModal } from './ChangeStatusModal.tsx';
import { EmployeeDetailDrawer } from './EmployeeDetailDrawer.tsx';

interface EmployeeDirectoryViewProps {
  onOpenAddModal: () => void;
  onSelectEmployeeForPayslip?: (empCode: string) => void;
}

export const EmployeeDirectoryView: React.FC<EmployeeDirectoryViewProps> = ({
  onOpenAddModal,
  onSelectEmployeeForPayslip,
}) => {
  const { currentUser } = useAuth();

  // Read initial query params from window.location.search for URL state sync
  const initialParams = useMemo(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      return {
        search: sp.get('search') || '',
        departmentId: sp.get('departmentId') || 'all',
        locationId: sp.get('locationId') || 'all',
        status: sp.get('status') || 'all',
        employmentType: sp.get('employmentType') || 'all',
        page: parseInt(sp.get('page') || '0', 10),
        size: parseInt(sp.get('size') || '25', 10),
        sort: sp.get('sort') || 'lastName',
        direction: sp.get('direction') || 'asc',
      };
    } catch {
      return {
        search: '',
        departmentId: 'all',
        locationId: 'all',
        status: 'all',
        employmentType: 'all',
        page: 0,
        size: 25,
        sort: 'lastName',
        direction: 'asc',
      };
    }
  }, []);

  // State management
  const [search, setSearch] = useState(initialParams.search);
  const [debouncedSearch, setDebouncedSearch] = useState(initialParams.search);
  const [departmentId, setDepartmentId] = useState(initialParams.departmentId);
  const [locationId, setLocationId] = useState(initialParams.locationId);
  const [status, setStatus] = useState(initialParams.status);
  const [employmentType, setEmploymentType] = useState(initialParams.employmentType);
  const [page, setPage] = useState(initialParams.page);
  const [size, setSize] = useState(initialParams.size);
  const [sort, setSort] = useState(initialParams.sort);
  const [direction, setDirection] = useState<'asc' | 'desc'>(initialParams.direction as any);

  // Table selection & Modals state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [statusEmployee, setStatusEmployee] = useState<Employee | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Synchronize state with URL query parameters (Bookmarkable & Refresh-Safe)
  useEffect(() => {
    try {
      const sp = new URLSearchParams();
      if (debouncedSearch) sp.set('search', debouncedSearch);
      if (departmentId && departmentId !== 'all') sp.set('departmentId', departmentId);
      if (locationId && locationId !== 'all') sp.set('locationId', locationId);
      if (status && status !== 'all') sp.set('status', status);
      if (employmentType && employmentType !== 'all') sp.set('employmentType', employmentType);
      if (page > 0) sp.set('page', page.toString());
      if (size !== 25) sp.set('size', size.toString());
      if (sort !== 'lastName') sp.set('sort', sort);
      if (direction !== 'asc') sp.set('direction', direction);

      const newUrl = `${window.location.pathname}${sp.toString() ? '?' + sp.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);
    } catch {
      // Ignore if running outside browser
    }
  }, [debouncedSearch, departmentId, locationId, status, employmentType, page, size, sort, direction]);

  // Fetch Catalogs
  const { data: departments = [] } = useDepartments();
  const { data: locations = [] } = useLocations();
  const { data: managers = [] } = useManagers();

  // Query Params for API
  const queryArgs: EmployeeQueryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      departmentId: departmentId !== 'all' ? departmentId : undefined,
      locationId: locationId !== 'all' ? locationId : undefined,
      status: status !== 'all' ? status : undefined,
      employmentType: employmentType !== 'all' ? employmentType : undefined,
      page,
      size,
      sort,
      direction,
    }),
    [debouncedSearch, departmentId, locationId, status, employmentType, page, size, sort, direction]
  );

  // TanStack Query for employees
  const {
    data: employeeData,
    isLoading,
    isError,
    refetch,
  } = useEmployees(queryArgs);

  const employees = employeeData?.employees || [];
  const totalElements = employeeData?.totalElements || 0;
  const totalPages = employeeData?.totalPages || 1;

  // Authorization checks
  const canWrite =
    currentUser?.role === 'SYSTEM_ADMIN' ||
    currentUser?.role === 'HR_ADMIN' ||
    currentUser?.permissions.includes('EMPLOYEE_WRITE');

  const canChangeStatus =
    currentUser?.role === 'SYSTEM_ADMIN' ||
    currentUser?.role === 'HR_ADMIN' ||
    currentUser?.permissions.includes('EMPLOYEE_STATUS_CHANGE') ||
    currentUser?.permissions.includes('EMPLOYEE_WRITE');

  // Sorting handler
  const handleSort = (field: string) => {
    if (sort === field) {
      setDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field);
      setDirection('asc');
    }
    setPage(0);
  };

  // Row selection
  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleToggleAll = () => {
    if (selectedIds.length === employees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(employees.map((e) => e.id));
    }
  };

  const hasActiveFilters =
    debouncedSearch !== '' ||
    departmentId !== 'all' ||
    locationId !== 'all' ||
    status !== 'all' ||
    employmentType !== 'all';

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setDepartmentId('all');
    setLocationId('all');
    setStatus('all');
    setEmploymentType('all');
    setPage(0);
  };

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-200">
      {/* Batch Action Banner */}
      {selectedIds.length > 0 && (
        <div className="sticky top-16 z-30 mb-space-base bg-inverse-surface text-inverse-on-surface px-gutter-desktop py-space-sm rounded-xl shadow-xl flex items-center justify-between transition-all duration-300">
          <div className="flex items-center gap-space-md">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-on-primary font-code-sm text-code-sm font-bold">
              {selectedIds.length}
            </span>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm font-semibold tracking-wide">
                Selected Enterprise Personnel
              </span>
              <span className="font-body-xs text-body-xs text-surface-dim">
                Operations apply across selected headcount
              </span>
            </div>
            <div className="h-5 w-px bg-on-surface-variant/40 ml-space-xs"></div>
            <div className="flex items-center gap-space-xs flex-wrap">
              <button
                onClick={() => alert(`Direct Manager reassignment initialized for ${selectedIds.length} records.`)}
                className="flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container-high/20 hover:bg-surface-container-high/40 text-inverse-on-surface font-label-xs text-label-xs transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-sm">assignment_ind</span>
                <span>Assign Direct Manager</span>
              </button>
              <button
                onClick={() => alert(`Department Transfer workflow opened for ${selectedIds.length} personnel.`)}
                className="flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container-high/20 hover:bg-surface-container-high/40 text-inverse-on-surface font-label-xs text-label-xs transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-sm">domain</span>
                <span>Department Transfer</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-space-sm">
            <button
              className="px-space-sm py-1 text-surface-dim hover:text-white font-label-xs text-label-xs underline underline-offset-4 cursor-pointer"
              onClick={() => setSelectedIds([])}
              type="button"
            >
              Deselect All
            </button>
            <button
              className="p-1 rounded hover:bg-surface-container-high/20 text-surface-dim cursor-pointer"
              onClick={() => setSelectedIds([])}
              type="button"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Primary Header Strip */}
      <div className="flex flex-col gap-space-md mb-space-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-base">
          <div className="flex flex-col gap-space-2xs">
            <div className="flex items-center gap-space-xs text-secondary font-label-xs text-label-xs uppercase tracking-wider">
              <span>Workforce</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-on-surface font-semibold">Employees</span>
              <span className="ml-space-xs px-1.5 py-0.5 rounded bg-surface-container-high font-code-sm text-code-sm text-on-surface-variant">
                PostgreSQL · Spring Data JPA
              </span>
            </div>
            <div className="flex items-center gap-space-md">
              <h1 className="font-display-lg text-display-lg font-bold text-on-surface tracking-tight">
                Employee Directory
              </h1>
              <span className="px-space-sm py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-xs text-label-xs font-semibold">
                {totalElements} Active Personnel
              </span>
            </div>
            <p className="text-secondary text-sm mt-0.5">
              Manage employee records, workforce information, and employment lifecycle.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-xs">
            <button
              onClick={() => {
                const csvRows = [
                  ['Employee Code', 'Name', 'Email', 'Department', 'Job Title', 'Status', 'Date Joined'],
                  ...employees.map((e) => [
                    e.employeeCode,
                    `${e.firstName} ${e.lastName}`,
                    e.email,
                    e.departmentName,
                    e.jobTitle,
                    e.status,
                    e.dateOfJoining,
                  ]),
                ];
                const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((r) => r.join(',')).join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', 'WorkSphere_Employees.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex items-center gap-space-xs h-9 px-space-md bg-surface-container-lowest text-on-surface hover:bg-surface-container-high rounded font-label-sm text-label-sm shadow-xs transition-all border border-slate-200 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-base text-secondary">file_download</span>
              <span>Export CSV</span>
            </button>

            {canWrite && (
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-space-xs h-9 px-space-md bg-primary text-on-primary hover:bg-primary-container rounded font-label-sm text-label-sm shadow-xs transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                <span>Add New Employee</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-xs border border-slate-200 flex flex-col gap-space-md">
          {/* Top Row: Search Input & Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-space-md">
            <div className="relative w-full md:w-96">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-base pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code, name, email, designation..."
                className="w-full h-9 pl-9 pr-8 rounded-lg bg-surface-container-low border border-slate-200 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-secondary hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">cancel</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-space-sm w-full md:w-auto justify-end">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                  <span>Clear Filters</span>
                </button>
              )}

              <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-surface-container-low">
                <button
                  type="button"
                  onClick={() => setDensity('comfortable')}
                  className={`p-1 rounded cursor-pointer ${
                    density === 'comfortable' ? 'bg-white shadow-xs text-primary' : 'text-secondary'
                  }`}
                  title="Comfortable Density"
                >
                  <span className="material-symbols-outlined text-base">view_headline</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDensity('compact')}
                  className={`p-1 rounded cursor-pointer ${
                    density === 'compact' ? 'bg-white shadow-xs text-primary' : 'text-secondary'
                  }`}
                  title="Compact Density"
                >
                  <span className="material-symbols-outlined text-base">reorder</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Dynamic Filter Selects from Database */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md pt-2 border-t border-surface-container-low">
            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase text-[11px]">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setPage(0);
                }}
                className="h-8 px-2 rounded bg-surface-container-low border border-slate-200 text-xs text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase text-[11px]">
                Office Location
              </label>
              <select
                value={locationId}
                onChange={(e) => {
                  setLocationId(e.target.value);
                  setPage(0);
                }}
                className="h-8 px-2 rounded bg-surface-container-low border border-slate-200 text-xs text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="all">All Locations</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase text-[11px]">
                Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
                className="h-8 px-2 rounded bg-surface-container-low border border-slate-200 text-xs text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_LEAVE">ON_LEAVE</option>
                <option value="PROBATION">PROBATION</option>
                <option value="NOTICE">NOTICE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="TERMINATED">TERMINATED</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-secondary font-semibold uppercase text-[11px]">
                Contract Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => {
                  setEmploymentType(e.target.value);
                  setPage(0);
                }}
                className="h-8 px-2 rounded bg-surface-container-low border border-slate-200 text-xs text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="all">All Contract Types</option>
                <option value="FULL_TIME">Full-time Regular</option>
                <option value="PART_TIME">Part-time</option>
                <option value="CONTRACT">Contractor</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Data Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs overflow-hidden flex flex-col border border-slate-200">
        {/* Error State */}
        {isError && (
          <div className="p-8 flex flex-col items-center justify-center gap-3 text-center">
            <span className="material-symbols-outlined text-4xl text-rose-500">error</span>
            <div className="flex flex-col">
              <span className="font-bold text-on-surface text-base">Unable to load employees.</span>
              <span className="text-secondary text-xs">
                Could not retrieve workforce records from the backend API.
              </span>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>Retry Query</span>
            </button>
          </div>
        )}

        {/* Table Content */}
        {!isError && (
          <div className="overflow-x-auto w-full">
            <table className="min-w-[1050px] w-full text-left border-collapse select-text">
              <thead>
                <tr className="bg-surface-container-low text-secondary font-label-xs text-label-xs uppercase tracking-wider select-none h-10 border-b border-slate-200">
                  <th className="w-10 px-space-sm text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === employees.length && employees.length > 0}
                      onChange={handleToggleAll}
                      className="rounded w-4 h-4 text-primary focus:ring-0 cursor-pointer accent-primary"
                    />
                  </th>
                  <th
                    onClick={() => handleSort('employeeCode')}
                    className="px-space-sm font-semibold cursor-pointer hover:text-on-surface transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Employee ID</span>
                      {sort === 'employeeCode' ? (
                        <span className="material-symbols-outlined text-xs text-primary font-bold">
                          {direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-xs opacity-60">sort</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('lastName')}
                    className="px-space-sm font-semibold cursor-pointer hover:text-on-surface transition-colors min-w-[220px]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Full Name & Contact</span>
                      {sort === 'lastName' ? (
                        <span className="material-symbols-outlined text-xs text-primary font-bold">
                          {direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-xs opacity-60">sort</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('departmentName')}
                    className="px-space-sm font-semibold cursor-pointer hover:text-on-surface transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Department</span>
                      {sort === 'departmentName' ? (
                        <span className="material-symbols-outlined text-xs text-primary font-bold">
                          {direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-xs opacity-60">sort</span>
                      )}
                    </div>
                  </th>
                  <th className="px-space-sm font-semibold min-w-[170px]">Designation / Role</th>
                  <th className="px-space-sm font-semibold min-w-[160px]">Reporting Manager</th>
                  <th className="px-space-sm font-semibold">Location</th>
                  <th className="px-space-sm font-semibold">Type</th>
                  <th
                    onClick={() => handleSort('dateOfJoining')}
                    className="px-space-sm font-semibold cursor-pointer hover:text-on-surface transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Joining Date</span>
                      {sort === 'dateOfJoining' ? (
                        <span className="material-symbols-outlined text-xs text-primary font-bold">
                          {direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-xs opacity-60">sort</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="px-space-sm font-semibold cursor-pointer hover:text-on-surface transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      {sort === 'status' ? (
                        <span className="material-symbols-outlined text-xs text-primary font-bold">
                          {direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-xs opacity-60">sort</span>
                      )}
                    </div>
                  </th>
                  <th className="px-space-md text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-surface-container-low font-body-sm text-body-sm text-on-surface">
                {/* Skeleton Loading State */}
                {isLoading && (
                  <>
                    {[...Array(6)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="w-10 px-space-sm py-3 text-center">
                          <div className="w-4 h-4 bg-slate-200 rounded mx-auto"></div>
                        </td>
                        <td className="px-space-sm py-3">
                          <div className="w-20 h-4 bg-slate-200 rounded"></div>
                        </td>
                        <td className="px-space-sm py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                            <div className="flex flex-col gap-1">
                              <div className="w-28 h-3.5 bg-slate-200 rounded"></div>
                              <div className="w-36 h-2.5 bg-slate-200 rounded"></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-space-sm py-3">
                          <div className="w-24 h-4 bg-slate-200 rounded"></div>
                        </td>
                        <td className="px-space-sm py-3">
                          <div className="w-32 h-4 bg-slate-200 rounded"></div>
                        </td>
                        <td className="px-space-sm py-3">
                          <div className="w-28 h-4 bg-slate-200 rounded"></div>
                        </td>
                        <td className="px-space-sm py-3">
                          <div className="w-20 h-4 bg-slate-200 rounded"></div>
                        </td>
                        <td className="px-space-sm py-3">
                          <div className="w-16 h-4 bg-slate-200 rounded"></div>
                        </td>
                        <td className="px-space-sm py-3">
                          <div className="w-20 h-4 bg-slate-200 rounded"></div>
                        </td>
                        <td className="px-space-sm py-3">
                          <div className="w-16 h-5 bg-slate-200 rounded-full"></div>
                        </td>
                        <td className="px-space-md py-3 text-right">
                          <div className="w-16 h-4 bg-slate-200 rounded ml-auto"></div>
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Empty State */}
                {!isLoading && employees.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-4xl text-slate-300">
                          person_search
                        </span>
                        <span className="font-semibold text-on-surface text-sm">No employees found.</span>
                        {hasActiveFilters ? (
                          <div className="flex flex-col items-center gap-2 mt-1">
                            <span className="text-secondary text-xs">
                              Try adjusting your filters or search terms.
                            </span>
                            <button
                              type="button"
                              onClick={clearFilters}
                              className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              Clear Filters
                            </button>
                          </div>
                        ) : (
                          <span className="text-secondary text-xs">The employee register is currently empty.</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {/* Real Data Rows */}
                {!isLoading &&
                  employees.map((emp) => {
                    const isSelected = selectedIds.includes(emp.id);
                    const pyClass = density === 'compact' ? 'py-1.5' : 'py-3';

                    return (
                      <tr
                        key={emp.id}
                        className={`hover:bg-surface-container-low/60 transition-colors group ${
                          isSelected ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <td className={`w-10 px-space-sm text-center ${pyClass}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(emp.id)}
                            className="rounded w-4 h-4 text-primary focus:ring-0 cursor-pointer accent-primary"
                          />
                        </td>
                        <td className={`px-space-sm ${pyClass}`}>
                          <span className="font-mono text-xs font-bold text-primary">
                            {emp.employeeCode}
                          </span>
                        </td>
                        <td
                          className={`px-space-sm ${pyClass} cursor-pointer`}
                          onClick={() => setDetailEmployee(emp)}
                        >
                          <div className="flex items-center gap-space-sm">
                            {emp.avatarUrl ? (
                              <img
                                src={emp.avatarUrl}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover shadow-inner flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
                                {emp.firstName[0]}
                                {emp.lastName[0]}
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-on-surface truncate group-hover:text-primary transition-colors text-xs">
                                {emp.firstName} {emp.lastName}
                              </span>
                              <span className="text-[11px] text-secondary truncate">{emp.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className={`px-space-sm ${pyClass}`}>
                          <span className="px-2 py-0.5 rounded bg-surface-container text-xs text-on-surface font-medium">
                            {emp.departmentName}
                          </span>
                        </td>
                        <td className={`px-space-sm ${pyClass}`}>
                          <div className="flex flex-col">
                            <span className="font-medium text-on-surface text-xs">{emp.jobTitle}</span>
                            <span className="font-mono text-[10px] text-secondary">{emp.level}</span>
                          </div>
                        </td>
                        <td className={`px-space-sm ${pyClass}`}>
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">
                              {(emp.managerName || 'Mgr')[0]}
                            </span>
                            <span className="text-on-surface text-xs truncate">
                              {emp.managerName || 'Direct'}
                            </span>
                          </div>
                        </td>
                        <td className={`px-space-sm ${pyClass}`}>
                          <div className="flex items-center gap-1 text-secondary text-xs">
                            <span className="material-symbols-outlined text-xs">location_pin</span>
                            <span>{emp.locationName.split(' ')[0]}</span>
                          </div>
                        </td>
                        <td className={`px-space-sm ${pyClass}`}>
                          <span className="text-[11px] text-secondary capitalize font-medium">
                            {emp.employmentType.toLowerCase().replace('_', '-')}
                          </span>
                        </td>
                        <td className={`px-space-sm font-mono text-xs text-secondary ${pyClass}`}>
                          {emp.dateOfJoining}
                        </td>
                        <td className={`px-space-sm ${pyClass}`}>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              emp.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : emp.status === 'ON_LEAVE'
                                ? 'bg-blue-100 text-blue-800'
                                : emp.status === 'SUSPENDED'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                emp.status === 'ACTIVE'
                                  ? 'bg-emerald-600'
                                  : emp.status === 'ON_LEAVE'
                                  ? 'bg-blue-600'
                                  : emp.status === 'SUSPENDED'
                                  ? 'bg-amber-600'
                                  : 'bg-rose-600'
                              }`}
                            ></span>
                            <span>{emp.status}</span>
                          </span>
                        </td>
                        <td className={`px-space-md text-right ${pyClass}`}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailEmployee(emp)}
                              className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                              title="View Detailed Profile"
                            >
                              <span className="material-symbols-outlined text-base">visibility</span>
                            </button>
                            {canWrite && (
                              <button
                                type="button"
                                onClick={() => setEditEmployee(emp)}
                                className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                                title="Edit Personnel Record"
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
                            )}
                            {canChangeStatus && (
                              <button
                                type="button"
                                onClick={() => setStatusEmployee(emp)}
                                className="p-1.5 rounded-lg text-secondary hover:text-amber-600 hover:bg-surface-container transition-colors cursor-pointer"
                                title="Change Status / Lifecycle"
                              >
                                <span className="material-symbols-outlined text-base">swap_horiz</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onSelectEmployeeForPayslip?.(emp.employeeCode)}
                              className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                              title="View Payslip"
                            >
                              <span className="material-symbols-outlined text-base">receipt_long</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Bar */}
        {!isError && (
          <div className="px-gutter-desktop py-space-sm bg-surface-container-lowest border-t border-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-base">
            <div className="flex items-center gap-space-base">
              <span className="font-body-sm text-body-sm text-secondary text-xs">
                Showing{' '}
                <span className="font-semibold text-on-surface">
                  {totalElements === 0 ? 0 : page * size + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-on-surface">
                  {Math.min((page + 1) * size, totalElements)}
                </span>{' '}
                of <span className="font-semibold text-on-surface">{totalElements}</span> personnel
              </span>

              <div className="flex items-center gap-space-xs text-secondary font-body-sm text-body-sm text-xs">
                <span>Rows:</span>
                <select
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="h-7 px-1.5 rounded bg-surface-container-low border border-slate-200 text-on-surface font-label-sm text-xs focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page === 0 || isLoading}
                onClick={() => setPage(0)}
                className="flex items-center justify-center w-8 h-8 rounded bg-surface-container-low text-secondary hover:text-on-surface disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                type="button"
                title="First Page"
              >
                <span className="material-symbols-outlined text-base">first_page</span>
              </button>
              <button
                disabled={page === 0 || isLoading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="flex items-center justify-center w-8 h-8 rounded bg-surface-container-low text-secondary hover:text-on-surface disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                type="button"
                title="Previous Page"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>

              <div className="flex items-center gap-1 font-label-sm text-xs">
                <span className="px-3 py-1 rounded bg-primary text-on-primary font-bold">
                  {page + 1}
                </span>
                <span className="text-secondary text-xs">of {totalPages}</span>
              </div>

              <button
                disabled={page >= totalPages - 1 || isLoading}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="flex items-center justify-center w-8 h-8 rounded bg-surface-container-low text-secondary hover:text-on-surface disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                type="button"
                title="Next Page"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
              <button
                disabled={page >= totalPages - 1 || isLoading}
                onClick={() => setPage(totalPages - 1)}
                className="flex items-center justify-center w-8 h-8 rounded bg-surface-container-low text-secondary hover:text-on-surface disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                type="button"
                title="Last Page"
              >
                <span className="material-symbols-outlined text-base">last_page</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      <EmployeeDetailDrawer
        employee={detailEmployee}
        onClose={() => setDetailEmployee(null)}
        onEdit={(emp) => {
          setDetailEmployee(null);
          setEditEmployee(emp);
        }}
        onChangeStatus={(emp) => {
          setDetailEmployee(null);
          setStatusEmployee(emp);
        }}
        onSelectEmployeeForPayslip={onSelectEmployeeForPayslip}
      />

      <EditEmployeeModal
        isOpen={!!editEmployee}
        employee={editEmployee}
        departments={departments}
        locations={locations}
        managers={managers}
        onClose={() => setEditEmployee(null)}
        onSuccess={(updated) => {
          setEditEmployee(null);
          setDetailEmployee(updated);
        }}
      />

      <ChangeStatusModal
        isOpen={!!statusEmployee}
        employee={statusEmployee}
        onClose={() => setStatusEmployee(null)}
        onSuccess={(updated) => {
          setStatusEmployee(null);
          if (detailEmployee?.id === updated.id) {
            setDetailEmployee(updated);
          }
        }}
      />
    </div>
  );
};
