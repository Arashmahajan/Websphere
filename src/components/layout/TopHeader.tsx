import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { NotificationItem } from '../../types/index.ts';
import { notificationApi } from '../../services/apiServices.ts';

interface TopHeaderProps {
  collapsed: boolean;
  activeModuleName?: string;
  onOpenQuickAction: () => void;
  onSearchClick?: () => void;
  onOpenMobileMenu?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  collapsed,
  activeModuleName = 'Enterprise Workspace',
  onOpenQuickAction,
  onOpenMobileMenu,
}) => {
  const { currentUser, availableUsers, switchUser, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notificationApi.getNotifications().then((res) => {
      setNotifications(res.notifications);
    }).catch(console.error);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDrawerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      const res = await notificationApi.markAllRead();
      setNotifications(res.notifications);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header
      id="top-header"
      className="sticky top-0 z-20 h-16 w-full bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-slate-200"
    >
      {/* Left: Mobile Toggle, Breadcrumbs & Search */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 mr-3">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-1.5 -ml-1 rounded-lg text-secondary hover:bg-surface-container hover:text-on-surface cursor-pointer flex items-center justify-center flex-shrink-0"
            aria-label="Open navigation sidebar"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 text-secondary min-w-0 flex-shrink-0">
          <span className="material-symbols-outlined text-base flex-shrink-0 text-slate-500">home</span>
          <span className="material-symbols-outlined text-sm flex-shrink-0 text-slate-400">chevron_right</span>
          <span className="font-body-sm text-body-sm font-semibold text-on-surface truncate max-w-[130px] sm:max-w-[190px] md:max-w-xs">
            {activeModuleName}
          </span>
        </div>

        {/* Global Search Bar */}
        <div className="relative hidden md:flex items-center min-w-0 flex-1 max-w-xs lg:max-w-md">
          <span className="material-symbols-outlined absolute left-3 text-secondary text-base pointer-events-none">
            search
          </span>
          <input
            className="w-full h-9 pl-9 pr-14 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary shadow-inner border border-slate-200/60"
            placeholder="Search employees, records, actions..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <kbd className="absolute right-2 px-1.5 py-0.5 rounded bg-surface-container font-code-sm text-xs text-secondary pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Actions, Notifications & Profile with Role Switcher */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Quick Action & Org Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onOpenQuickAction}
            className="flex items-center gap-1.5 h-9 px-3 bg-primary text-on-primary rounded-lg font-label-sm text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs cursor-pointer flex-shrink-0"
            type="button"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span className="hidden sm:inline">Quick Action</span>
          </button>
          <div className="relative hidden lg:block">
            <button
              className="flex items-center gap-1.5 h-9 px-3 bg-surface-container-low text-on-surface rounded-lg font-label-sm text-xs font-medium hover:bg-surface-container transition-colors cursor-pointer border border-slate-200/60"
              type="button"
            >
              <span className="material-symbols-outlined text-base text-secondary">apartment</span>
              <span>Acme Enterprise</span>
              <span className="material-symbols-outlined text-base text-secondary">arrow_drop_down</span>
            </button>
          </div>
        </div>

        <div className="h-6 w-px bg-surface-variant hidden sm:block"></div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifDrawerOpen(!notifDrawerOpen)}
            className="relative p-2 rounded-lg text-secondary hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer flex items-center justify-center"
            type="button"
            aria-label="Notifications"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-error text-on-error font-label-xs text-[10px] flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifDrawerOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container-high py-space-sm z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-space-md py-space-xs flex items-center justify-between border-b border-surface-container-low">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-sm text-label-sm font-bold text-on-surface">Notifications</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-error-container text-on-error-container font-code-sm text-xs font-bold">
                    {unreadCount} new
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-surface-container-low">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-space-sm hover:bg-surface-container-low transition-colors flex gap-space-xs ${
                      !n.read ? 'bg-surface-container-low/40' : ''
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-base mt-0.5 ${
                        n.priority === 'CRITICAL' ? 'text-error' : 'text-primary'
                      }`}
                    >
                      {n.priority === 'CRITICAL' ? 'warning' : 'info'}
                    </span>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-label-xs text-label-xs font-semibold text-on-surface">
                          {n.title}
                        </span>
                        <span className="font-code-sm text-[10px] text-secondary">{n.createdAt}</span>
                      </div>
                      <p className="font-body-xs text-body-xs text-secondary mt-0.5">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          className="p-space-xs rounded text-secondary hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          type="button"
          title="Enterprise Help & Docs"
          onClick={() => alert('WorkSphere Documentation & API specs available in README.')}
        >
          <span className="material-symbols-outlined text-xl">help_outline</span>
        </button>

        <div className="h-6 w-px bg-surface-variant"></div>

        {/* User Profile & Demo Role Switcher */}
        <div className="relative" ref={profileRef}>
          <div
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-space-sm pl-space-xs cursor-pointer select-none py-1 px-2 rounded-lg hover:bg-surface-container-low transition-colors"
          >
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover shadow-xs border border-surface-container"
              src={
                currentUser?.avatarUrl ||
                'https://lh3.googleusercontent.com/aida/AEtjO1XHqf_44drjKHy69uFGwId1FjRxHpWHmsGgYOwUzRGm05siNp7n26wG_b9WhOVWzx6_OL9l0igAAUiWlZOIg0hOiV039W_YxvQM1Bhsb_NUR90PUaQQJtJrUxVhLtaCra-vFGPlK9llH3gu6b4dhG-EQ6KYY7YZFp1sCBdRxPv6ITHxZ9flyzOf6ddsQslx5qupYf-U91_qoxmN3wE-hSy_4opkR5T6cFXOC1ZA8P4yGihqT-efUaiwQrE'
              }
            />
            <div className="flex flex-col text-left">
              <span className="font-label-sm text-label-sm text-on-surface font-semibold leading-tight">
                {currentUser?.fullName || 'Vikram Malhotra'}
              </span>
              <span className="font-label-xs text-label-xs text-on-surface-variant leading-tight truncate max-w-[140px]">
                {currentUser?.title || 'CPO & Enterprise Admin'}
              </span>
            </div>
            <span className="material-symbols-outlined text-secondary text-base">expand_more</span>
          </div>

          {/* User & Role Switcher Popover */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container-high py-space-sm z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-space-md py-space-xs border-b border-surface-container-low">
                <span className="font-label-xs text-label-xs uppercase font-bold text-secondary tracking-wider">
                  Active Persona & RBAC Role
                </span>
                <p className="font-body-xs text-body-xs text-secondary mt-0.5">
                  Logged in as <strong className="text-on-surface">{currentUser?.email}</strong> ({currentUser?.role})
                </p>
              </div>

              {/* Fast Demo Role Switcher */}
              <div className="p-space-xs">
                <span className="px-space-sm font-label-xs text-[10px] uppercase font-bold text-secondary">
                  Switch Demo Persona (MVP Requirement)
                </span>
                <div className="mt-1 flex flex-col gap-1">
                  {availableUsers.map((user) => (
                    <button
                      key={user.email}
                      onClick={() => {
                        switchUser(user.email);
                        setProfileDropdownOpen(false);
                      }}
                      className={`flex items-center gap-space-sm px-space-sm py-1.5 rounded text-left transition-colors cursor-pointer ${
                        currentUser?.email === user.email
                          ? 'bg-primary-container/15 text-primary font-bold'
                          : 'hover:bg-surface-container-low text-on-surface'
                      }`}
                    >
                      <img
                        src={user.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5e-MuIzZAnpeh_asU-cbtoW4z6moi-NBbVuQJV2jjykGHArndLm3OoA7jgK_S6vno1sC1Mt5YGAcQh__jCJsaz4HjLRC4d7emKQMpm8FgfLilnAE_-HXXEfbpR1xnc1Jx3aWK6s6NHv-WuomH3qAStCo4i7T69xfVd08lZhex3LWzARiYsb9uqtBCRej5UXBN_--okZRLMYuwNhWDHk_MAPOX1IZpYxNRrTeVScsxIbHR3t48hQog'}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-sm text-label-sm truncate">{user.fullName}</span>
                        <span className="font-code-sm text-[10px] text-secondary truncate">
                          {user.role} · {user.email}
                        </span>
                      </div>
                      {currentUser?.email === user.email && (
                        <span className="material-symbols-outlined text-sm ml-auto text-primary">check</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-surface-container-low mt-space-xs pt-space-xs px-space-sm flex flex-col gap-1.5">
                <div className="text-secondary font-label-xs text-xs px-space-xs py-1 flex items-center justify-between">
                  <span>Active Permissions:</span>
                  <strong className="text-on-surface">{currentUser?.permissions.length}</strong>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setProfileDropdownOpen(false);
                  }}
                  className="flex items-center gap-space-xs w-full px-space-sm py-2 rounded text-left text-xs font-semibold text-error hover:bg-error-container/40 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
