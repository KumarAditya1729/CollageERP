import { useState, type ReactNode } from "react";
import { Check, ChevronRight, ChevronLeft, Sparkles, AlertCircle, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
  isValid?: boolean;
}

interface WizardFormProps {
  steps: WizardStep[];
  onComplete: () => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  completeLabel?: string;
  className?: string;
}

export function WizardForm({
  steps,
  onComplete,
  onCancel,
  isSubmitting = false,
  completeLabel = "Complete & Submit",
  className,
}: WizardFormProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  const currentStep = steps[currentIdx];
  const isLast = currentIdx === steps.length - 1;
  const isFirst = currentIdx === 0;

  const handleNext = () => {
    if (!isLast) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      void onComplete();
    }
  };

  const handleBack = () => {
    if (!isFirst) {
      setCurrentIdx((prev) => prev - 1);
    } else if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={cn("flex flex-col space-y-6", className)}>
      {/* Step Header Navigation */}
      <div className="rounded-[18px] border border-border bg-muted/40 p-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-2xs">
              <Layers className="size-3.5" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Step {currentIdx + 1} of {steps.length} — <span className="text-foreground font-semibold">{currentStep?.title}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {steps.map((s, idx) => {
              const isDone = idx < currentIdx;
              const isCur = idx === currentIdx;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => idx <= currentIdx && setCurrentIdx(idx)}
                  disabled={idx > currentIdx}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed",
                    isCur
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : isDone
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-background/50 text-muted-foreground opacity-60"
                  )}
                >
                  {isDone ? <Check className="size-3 stroke-[3]" /> : <span>{idx + 1}</span>}
                  <span className="hidden md:inline">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-3.5 h-1.5 w-full bg-muted overflow-hidden rounded-full">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${((currentIdx + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content Canvas */}
      <div className="min-h-[220px] rounded-[20px] border border-border bg-card p-6 shadow-xs transition-all duration-180">
        {currentStep?.description && (
          <div className="mb-5 pb-3 border-b border-border/60">
            <h3 className="text-sm font-bold text-foreground">{currentStep.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{currentStep.description}</p>
          </div>
        )}
        <div className="space-y-4">{currentStep?.content}</div>
      </div>

      {/* Footer Navigation Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-border/80">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={isSubmitting}
          className="h-10 px-5 rounded-[14px] text-xs font-semibold"
        >
          {isFirst ? "Cancel" : "← Previous Step"}
        </Button>

        <div className="flex items-center gap-3">
          {!isLast && (
            <span className="hidden sm:inline text-[11px] font-mono text-muted-foreground">
              Next up: {steps[currentIdx + 1]?.title}
            </span>
          )}
          <Button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting || (currentStep?.isValid === false)}
            className={cn(
              "h-10 px-6 rounded-[14px] text-xs font-bold shadow-md transition-all",
              isLast ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20" : "bg-primary text-primary-foreground shadow-primary/20"
            )}
          >
            {isSubmitting ? (
              <span>Processing…</span>
            ) : isLast ? (
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-3.5" />
                {completeLabel}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                Continue <ChevronRight className="size-3.5 ml-0.5" />
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
