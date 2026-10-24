export interface StepItem {
  number: number
  label: string
}

export interface StepperProps {
  steps: StepItem[]
  currentStep?: number
  className?: string
  onStepClick?: (step: number) => void
}

export function Stepper({
  steps,
  currentStep = 1,
  className = '',
  onStepClick,
}: StepperProps) {
  return (
    <div className={`visit-steps ${className}`}>
      {steps.map((step) => {
        const isActive = step.number === currentStep
        const isCompleted = step.number < currentStep
        return (
          <div
            key={step.number}
            className={`${isActive ? 'step-active' : ''} ${isCompleted ? 'step-completed' : ''}`}
            onClick={() => {
              if (isCompleted && onStepClick) {
                onStepClick(step.number)
              }
            }}
            style={{
              cursor: isCompleted && onStepClick ? 'pointer' : 'default',
              userSelect: 'none',
            }}
            title={isCompleted ? `Go back to step ${step.number}: ${step.label}` : undefined}
          >
            {step.number}
            <span>{step.label}</span>
          </div>
        )
      })}
    </div>
  )
}
