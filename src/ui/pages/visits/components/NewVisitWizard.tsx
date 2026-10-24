import { ChevronRight } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { Stepper } from '@/ui/design-system/components/Stepper'

export interface NewVisitWizardProps {
  isOpen?: boolean
  onClose: () => void
  onSave: () => void
}

export function NewVisitWizard({
  isOpen = true,
  onClose,
  onSave,
}: NewVisitWizardProps) {
  if (!isOpen) return null

  const steps = [
    { number: 1, label: 'Client' },
    { number: 2, label: 'Products' },
    { number: 3, label: 'Samples' },
    { number: 4, label: 'Notes' },
    { number: 5, label: 'Saved' },
  ]

  return (
    <Drawer title="New visit" kicker="STEP 1 OF 5" onClose={onClose}>
      <Stepper steps={steps} currentStep={1} />
      <label className="block-label">
        Choose a client
        <select defaultValue="Dr. Sarah Kim">
          <option>Dr. Sarah Kim</option>
          <option>Green Cross Pharmacy</option>
        </select>
      </label>
      <Button
        variant="primary"
        className="full-button"
        onClick={() => {
          onClose()
          onSave()
        }}
      >
        Continue <ChevronRight data-icon="inline-end" />
      </Button>
    </Drawer>
  )
}
