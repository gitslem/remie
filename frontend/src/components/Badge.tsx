import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
}) => {
  const variantClasses = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
};

interface StatusBadgeProps {
  status:
    | 'PENDING'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED'
    | 'ACTIVE'
    | 'PAID'
    | 'INITIATED';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusConfig = {
    PENDING: { variant: 'warning' as const, label: 'Pending' },
    PROCESSING: { variant: 'info' as const, label: 'Processing' },
    COMPLETED: { variant: 'success' as const, label: 'Completed' },
    FAILED: { variant: 'error' as const, label: 'Failed' },
    CANCELLED: { variant: 'error' as const, label: 'Cancelled' },
    ACTIVE: { variant: 'success' as const, label: 'Active' },
    PAID: { variant: 'success' as const, label: 'Paid' },
    INITIATED: { variant: 'info' as const, label: 'Initiated' },
  };

  const config = statusConfig[status] || { variant: 'default' as const, label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};
