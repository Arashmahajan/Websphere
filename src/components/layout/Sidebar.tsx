import React from 'react';

export type NavigationTab =
  | 'dashboard'
  | 'employees'
  | 'departments'
  | 'teams'
  | 'organization'
  | 'attendance'
  | 'shifts'
  | 'holidays'
  | 'overtime'
  | 'leave-requests'
  | 'leave-balances'
  | 'policies'
  | 'payroll-overview'
  | 'payroll-runs'
  | 'payslips'
  | 'components'
  | 'my-approvals'
  | 'approval-history'
  | 'reports-workforce'
  | 'reports-attendance'
  | 'reports-payroll'
  | 'reports-leave'
  | 'users-and-roles'
  | 'audit-logs'
  | 'settings';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  pendingApprovalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
  pendingApprovalsCount = 127,
}) => {
  const navItemClass = (tab: NavigationTab) =>
    `flex items-center ${
      collapsed ? 'justify-center px-2' : 'gap-2.5 px-3'
    } py-2 rounded-lg transition-all cursor-pointer text-xs font-semibold ${
      activeTab === tab
        ? 'bg-primary-container text-on-primary shadow-xs'
        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
    }`;

  return (
    <aside
      id="sidebar"
      className={`
        bg-surface-container-lowest border-r border-slate-200
        flex flex-col justify-between overflow-hidden
        transition-all duration-300
        ${
          mobileOpen
            ? 'fixed inset-y-0 left-0 z-50 w-[296px] shadow-2xl flex h-screen'
            : 'hidden md:flex md:sticky md:top-0 md:h-screen md:flex-shrink-0 md:z-30'
        }
        ${collapsed ? 'md:w-[72px]' : 'md:w-[296px]'}
      `}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Brand Header */}
        <div className={`p-4 flex flex-col gap-2.5 bg-surface-container-lowest border-b border-surface-container-low flex-shrink-0 ${collapsed ? 'items-center' : ''}`}>
          <div className="flex items-center justify-between w-full">
            <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center w-full' : ''}`}>
              <img
                alt="WorkSphere Brand Logo"
                className="h-8 w-auto object-contain flex-shrink-0"
                src="https://lh3.googleusercontent.com/aida/AEtjO1VWVNolRXX_BAERd5EvRl-5pjKIdaiQCECItQG-gF-tzpVn5Uy48wntoEW-toLaiPEdEGyf9z8KU4SDYXuuHLcvEswfQ8vm08TEqwWZMxfY3ffiqmbsy7f6Ej6puN-ZyLir3ep_tOeRmKXZK5e8XKAr3R9VYRM8F8zE6yVUEPS8XDWQX5iCbQ3KfvX1h6IDUK0vVHhCXwTvE8nwFNMkpGItz80od4iqB2bZfIGSCURqCirPFNznsci3vS8"
              />
              {!collapsed && (
                <div className="flex flex-col overflow-hidden min-w-0">
                  <span className="font-headline-sm text-base font-bold text-on-surface tracking-tight truncate">
                    WorkSphere
                  </span>
                  <span className="font-label-xs text-[10px] text-on-surface-variant uppercase tracking-wider truncate">
                    Enterprise HCM
                  </span>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="md:hidden p-1 text-secondary hover:text-on-surface hover:bg-surface-container rounded-lg cursor-pointer flex items-center justify-center"
                aria-label="Close navigation sidebar"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            )}
          </div>

          {/* Organization Selector */}
          {!collapsed ? (
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer border border-slate-200/60">
              <div className="flex items-center gap-2 overflow-hidden min-w-0">
                <span className="material-symbols-outlined text-secondary text-base flex-shrink-0">domain</span>
                <span className="font-label-sm text-xs font-semibold text-on-surface truncate">
                  Acme Global Enterprise
                </span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-base flex-shrink-0">unfold_more</span>
            </div>
          ) : (
            <button
              type="button"
              className="flex items-center justify-center p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-secondary transition-colors cursor-pointer border border-slate-200/60"
              title="Organization: Acme Global Enterprise"
              aria-label="Organization: Acme Global Enterprise"
            >
              <span className="material-symbols-outlined text-base">domain</span>
            </button>
          )}
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin">
          <nav className="flex flex-col gap-space-md">
            {/* Main */}
            <div className="flex flex-col gap-space-2xs">
              {!collapsed && (
                <span className="px-space-sm font-label-xs text-label-xs uppercase tracking-wider text-secondary font-semibold">
                  Main
                </span>
              )}
              <button
                type="button"
                onClick={() => onSelectTab('dashboard')}
                className={navItemClass('dashboard')}
                title="Executive Operations & HR Dashboard"
              >
                <span className="material-symbols-outlined text-lg">dashboard</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Dashboard</span>}
              </button>
            </div>

            {/* Workforce */}
            <div className="flex flex-col gap-space-2xs">
              {!collapsed && (
                <span className="px-space-sm font-label-xs text-label-xs uppercase tracking-wider text-secondary font-semibold">
                  Workforce
                </span>
              )}
              <button
                type="button"
                onClick={() => onSelectTab('employees')}
                className={navItemClass('employees')}
                title="Employee Directory"
              >
                <span className="material-symbols-outlined text-lg">group</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Employees</span>}
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('departments')}
                className={navItemClass('departments')}
                title="Departments"
              >
                <span className="material-symbols-outlined text-lg">corporate_fare</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Departments</span>}
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('teams')}
                className={navItemClass('teams')}
                title="Teams"
              >
                <span className="material-symbols-outlined text-lg">diversity_3</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Teams</span>}
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('organization')}
                className={navItemClass('organization')}
                title="Org Chart"
              >
                <span className="material-symbols-outlined text-lg">account_tree</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Organization</span>}
              </button>
            </div>

            {/* Time & Attendance */}
            <div className="flex flex-col gap-space-2xs">
              {!collapsed && (
                <span className="px-space-sm font-label-xs text-label-xs uppercase tracking-wider text-secondary font-semibold">
                  Time & Attendance
                </span>
              )}
              <button
                type="button"
                onClick={() => onSelectTab('attendance')}
                className={navItemClass('attendance')}
                title="Attendance Operations & Punch Clock"
              >
                <span className="material-symbols-outlined text-lg">schedule</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Attendance</span>}
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('shifts')}
                className={navItemClass('shifts')}
                title="Shift Roster"
              >
                <span className="material-symbols-outlined text-lg">calendar_view_week</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Shifts</span>}
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('holidays')}
                className={navItemClass('holidays')}
                title="Gazetted Holidays"
              >
                <span className="material-symbols-outlined text-lg">event_available</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Holidays</span>}
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('overtime')}
                className={navItemClass('overtime')}
                title="Overtime Management"
              >
                <span className="material-symbols-outlined text-lg">more_time</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Overtime</span>}
              </button>
            </div>

            {/* Leave */}
            <div className="flex flex-col gap-space-2xs">
              {!collapsed && (
                <span className="px-space-sm font-label-xs text-label-xs uppercase tracking-wider text-secondary font-semibold">
                  Leave
                </span>
              )}
              <button
                type="button"
                onClick={() => onSelectTab('leave-requests')}
                className={navItemClass('leave-requests')}
                title="Leave Requests"
              >
                <span className="material-symbols-outlined text-lg">event_busy</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Leave Requests</span>}
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('leave-balances')}
                className={navItemClass('leave-balances')}
                title="Leave Balances"
              >
                <span className="material-symbols-outlined text-lg">balance</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Leave Balances</span>}
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('policies')}
                className={navItemClass('policies')}
                title="Leave Policies"
              >
                <span className="material-symbols-outlined text-lg">policy</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Policies</span>}
              </button>
            </div>

            {/* Payroll */}
            <div className="flex flex-col gap-space-2xs">
              {!collapsed && (
                <span className="px-space-sm font-label-xs text-label-xs uppercase tracking-wider text-secondary font-semibold">
                  Payroll
                </span>
              )}
              <button
                type="button"
                onClick={() => onSelectTab('payroll-overview')}
                className={navItemClass('payroll-overview')}
                title="Payroll Overview & Cycle Hub"
              >
                <span className="material-symbols-outlined text-lg">payments</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Payroll Overview</span>}
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('payroll-runs')}
                className={navItemClass('payroll-runs')}
                title="Payroll Runs & Exception Resolver"
              >
                <span className="material-symbols-outlined text-lg">run_circle</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Payroll Runs</span>}
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('payslips')}
                className={navItemClass('payslips')}
                title="Employee Payslips"
              >
                <span className="material-symbols-outlined text-lg">receipt_long</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Payslips</span>}
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('components')}
                className={navItemClass('components')}
                title="Salary Components"
              >
                <span className="material-symbols-outlined text-lg">pie_chart</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Components</span>}
              </button>
            </div>

            {/* Approvals */}
            <div className="flex flex-col gap-space-2xs">
              {!collapsed && (
                <span className="px-space-sm font-label-xs text-label-xs uppercase tracking-wider text-secondary font-semibold">
                  Approvals
                </span>
              )}
              <button
                type="button"
                onClick={() => onSelectTab('my-approvals')}
                className={
                  activeTab === 'my-approvals'
                    ? 'flex items-center justify-between px-space-sm py-space-xs transition-all bg-primary-container text-on-primary rounded font-semibold cursor-pointer shadow-xs'
                    : 'flex items-center justify-between px-space-sm py-space-xs rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all cursor-pointer'
                }
                title="My Approvals"
              >
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-lg">task_alt</span>
                  {!collapsed && <span className="font-body-sm text-body-sm text-left">My Approvals</span>}
                </div>
                {!collapsed && (
                  <span className="px-space-xs py-0.5 rounded font-label-xs text-label-xs bg-error-container text-on-error-container font-semibold">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('approval-history')}
                className={navItemClass('approval-history')}
                title="Approval History"
              >
                <span className="material-symbols-outlined text-lg">history</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Approval History</span>}
              </button>
            </div>

            {/* Reports */}
            <div className="flex flex-col gap-space-2xs">
              {!collapsed && (
                <span className="px-space-sm font-label-xs text-label-xs uppercase tracking-wider text-secondary font-semibold">
                  Reports
                </span>
              )}
              <button
                type="button"
                onClick={() => onSelectTab('reports-workforce')}
                className={navItemClass('reports-workforce')}
                title="Workforce Report"
              >
                <span className="material-symbols-outlined text-lg">monitoring</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Workforce</span>}
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('reports-attendance')}
                className={navItemClass('reports-attendance')}
                title="Attendance Report"
              >
                <span className="material-symbols-outlined text-lg">timelapse</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Attendance</span>}
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('reports-payroll')}
                className={navItemClass('reports-payroll')}
                title="Payroll Report"
              >
                <span className="material-symbols-outlined text-lg">account_balance</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Payroll</span>}
              </button>
            </div>

            {/* Administration */}
            <div className="flex flex-col gap-space-2xs">
              {!collapsed && (
                <span className="px-space-sm font-label-xs text-label-xs uppercase tracking-wider text-secondary font-semibold">
                  Administration
                </span>
              )}
              <button
                type="button"
                onClick={() => onSelectTab('users-and-roles')}
                className={navItemClass('users-and-roles')}
                title="Users & Roles"
              >
                <span className="material-symbols-outlined text-lg">manage_accounts</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Users & Roles</span>}
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('audit-logs')}
                className={navItemClass('audit-logs')}
                title="Audit Trail Logs"
              >
                <span className="material-symbols-outlined text-lg">fact_check</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Audit Logs</span>}
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('settings')}
                className={navItemClass('settings')}
                title="System Settings"
              >
                <span className="material-symbols-outlined text-lg">settings</span>
                {!collapsed && <span className="font-body-sm text-body-sm text-left">Settings</span>}
              </button>
            </div>
          </nav>
        </div>

        {/* Footer info & collapse button */}
        <div className="p-3 bg-surface-container-low flex flex-col gap-2 border-t border-surface-container flex-shrink-0">
          {!collapsed ? (
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-surface-container-lowest rounded-lg shadow-xs border border-slate-200/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-label-xs text-xs text-on-surface-variant font-medium">
                  Operational 99.98%
                </span>
              </div>
              <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
            </div>
          ) : (
            <div
              className="flex items-center justify-center py-1.5 bg-surface-container-lowest rounded-lg shadow-xs border border-slate-200/50 cursor-help"
              title="Operational 99.98%"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className={`hidden md:flex items-center ${collapsed ? 'justify-center' : 'justify-between'} w-full px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all cursor-pointer`}
            type="button"
            aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {!collapsed && <span className="font-label-sm text-xs font-medium">Collapse Sidebar</span>}
            <span className="material-symbols-outlined text-base">
              {collapsed ? 'last_page' : 'first_page'}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};
