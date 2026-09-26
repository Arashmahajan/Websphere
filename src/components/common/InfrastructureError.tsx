import React from 'react';
import { Database, AlertCircle, RefreshCw, Terminal } from 'lucide-react';

interface InfrastructureErrorProps {
  title?: string;
  message?: string;
  retryText?: string;
  onRetry?: () => void;
}

export const InfrastructureError: React.FC<InfrastructureErrorProps> = ({
  title = 'Unable to Connect to WorkSphere Services',
  message = 'The application database is currently unavailable. Please start the local backend infrastructure.',
  retryText = 'Retry',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-error-container/20 border border-error/30 rounded-2xl max-w-xl mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-5 ring-8 ring-error/5">
        <Database className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error/15 text-error text-xs font-semibold mb-3">
        <AlertCircle className="w-3.5 h-3.5" />
        Infrastructure Offline
      </div>

      <h3 className="text-xl font-bold text-on-surface tracking-tight mb-2">
        {title}
      </h3>

      <p className="text-sm text-on-surface-variant max-w-md mb-6 leading-relaxed">
        {message}
      </p>

      <div className="w-full bg-surface-container-lowest/90 border border-outline-variant/60 rounded-xl p-4 mb-6 text-left font-mono text-xs text-on-surface-variant">
        <div className="flex items-center gap-2 text-on-surface font-semibold mb-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span>Local Development Commands:</span>
        </div>
        <div className="space-y-1 text-on-surface-variant">
          <div>$ docker compose up -d</div>
          <div>$ cd backend && ./mvnw spring-boot:run</div>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-on-primary bg-primary hover:bg-primary/90 rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          {retryText}
        </button>
      )}
    </div>
  );
};
