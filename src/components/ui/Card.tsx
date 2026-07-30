import React from 'react';
import { cn } from '../../utils/cn';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm', className)} {...props} />
  )
);
Card.displayName = 'Card';
