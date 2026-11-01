import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-[#38302A] bg-[#12110F] px-3 py-2 text-sm text-[#F4F0EB] placeholder:text-[#7C756E] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F5A23A] focus-visible:border-[#F5A23A] disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
