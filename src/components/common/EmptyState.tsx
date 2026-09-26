import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'outline';
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  badge?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  badge,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-surface-container-lowest/80 border border-outline-variant/40 rounded-2xl shadow-xs ${className}`}
    >
      <div className="relative mb-5 flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-container-high/80 text-primary ring-8 ring-surface-container-low/50">
        <Icon className="w-8 h-8" />
        {badge && (
          <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-primary text-on-primary rounded-full shadow-xs">
            {badge}
          </span>
        )}
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-on-surface tracking-tight mb-2">
        {title}
      </h3>

      <p className="max-w-md text-sm text-on-surface-variant/80 mb-6 leading-relaxed">
        {description}
      </p>

      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-on-surface bg-surface-container-high/70 hover:bg-surface-container-highest border border-outline-variant/60 rounded-xl transition-all active:scale-[0.98]"
            >
              {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4" />}
              {secondaryAction.label}
            </button>
          )}

          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-on-primary bg-primary hover:bg-primary/90 rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />}
              {primaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
