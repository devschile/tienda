import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const ToastProvider = ToastPrimitives.Provider;

// Posición: esquina inferior derecha
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn('fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm', className)}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  [
    // Base
    'group pointer-events-auto relative flex w-full items-start gap-3',
    'overflow-hidden rounded-xl border shadow-lg',
    'pl-4 pr-10 py-4',
    // Swipe to dismiss
    'data-[swipe=cancel]:translate-x-0',
    'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
    'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
    // Animations
    'transition-all duration-300',
    'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4 data-[state=open]:fade-in-0',
    'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-4 data-[state=closed]:fade-out-0',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'bg-white border-brand-secondary/15',
          // Barra de acento izquierda
          'before:absolute before:left-0 before:top-0 before:h-full before:w-1',
          'before:bg-gradient-to-b before:from-brand-primary before:to-brand-secondary',
          'before:rounded-l-xl',
        ].join(' '),
        destructive: [
          'bg-red-50 border-red-200',
          'before:absolute before:left-0 before:top-0 before:h-full before:w-1',
          'before:bg-red-500 before:rounded-l-xl',
        ].join(' '),
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
));
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-7 shrink-0 items-center justify-center rounded-lg border border-brand-secondary/20 bg-transparent px-3 text-xs font-medium transition-colors hover:bg-brand-surface focus:outline-none disabled:pointer-events-none disabled:opacity-50',
      'group-[.destructive]:border-red-300 group-[.destructive]:hover:bg-red-100',
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-md p-1',
      'text-devs-muted/50 opacity-0 transition-opacity',
      'hover:text-devs-text focus:opacity-100 focus:outline-none',
      'group-hover:opacity-100',
      'group-[.destructive]:text-red-400 group-[.destructive]:hover:text-red-600',
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3.5 w-3.5" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn(
      'font-mono text-sm font-bold leading-snug text-devs-text',
      'group-[.destructive]:text-red-700',
      className,
    )}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn(
      'text-xs text-devs-muted leading-relaxed mt-0.5',
      'group-[.destructive]:text-red-600',
      className,
    )}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
