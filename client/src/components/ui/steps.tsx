import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const stepsVariants = cva(
  "flex items-center w-full",
  {
    variants: {
      variant: {
        default: "",
        vertical: "flex-col space-y-4",
      },
      size: {
        default: "space-x-4",
        sm: "space-x-2",
        lg: "space-x-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface StepsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stepsVariants> {
  currentStep: number;
}

const Steps = React.forwardRef<HTMLDivElement, StepsProps>(
  ({ className, variant, size, currentStep, children, ...props }, ref) => {
    // Convert children to array and filter out non-Step components
    const steps = React.Children.toArray(children).filter(
      (child) => React.isValidElement(child) && child.type === Step
    ) as React.ReactElement[];
    
    return (
      <div
        ref={ref}
        className={cn(stepsVariants({ variant, size, className }))}
        {...props}
      >
        {steps.map((step, index) => {
          // Clone step with additional props
          return React.cloneElement(step, {
            stepIndex: index,
            isActive: index === currentStep,
            isCompleted: index < currentStep,
            isLast: index === steps.length - 1,
            ...step.props,
          });
        })}
      </div>
    );
  }
);
Steps.displayName = "Steps";

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  stepIndex?: number;
  isActive?: boolean;
  isCompleted?: boolean;
  isLast?: boolean;
}

const Step = React.forwardRef<HTMLDivElement, StepProps>(
  ({ className, title, description, icon, stepIndex, isActive, isCompleted, isLast, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center space-x-2 relative",
          isLast ? "flex-1" : "flex-1 after:absolute after:top-1/2 after:-translate-y-1/2 after:h-[2px] after:w-full after:max-w-[calc(100%-3rem)] after:ml-10 after:bg-muted-foreground/20",
          isActive && "after:bg-primary/50",
          isCompleted && "after:bg-primary",
          className
        )}
        {...props}
      >
        <div className="flex flex-col items-center z-10">
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-foreground border-2 border-muted-foreground/20 bg-background",
              isActive && "border-primary bg-primary/10 text-primary",
              isCompleted && "bg-primary border-primary text-primary-foreground"
            )}
          >
            {isCompleted ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
            ) : icon ? (
              icon
            ) : (
              <span>{stepIndex !== undefined ? stepIndex + 1 : ""}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col">
          <span
            className={cn(
              "font-medium",
              isActive && "text-primary",
              isCompleted && "text-primary"
            )}
          >
            {title}
          </span>
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      </div>
    );
  }
);
Step.displayName = "Step";

export { Steps, Step };
