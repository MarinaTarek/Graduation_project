export interface StepItem {
  number: number
  label: string
}

export interface StepperProps {
  steps: StepItem[]
  currentStep?: number
  className?: string
}

export function Stepper({
  steps,
  currentStep = 1,
  className = '',
}: StepperProps) {
  return (
    <div className={`visit-steps ${className}`}>
      {steps.map((step) => {
        const isActive = step.number === currentStep
        return (
          <div key={step.number} className={isActive ? 'step-active' : ''}>
            {step.number}
            <span>{step.label}</span>
          </div>
        )
      })}
    </div>
  )
}
