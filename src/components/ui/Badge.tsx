import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-[0.125px] transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border border-blue-500/40 bg-blue-500/15 text-blue-300',
        secondary:
          'border border-[#38302A] bg-[#27211B] text-[#AAA29A]',
        destructive:
          'border border-[#E53946]/50 bg-[#E53946]/20 text-[#ff727f]',
        warning:
          'border border-[#F5A23A]/50 bg-[#F5A23A]/20 text-[#F5A23A]',
        success:
          'border border-[#16B58A]/50 bg-[#16B58A]/20 text-[#16B58A]',
        outline: 'text-[#AAA29A] border-[#38302A] bg-[#12110F]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  className?: string;
  children?: React.ReactNode;
}

function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
