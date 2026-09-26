import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { AttendanceRecord, RegularizationRequest } from '../../types/index.ts';
import { attendanceApi } from '../../services/apiServices.ts';

interface AttendanceOperationsViewProps {
  records: AttendanceRecord[];
  regularizations: RegularizationRequest[];
  onOpenRegularizationModal: (name?: string, id?: string) => void;
  onRefresh: () => void;
}

export const AttendanceOperationsView: React.FC<AttendanceOperationsViewProps> = ({
  records,
  regularizations,
  onOpenRegularizationModal,
  onRefresh,
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'biometric' | 'heatmap'>('biometric');
  const [filterShift, setFilterShift] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [filterException, setFilterException] = useState('all');

  // Live timer simulation
  const [elapsedSeconds, setElapsedSeconds] = useState(16641); // 04:37:21
  const [onBreak, setOnBreak] = useState(false);
  const [remoteLogged, setRemoteLogged] = useState(false);
  const [punchedOut, setPunchedOut] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (punchedOut) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [punchedOut]);

  const hrs = String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0');
  const secs = String(elapsedSeconds % 60).padStart(2, '0');

  const handleToggleBreak = async () => {
    try {
      await attendanceApi.toggleBreak();
      setOnBreak(!onBreak);
      setToastMessage(!onBreak ? 'Break status commenced. Biometric session paused.' : 'Break concluded. Active duty clock resumed.');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to toggle break status.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handlePunchOut = async () => {
    try {
      await attendanceApi.punchOut();
      setPunchedOut(true);
      setToastMessage('Punch-out recorded at Gate 4. Daily attendance submitted for supervisor validation.');
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to record punch-out.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleLogRemote = () => {
    setRemoteLogged(true);
    setToastMessage('Remote Duty Gate confirmed: Home Office (BLR East). Security handshake refreshed.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleActionRegularization = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await attendanceApi.actionRegularization(id, action);
      setToastMessage(`Regularization request ${action === 'APPROVE' ? 'Approved' : 'Rejected'}.`);
      onRefresh();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to process regularization request.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Filter records
  const filteredRecords = records.filter((r) => {
    if (filterShift !== 'all' && !r.shiftName.includes(filterShift)) return false;
    if (filterDept !== 'all' && !r.department.includes(filterDept)) return false;
    if (filterException !== 'all') {
      if (filterException === 'Late' && r.status !== 'LATE') return false;
      if (filterException === 'Missing' && r.status !== 'MISSING_PUNCH') return false;
      if (filterException === 'Half' && r.status !== 'HALF_DAY') return false;
    }
    return true;
  });

  const pendingRegularizations = regularizations.filter((r) => r.status === 'PENDING');

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-200">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="mb-4 p-3 bg-tertiary text-on-tertiary rounded-lg shadow-md flex items-center justify-between font-body-sm text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">verified</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="cursor-pointer">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Operational Sub-Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-lg">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-sm mb-space-2xs">
            <span className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
              Time & Attendance Operations
            </span>
            <span className="inline-flex items-center gap-space-2xs px-space-xs py-0.5 rounded bg-surface-container text-on-surface-variant font-code-sm text-code-sm">
              <span className="w-2 h-2 rounded-full bg-tertiary-container animate-ping"></span>
              <span>IST (UTC +5:30)</span>
            </span>
          </div>
          <div className="flex items-center gap-space-xs text-secondary font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            <span className="font-medium text-on-surface-variant">Thursday, 18 September 2026</span>
            <span>•</span>
            <span>Corporate Headquarters & Global Campus Network</span>
          </div>
        </div>

        {/* Quick Tool Actions */}
        <div className="flex flex-wrap items-center gap-space-xs">
          <button
            onClick={() => {
              setToastMessage('Biometric Gate nodes status: All campus nodes synchronized.');
              setTimeout(() => setToastMessage(null), 4000);
            }}
            className="group flex items-center gap-space-xs h-9 px-space-sm bg-surface-container-low hover:bg-surface-container text-on-surface rounded font-label-sm text-label-sm shadow-sm transition-all border border-slate-200 cursor-pointer"
            type="button"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
            </span>
            <span className="material-symbols-outlined text-base text-secondary">fingerprint</span>
            <span>Gate Sync: Live (42 Nodes)</span>
          </button>
          <button
            onClick={() => onOpenRegularizationModal()}
            className="flex items-center gap-space-xs h-9 px-space-sm bg-surface-container hover:bg-surface-container-high text-on-surface rounded font-label-sm text-label-sm shadow-sm transition-all border border-slate-200 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-base text-primary">edit_calendar</span>
            <span>Request Regularization</span>
          </button>
          <button
            onClick={() => {
              setToastMessage('Attendance Pack exported (CSV / PDF Summary ready).');
              setTimeout(() => setToastMessage(null), 4000);
            }}
            className="flex items-center gap-space-xs h-9 px-space-sm bg-primary text-on-primary hover:bg-primary-container rounded font-label-sm text-label-sm shadow-md transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-base">file_download</span>
            <span>Export Attendance Pack</span>
          </button>
        </div>
      </div>

      {/* Operational Metrics Banner (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
        {/* Metric 1: On-duty rate */}
        <div className="relative overflow-hidden bg-surface-container-lowest p-space-base rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-xs text-label-xs uppercase tracking-wider text-secondary font-semibold">
                Today's Attendance
              </span>
              <div className="flex items-baseline gap-space-xs mt-space-2xs">
                <span className="font-display-lg text-display-lg font-bold text-on-surface tracking-tight">
                  9,412
                </span>
                <span className="font-body-sm text-body-sm text-secondary">/ 10,248</span>
              </div>
            </div>
            <div className="p-space-xs rounded-lg bg-surface-container-low text-primary">
              <span className="material-symbols-outlined text-2xl">how_to_reg</span>
            </div>
          </div>
          <div className="mt-space-md flex items-center justify-between font-body-xs text-body-xs">
            <div className="flex items-center gap-space-2xs text-tertiary font-semibold">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span>91.8% on-duty</span>
            </div>
            <span className="text-secondary font-code-sm text-code-sm">+1.4% vs yesterday</span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-space-xs overflow-hidden">
            <div className="bg-tertiary-container h-full rounded-full" style={{ width: '91.8%' }}></div>
          </div>
        </div>

        {/* Metric 2: Late Arrivals */}
        <div className="relative overflow-hidden bg-surface-container-lowest p-space-base rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-xs text-label-xs uppercase tracking-wider text-secondary font-semibold">
                Late Arrivals
              </span>
              <div className="flex items-baseline gap-space-xs mt-space-2xs">
                <span className="font-display-lg text-display-lg font-bold text-on-surface tracking-tight">
                  450
                </span>
                <span className="font-body-sm text-body-sm text-secondary">entries</span>
              </div>
            </div>
            <div className="p-space-xs rounded-lg bg-secondary-container text-on-secondary-container">
              <span className="material-symbols-outlined text-2xl">alarm_on</span>
            </div>
          </div>
          <div className="mt-space-md flex items-center justify-between font-body-xs text-body-xs">
            <div className="flex items-center gap-space-2xs text-secondary font-medium">
              <span className="material-symbols-outlined text-sm">timer</span>
              <span>Within 30m grace period</span>
            </div>
            <span className="px-space-2xs py-0.5 rounded bg-surface-container font-code-sm text-code-sm text-secondary">
              4.4%
            </span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-space-xs overflow-hidden">
            <div className="bg-secondary h-full rounded-full" style={{ width: '28%' }}></div>
          </div>
        </div>

        {/* Metric 3: Unplanned Absences */}
        <div className="relative overflow-hidden bg-surface-container-lowest p-space-base rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-xs text-label-xs uppercase tracking-wider text-secondary font-semibold">
                Unplanned / LOP
              </span>
              <div className="flex items-baseline gap-space-xs mt-space-2xs">
                <span className="font-display-lg text-display-lg font-bold text-error tracking-tight">
                  64
                </span>
                <span className="font-body-sm text-body-sm text-error/80">critical</span>
              </div>
            </div>
            <div className="p-space-xs rounded-lg bg-error-container text-on-error-container">
              <span className="material-symbols-outlined text-2xl">person_alert</span>
            </div>
          </div>
          <div className="mt-space-md flex items-center justify-between font-body-xs text-body-xs">
            <div className="flex items-center gap-space-2xs text-error font-medium">
              <span className="material-symbols-outlined text-sm">priority_high</span>
              <span>Requires manager review</span>
            </div>
            <span className="font-code-sm text-code-sm text-error font-semibold">Action req.</span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-space-xs overflow-hidden">
            <div className="bg-error h-full rounded-full" style={{ width: '14%' }}></div>
          </div>
        </div>

        {/* Metric 4: Overtime Accrued */}
        <div className="relative overflow-hidden bg-surface-container-lowest p-space-base rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-xs text-label-xs uppercase tracking-wider text-secondary font-semibold">
                Overtime Accrued
              </span>
              <div className="flex items-baseline gap-space-xs mt-space-2xs">
                <span className="font-display-lg text-display-lg font-bold text-on-surface tracking-tight">
                  1,842
                </span>
                <span className="font-body-sm text-body-sm text-secondary">hrs</span>
              </div>
            </div>
            <div className="p-space-xs rounded-lg bg-surface-container-high text-primary">
              <span className="material-symbols-outlined text-2xl">more_time</span>
            </div>
          </div>
          <div className="mt-space-md flex items-center justify-between font-body-xs text-body-xs">
            <div className="flex items-center gap-space-2xs text-secondary font-medium">
              <span className="material-symbols-outlined text-sm">timelapse</span>
              <span>Across all shifts this cycle</span>
            </div>
            <span className="font-code-sm text-code-sm text-tertiary font-semibold">Budget OK</span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-space-xs overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: '62%' }}></div>
          </div>
        </div>
      </div>

      {/* Active Punch In / User Duty Workspace Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-surface-container-lowest via-surface-container-low to-surface-container-lowest p-space-lg rounded-xl shadow-sm mb-space-lg border border-slate-200">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg relative z-10">
          {/* User Profile & Shift Info */}
          <div className="flex items-center gap-space-base">
            <div className="relative">
              <img
                alt={currentUser?.fullName || 'Vikram Malhotra'}
                className="w-16 h-16 rounded-full object-cover shadow-sm border border-surface-container"
                src={
                  currentUser?.avatarUrl ||
                  'https://lh3.googleusercontent.com/aida/AEtjO1XHqf_44drjKHy69uFGwId1FjRxHpWHmsGgYOwUzRGm05siNp7n26wG_b9WhOVWzx6_OL9l0igAAUiWlZOIg0hOiV039W_YxvQM1Bhsb_NUR90PUaQQJtJrUxVhLtaCra-vFGPlK9llH3gu6b4dhG-EQ6KYY7YZFp1sCBdRxPv6ITHxZ9flyzOf6ddsQslx5qupYf-U91_qoxmN3wE-hSy_4opkR5T6cFXOC1ZA8P4yGihqT-efUaiwQrE'
                }
              />
              <span
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full ring-2 ring-surface-container-lowest ${
                  punchedOut ? 'bg-secondary' : 'bg-tertiary'
                }`}
              ></span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {currentUser?.fullName || 'Vikram Malhotra'}
                </span>
                <span
                  className={`px-space-xs py-0.5 rounded font-label-xs text-label-xs uppercase tracking-wider font-bold ${
                    punchedOut
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-tertiary-fixed text-on-tertiary-fixed'
                  }`}
                >
                  {punchedOut ? 'Off Duty' : onBreak ? 'On Break' : 'On Duty'}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-secondary">
                {currentUser?.title || 'Chief People Officer'} • Employee ID:{' '}
                <span className="font-code-sm text-code-sm font-semibold text-on-surface">
                  {currentUser?.employeeId || 'EMP-00108'}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-space-md mt-space-2xs font-body-xs text-body-xs text-on-surface-variant">
                <span className="flex items-center gap-space-2xs">
                  <span className="material-symbols-outlined text-sm text-tertiary">check_circle</span>
                  Check-in: <strong className="text-on-surface">09:04 AM</strong> (Gate 4, BLR Campus)
                </span>
                <span className="flex items-center gap-space-2xs">
                  <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                  Shift: <strong className="text-on-surface">General Shift A</strong> (09:00 - 18:00)
                </span>
                {remoteLogged && (
                  <span className="flex items-center gap-space-2xs text-primary font-semibold">
                    <span className="material-symbols-outlined text-sm">home_work</span>
                    Remote Mode Active
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Live Clock & Radial Progress Indicator */}
          <div className="flex flex-wrap items-center gap-space-xl">
            <div className="flex items-center gap-space-md bg-surface-container-lowest/80 px-space-base py-space-sm rounded-xl shadow-xs border border-surface-container">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                  <circle
                    className="text-surface-container"
                    cx="32"
                    cy="32"
                    fill="none"
                    r="26"
                    stroke="currentColor"
                    strokeWidth="5"
                  ></circle>
                  <circle
                    className="text-primary transition-all duration-1000 ease-out"
                    cx="32"
                    cy="32"
                    fill="none"
                    r="26"
                    stroke="currentColor"
                    strokeDasharray="163.36"
                    strokeDashoffset="80.04"
                    strokeLinecap="round"
                    strokeWidth="5"
                  ></circle>
                </svg>
                <span className="absolute font-code-sm text-code-sm font-bold text-on-surface">51%</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-xs text-label-xs uppercase tracking-wider text-secondary font-semibold">
                  Active Shift Elapsed
                </span>
                <div className="flex items-baseline gap-space-2xs">
                  <span className="font-code-sm text-headline-sm font-bold text-on-surface tracking-tight">
                    {hrs}:{mins}:{secs}
                  </span>
                  <span className="font-code-sm text-body-xs text-secondary">/ 09:00:00</span>
                </div>
                <span className="font-body-xs text-body-xs text-tertiary">No compliance deviations logged</span>
              </div>
            </div>

            {/* Punch Actions */}
            <div className="flex items-center gap-space-xs">
              <button
                type="button"
                onClick={handleToggleBreak}
                disabled={punchedOut}
                className={`flex items-center gap-space-xs h-10 px-space-base rounded font-label-md text-label-md transition-all shadow-xs cursor-pointer disabled:opacity-40 ${
                  onBreak
                    ? 'bg-secondary-container text-on-secondary-container font-bold'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base text-secondary">free_breakfast</span>
                <span>{onBreak ? 'End Break' : 'Take Break'}</span>
              </button>
              <button
                type="button"
                onClick={handleLogRemote}
                disabled={punchedOut}
                className="flex items-center gap-space-xs h-10 px-space-base bg-surface-container hover:bg-surface-container-high text-on-surface rounded font-label-md text-label-md transition-all shadow-xs cursor-pointer disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-base text-secondary">laptop_chromebook</span>
                <span>Log Remote</span>
              </button>
              <button
                type="button"
                onClick={handlePunchOut}
                disabled={punchedOut}
                className="flex items-center gap-space-xs h-10 px-space-base bg-error text-on-error hover:bg-error/90 rounded font-label-md text-label-md transition-all shadow-sm cursor-pointer disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                <span>Punch Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Split Main View: 8 Cols Content + 4 Cols Queue & Roster */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
        {/* LEFT 8 COLUMNS: Biometric Feed & Monthly Calendar Heatmap */}
        <div className="xl:col-span-8 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-slate-200">
            {/* Tab Bar & Filter Controls Header */}
            <div className="px-space-base pt-space-base pb-space-xs flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-lowest">
              <div className="flex items-center gap-space-sm">
                <button
                  type="button"
                  onClick={() => setActiveTab('biometric')}
                  className={`px-space-sm py-space-xs rounded font-label-sm text-label-sm font-semibold transition-colors cursor-pointer ${
                    activeTab === 'biometric'
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  Biometric In/Out Feed
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('heatmap')}
                  className={`px-space-sm py-space-xs rounded font-label-sm text-label-sm font-semibold transition-colors cursor-pointer ${
                    activeTab === 'heatmap'
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  Monthly Department Heatmap
                </button>
              </div>

              {/* Quick Filters Group */}
              <div className="flex flex-wrap items-center gap-space-xs">
                <div className="relative">
                  <select
                    value={filterShift}
                    onChange={(e) => setFilterShift(e.target.value)}
                    className="h-8 pl-space-sm pr-7 rounded bg-surface-container-low font-body-xs text-body-xs text-on-surface focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Shifts</option>
                    <option value="Shift A">General Shift A</option>
                    <option value="Shift B">General Shift B</option>
                    <option value="Shift C">Mid Shift C</option>
                  </select>
                </div>
                <div className="relative">
                  <select
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="h-8 pl-space-sm pr-7 rounded bg-surface-container-low font-body-xs text-body-xs text-on-surface focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Departments</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Operations">Operations</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div className="relative">
                  <select
                    value={filterException}
                    onChange={(e) => setFilterException(e.target.value)}
                    className="h-8 pl-space-sm pr-7 rounded bg-surface-container-low font-body-xs text-body-xs text-on-surface focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Exception States</option>
                    <option value="Late">Late Arrival</option>
                    <option value="Half">Half-Day</option>
                    <option value="Missing">Missing Punch</option>
                  </select>
                </div>
              </div>
            </div>

            {/* View: Biometric Feed */}
            {activeTab === 'biometric' && (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/70 text-secondary font-label-xs text-label-xs uppercase tracking-wider">
                      <th className="py-space-sm px-space-base">Employee</th>
                      <th className="py-space-sm px-space-sm">Shift</th>
                      <th className="py-space-sm px-space-sm">First In</th>
                      <th className="py-space-sm px-space-sm">Last Out</th>
                      <th className="py-space-sm px-space-sm text-right">Duration</th>
                      <th className="py-space-sm px-space-sm">Status</th>
                      <th className="py-space-sm px-space-base text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-surface-container-low">
                    {filteredRecords.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-space-sm px-space-base">
                          <div className="flex items-center gap-space-sm">
                            {item.avatarUrl ? (
                              <img
                                className="w-8 h-8 rounded-full object-cover"
                                src={item.avatarUrl}
                                alt=""
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm flex items-center justify-center font-bold">
                                {item.employeeName
                                  .split(' ')
                                  .map((p) => p[0])
                                  .slice(0, 2)
                                  .join('')}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                                {item.employeeName}
                              </span>
                              <span className="font-code-sm text-code-sm text-secondary">
                                {item.employeeCode} • {item.department}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-space-sm px-space-sm text-secondary">{item.shiftName.split('(')[0]}</td>
                        <td className="py-space-sm px-space-sm font-code-sm text-code-sm font-medium text-on-surface">
                          {item.firstIn}
                        </td>
                        <td className="py-space-sm px-space-sm font-code-sm text-code-sm text-secondary">
                          {item.lastOut}
                        </td>
                        <td className="py-space-sm px-space-sm font-code-sm text-code-sm text-right font-medium">
                          {item.durationFormatted}
                        </td>
                        <td className="py-space-sm px-space-sm">
                          <span
                            className={`inline-flex items-center px-space-xs py-0.5 rounded font-label-xs text-label-xs font-semibold ${
                              item.status === 'PRESENT'
                                ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                                : item.status === 'LATE'
                                ? 'bg-error-container text-on-error-container font-bold'
                                : item.status === 'HALF_DAY'
                                ? 'bg-surface-container-high text-on-surface-variant'
                                : item.status === 'ON_LEAVE'
                                ? 'bg-secondary-container text-on-secondary-container'
                                : 'bg-error-container text-on-error-container font-bold'
                            }`}
                          >
                            {item.statusNote || item.status}
                          </span>
                        </td>
                        <td className="py-space-sm px-space-base text-right">
                          {item.status === 'LATE' || item.status === 'MISSING_PUNCH' ? (
                            <button
                              onClick={() => onOpenRegularizationModal(item.employeeName, item.employeeCode)}
                              className="px-space-xs py-1 rounded font-label-xs text-label-xs font-semibold bg-surface-container hover:bg-primary hover:text-on-primary transition-all cursor-pointer"
                              type="button"
                            >
                              Regularize
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setToastMessage(`Device Audit Log: Captured by Turnstile biometric node.`);
                                setTimeout(() => setToastMessage(null), 4000);
                              }}
                              className="p-1 rounded text-secondary hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                              title="View Device Audit Logs"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-base">receipt_long</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* View: Monthly Heatmap */}
            {activeTab === 'heatmap' && (
              <div className="p-space-base flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                      September 2026 Shift Fulfillment Heatmap
                    </span>
                    <span className="px-space-xs py-0.5 rounded bg-surface-container font-code-sm text-code-sm text-secondary">
                      Enterprise Aggregated
                    </span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="font-body-xs text-body-xs text-secondary">Intensity:</span>
                    <span className="w-3 h-3 rounded bg-surface-container" title="<80% Attendance"></span>
                    <span className="w-3 h-3 rounded bg-tertiary-fixed-dim" title="80-90%"></span>
                    <span className="w-3 h-3 rounded bg-tertiary-fixed" title="90-95%"></span>
                    <span className="w-3 h-3 rounded bg-tertiary-container" title=">95%"></span>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-space-xs bg-surface-container-low p-space-sm rounded-lg">
                  <span className="font-label-xs text-label-xs text-center font-bold text-secondary py-1">Mon</span>
                  <span className="font-label-xs text-label-xs text-center font-bold text-secondary py-1">Tue</span>
                  <span className="font-label-xs text-label-xs text-center font-bold text-secondary py-1">Wed</span>
                  <span className="font-label-xs text-label-xs text-center font-bold text-secondary py-1">Thu</span>
                  <span className="font-label-xs text-label-xs text-center font-bold text-secondary py-1">Fri</span>
                  <span className="font-label-xs text-label-xs text-center font-bold text-secondary py-1">Sat</span>
                  <span className="font-label-xs text-label-xs text-center font-bold text-secondary py-1">Sun</span>

                  <div className="h-14 p-1.5 rounded bg-tertiary-fixed flex flex-col justify-between">
                    <span className="font-code-sm text-code-sm font-semibold text-on-tertiary-fixed">01</span>
                    <span className="font-code-sm text-[10px] font-bold text-on-tertiary-fixed">94.2%</span>
                  </div>
                  <div className="h-14 p-1.5 rounded bg-tertiary-container text-white flex flex-col justify-between">
                    <span className="font-code-sm text-code-sm font-semibold">02</span>
                    <span className="font-code-sm text-[10px] font-bold">96.8%</span>
                  </div>
                  <div className="h-14 p-1.5 rounded bg-tertiary-fixed flex flex-col justify-between">
                    <span className="font-code-sm text-code-sm font-semibold text-on-tertiary-fixed">03</span>
                    <span className="font-code-sm text-[10px] font-bold text-on-tertiary-fixed">93.1%</span>
                  </div>
                  <div className="h-14 p-1.5 rounded bg-tertiary-fixed-dim flex flex-col justify-between">
                    <span className="font-code-sm text-code-sm font-semibold text-on-surface">04</span>
                    <span className="font-code-sm text-[10px] font-bold text-on-surface">89.4%</span>
                  </div>
                  <div className="h-14 p-1.5 rounded bg-surface-container flex flex-col justify-between">
                    <span className="font-code-sm text-code-sm text-secondary">05</span>
                    <span className="font-code-sm text-[10px] text-secondary">W-OFF</span>
                  </div>
                  <div className="h-14 p-1.5 rounded bg-surface-container flex flex-col justify-between">
                    <span className="font-code-sm text-code-sm text-secondary">06</span>
                    <span className="font-code-sm text-[10px] text-secondary">W-OFF</span>
                  </div>
                  <div className="h-14 p-1.5 rounded bg-tertiary-fixed flex flex-col justify-between">
                    <span className="font-code-sm text-code-sm font-semibold text-on-tertiary-fixed">07</span>
                    <span className="font-code-sm text-[10px] font-bold text-on-tertiary-fixed">92.0%</span>
                  </div>

                  <div className="h-14 p-1.5 rounded bg-tertiary-container text-white flex flex-col justify-between">
                    <span className="font-code-sm text-code-sm font-semibold">08</span>
                    <span className="font-code-sm text-[10px] font-bold">95.9%</span>
                  </div>
                  <div className="h-14 p-1.5 rounded bg-tertiary-container text-white flex flex-col justify-between">
                    <span className="font-code-sm text-code-sm font-semibold">09</span>
                    <span className="font-code-sm text-[10px] font-bold">96.1%</span>
                  </div>
                  <div className="h-14 p-1.5 rounded bg-tertiary-fixed flex flex-col justify-between">
                    <span className="font-code-sm text-code-sm font-semibold text-on-tertiary-fixed">10</span>
                    <span className="font-code-sm text-[10px] font-bold text-on-tertiary-fixed">94.0%</span>
                  </div>
                  <div className="h-14 p-1.5 rounded bg-tertiary-fixed-dim flex flex-col justify-between">
                    <span className="font-code-sm text-code-sm font-semibold text-on-surface">11</span>
                    <span className="font-code-sm text-[10px] font-bold text-on-surface">88.5%</span>
                  </div>
                  <div className="h-14 p-1.5 rounded bg-surface-container flex flex-col justify-between">
                    <span className="font-code-sm text-code-sm text-secondary">12</span>
                    <span className="font-code-sm text-[10px] text-secondary">W-OFF</span>
                  </div>
                  <div className="h-14 p-1.5 rounded bg-surface-container flex flex-col justify-between">
                    <span className="font-code-sm text-code-sm text-secondary">13</span>
                    <span className="font-code-sm text-[10px] text-secondary">W-OFF</span>
                  </div>
                  <div className="h-14 p-1.5 rounded bg-tertiary-fixed flex flex-col justify-between">
                    <span className="font-code-sm text-code-sm font-semibold text-on-tertiary-fixed">14</span>
                    <span className="font-code-sm text-[10px] font-bold text-on-tertiary-fixed">93.4%</span>
                  </div>

                  <div className="h-14 p-1.5 rounded bg-tertiary-container text-white flex flex-col justify-between">
                    <span className="font-code-sm text-code-sm font-semibold">15</span>
                    <span className="font-code-sm text-[10px] font-bold">97.2%</span>
                  </div>
                  <div className="h-14 p-1.5 rounded bg-tertiary-container text-white flex flex-col justify-between">
                    <span className="font-code-sm text-code-sm font-semibold">16</span>
                    <span className="font-code-sm text-[10px] font-bold">95.4%</span>
                  </div>
                  <div className="h-14 p-1.5 rounded bg-tertiary-fixed flex flex-col justify-between">
                    <span className="font-code-sm text-code-sm font-semibold text-on-tertiary-fixed">17</span>
                    <span className="font-code-sm text-[10px] font-bold text-on-tertiary-fixed">92.9%</span>
                  </div>
                  <div className="h-14 p-1.5 rounded bg-primary text-white shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="font-code-sm text-code-sm font-bold">18</span>
                      <span className="w-2 h-2 rounded-full bg-tertiary-fixed"></span>
                    </div>
                    <span className="font-code-sm text-[10px] font-bold">91.8% Today</span>
                  </div>
                  <div className="h-14 p-1.5 rounded bg-surface-container flex flex-col justify-between opacity-50">
                    <span className="font-code-sm text-code-sm text-secondary">19</span>
                    <span className="font-code-sm text-[10px] text-secondary">Pending</span>
                  </div>
                  <div className="h-14 p-1.5 rounded bg-surface-container flex flex-col justify-between opacity-50">
                    <span className="font-code-sm text-code-sm text-secondary">20</span>
                    <span className="font-code-sm text-[10px] text-secondary">W-OFF</span>
                  </div>
                  <div className="h-14 p-1.5 rounded bg-surface-container flex flex-col justify-between opacity-50">
                    <span className="font-code-sm text-code-sm text-secondary">21</span>
                    <span className="font-code-sm text-[10px] text-secondary">Pending</span>
                  </div>
                </div>
              </div>
            )}

            {/* Table Footer */}
            <div className="px-space-base py-space-sm bg-surface-container-lowest flex items-center justify-between font-body-sm text-body-sm text-secondary border-t border-surface-container-low">
              <span>
                Showing <strong className="text-on-surface">{filteredRecords.length}</strong> of{' '}
                <strong className="text-on-surface">10,248</strong> employee records
              </span>
              <div className="flex items-center gap-space-xs">
                <button
                  disabled
                  className="px-space-sm py-1 rounded bg-surface-container text-on-surface font-label-xs text-label-xs disabled:opacity-50"
                  type="button"
                >
                  Previous
                </button>
                <span className="font-code-sm text-code-sm px-space-xs text-on-surface font-semibold">1</span>
                <button
                  className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-xs text-label-xs cursor-pointer"
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 4 COLUMNS: Regularization Queue & Shift Roster */}
        <div className="xl:col-span-4 flex flex-col gap-space-lg">
          {/* Shift Roster Composition Card */}
          <div className="bg-surface-container-lowest p-space-base rounded-xl shadow-sm flex flex-col gap-space-md border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Shift Roster Composition
                </span>
                <span className="font-body-xs text-body-xs text-secondary">Active cycle staffing quota</span>
              </div>
              <button
                className="p-1 rounded text-secondary hover:text-on-surface hover:bg-surface-container cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">tune</span>
              </button>
            </div>

            <div className="w-full flex h-3 rounded-full overflow-hidden bg-surface-container">
              <div className="bg-primary h-full transition-all" style={{ width: '72%' }} title="General Shift (72%)"></div>
              <div className="bg-primary-fixed-dim h-full transition-all" style={{ width: '18%' }} title="Mid Shift (18%)"></div>
              <div className="bg-tertiary-container h-full transition-all" style={{ width: '10%' }} title="Night Shift (10%)"></div>
            </div>

            <div className="flex flex-col gap-space-xs font-body-sm text-body-sm">
              <div className="flex items-center justify-between p-space-xs rounded hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-space-xs">
                  <span className="w-3 h-3 rounded-sm bg-primary"></span>
                  <span className="font-medium text-on-surface">General Shift (09:00 - 18:00)</span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="font-code-sm text-code-sm font-semibold text-on-surface">7,378</span>
                  <span className="font-code-sm text-code-sm text-secondary">(72%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-space-xs rounded hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-space-xs">
                  <span className="w-3 h-3 rounded-sm bg-primary-fixed-dim"></span>
                  <span className="font-medium text-on-surface">Mid Shift (13:00 - 22:00)</span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="font-code-sm text-code-sm font-semibold text-on-surface">1,845</span>
                  <span className="font-code-sm text-code-sm text-secondary">(18%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-space-xs rounded hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-space-xs">
                  <span className="w-3 h-3 rounded-sm bg-tertiary-container"></span>
                  <span className="font-medium text-on-surface">Night Shift (21:00 - 06:00)</span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="font-code-sm text-code-sm font-semibold text-on-surface">1,025</span>
                  <span className="font-code-sm text-code-sm text-secondary">(10%)</span>
                </div>
              </div>
            </div>

            {/* On-Duty Supervisors */}
            <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-xs">
              <span className="font-label-xs text-label-xs uppercase tracking-wider text-secondary font-semibold">
                On-Duty Shift Supervisors
              </span>
              <div className="flex items-center justify-between text-body-xs font-body-xs pt-1">
                <div className="flex items-center gap-space-2xs">
                  <span className="material-symbols-outlined text-sm text-tertiary">support_agent</span>
                  <span className="font-medium text-on-surface">Pooja Nair (Floor 3)</span>
                </div>
                <span className="font-code-sm text-code-sm text-primary font-medium">Ext. 4091</span>
              </div>
              <div className="flex items-center justify-between text-body-xs font-body-xs">
                <div className="flex items-center gap-space-2xs">
                  <span className="material-symbols-outlined text-sm text-tertiary">support_agent</span>
                  <span className="font-medium text-on-surface">Karthik Menon (Security Control)</span>
                </div>
                <span className="font-code-sm text-code-sm text-primary font-medium">Ext. 8812</span>
              </div>
            </div>

            {/* Upcoming Gazetted Holiday */}
            <div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-secondary-container/40">
              <span className="material-symbols-outlined text-xl text-on-secondary-container">celebration</span>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                  Upcoming Gazetted Holiday
                </span>
                <span className="font-body-xs text-body-xs text-secondary">
                  Gandhi Jayanti • Friday, Oct 02, 2026 (Comp Off Applied)
                </span>
              </div>
            </div>
          </div>

          {/* Pending Regularization Requests Queue */}
          <div className="bg-surface-container-lowest p-space-base rounded-xl shadow-sm flex flex-col gap-space-md border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Regularization Queue
                </span>
                <span className="px-space-xs py-0.5 rounded font-label-xs text-label-xs font-bold bg-error-container text-on-error-container">
                  {pendingRegularizations.length} Pending
                </span>
              </div>
              <button
                type="button"
                onClick={() => onOpenRegularizationModal()}
                className="font-label-xs text-label-xs text-primary hover:underline font-semibold cursor-pointer"
              >
                + New Request
              </button>
            </div>

            <div className="flex flex-col gap-space-sm">
              {pendingRegularizations.map((item) => (
                <div
                  key={item.id}
                  className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-xs transition-all hover:shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                        {item.employeeName}
                      </span>
                      <span className="font-code-sm text-code-sm text-secondary">{item.requestId}</span>
                    </div>
                    <span className="font-code-sm text-code-sm text-secondary">{item.createdAt}</span>
                  </div>
                  <p className="font-body-xs text-body-xs text-on-surface-variant bg-surface-container-lowest p-space-xs rounded">
                    <strong className="text-on-surface">Reason:</strong> {item.reason}
                  </p>
                  <div className="flex items-center justify-between pt-space-2xs">
                    <span className="font-code-sm text-code-sm text-secondary">
                      Shift: {item.shiftSchedule}
                    </span>
                    <div className="flex items-center gap-space-xs">
                      <button
                        type="button"
                        onClick={() => handleActionRegularization(item.id, 'REJECT')}
                        className="px-space-xs py-1 rounded font-label-xs text-label-xs text-error hover:bg-error-container transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleActionRegularization(item.id, 'APPROVE')}
                        className="px-space-sm py-1 rounded font-label-xs text-label-xs font-semibold bg-tertiary text-on-tertiary hover:bg-tertiary-container transition-colors cursor-pointer"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {pendingRegularizations.length === 0 && (
                <div className="text-center py-space-base font-body-sm text-body-sm text-secondary">
                  <span className="material-symbols-outlined text-3xl text-tertiary mb-1">done_all</span>
                  <p>All pending regularizations have been audited!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
