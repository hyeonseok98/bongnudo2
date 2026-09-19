import { cn } from "@/utils/cn";

interface ArchiveCreationStepsProps {
  currentStep: 1 | 2;
}

const steps = ["기본 정보", "클립 구성"] as const;

export function ArchiveCreationSteps({ currentStep }: ArchiveCreationStepsProps) {
  return (
    <ol aria-label="아카이브 제작 단계" className="flex items-center">
      {steps.map((label, index) => {
        const stepNumber = (index + 1) as 1 | 2;
        const isCurrent = stepNumber === currentStep;
        const isComplete = stepNumber < currentStep;

        return (
          <li className="flex min-w-0 flex-1 items-center gap-3" key={label}>
            <div
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 text-body-sm font-medium",
                isCurrent && "text-primary",
                isComplete && "text-brand-text",
                stepNumber > currentStep && "text-secondary",
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border text-caption font-semibold",
                  isCurrent && "border-brand bg-brand text-white",
                  isComplete && "border-brand bg-surface-selected text-brand-text",
                  stepNumber > currentStep && "border-default text-secondary",
                )}
              >
                {stepNumber}
              </span>
              <span className="truncate">{label}</span>
            </div>
            {stepNumber < steps.length ? (
              <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-border" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
