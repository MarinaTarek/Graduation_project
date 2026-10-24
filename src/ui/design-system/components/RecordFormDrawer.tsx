import { Check, X } from 'lucide-react'
import { Button } from './Button'

export interface RecordFormDrawerProps {
  title: string
  isOpen?: boolean
  onClose: () => void
  onSave: () => void
}

export function RecordFormDrawer({
  title,
  isOpen = true,
  onClose,
  onSave,
}: RecordFormDrawerProps) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <aside className="side-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <span className="eyebrow">NEW RECORD</span>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        <div className="form-grid">
          <label>
            Name
            <input placeholder="Enter a name" />
          </label>
          <label>
            Region
            <select defaultValue="North">
              <option>North</option>
              <option>West</option>
              <option>Central</option>
            </select>
          </label>
          <label>
            Phone
            <input placeholder="+1 555 000 0000" />
          </label>
          <label>
            Assigned rep
            <select defaultValue="Olivia Martin">
              <option>Olivia Martin</option>
              <option>Maya Patel</option>
            </select>
          </label>
          <label className="full">
            Notes
            <textarea placeholder="Add context for your team..." />
          </label>
        </div>
        <div className="sheet-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onSave}>
            <Check data-icon="inline-start" /> Save record
          </Button>
        </div>
      </aside>
    </div>
  )
}
