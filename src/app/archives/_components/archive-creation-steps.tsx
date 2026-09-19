import { cn } from "@/utils/cn";

interface ArchiveCreationStepsProps {
  currentStep: 1 | 2;
}

const steps = ["기본 정보", "클립 구성"] as const;

export function ArchiveCreationSteps({ currentStep }: ArchiveCreationStepsProps) {
  return (
    <ol aria-label="아카이브 제작 단계" className="grid grid-cols-2 gap-3">
      {steps.map((label, index) => {
        const stepNumber = (index + 1) as 1 | 2;
        const isCurrent = stepNumber === currentStep;
        const isComplete = stepNumber < currentStep;

        return (
          <li
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex min-h-16 items-center gap-3 rounded-lg border px-4 py-3 text-body-sm",
              isCurrent && "border-brand bg-surface-selected font-semibold text-primary",
              isComplete && "border-default bg-surface-muted font-medium text-primary",
              stepNumber > currentStep && "border-default text-secondary",
            )}
            key={label}
          >
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border text-caption font-semibold",
                isCurrent && "border-brand bg-brand text-white",
                isComplete && "border-brand text-brand-text",
                stepNumber > currentStep && "border-default text-secondary",
              )}
            >
              {stepNumber}
            </span>
            <span>
              {label}
              {isComplete ? <span className="ml-1.5 text-caption text-secondary">완료</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
