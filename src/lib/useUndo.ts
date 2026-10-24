'use client'

import { useState, useRef, useCallback } from 'react'

export interface PendingAction {
  id: string
  label: string
  action: () => void
  onUndo?: () => void
}

export function useUndo(durationMs: number = 8000) {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const trigger = useCallback(
    (label: string, commitAction: () => void, undoAction?: () => void) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      const id = String(Date.now())
      setPendingAction({ id, label, action: commitAction, onUndo: undoAction })

      timerRef.current = setTimeout(() => {
        commitAction()
        setPendingAction(null)
      }, durationMs)
    },
    [durationMs]
  )

  const undo = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (pendingAction?.onUndo) {
      pendingAction.onUndo()
    }
    setPendingAction(null)
  }, [pendingAction])

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (pendingAction) {
      pendingAction.action()
    }
    setPendingAction(null)
  }, [pendingAction])

  return {
    pendingAction,
    trigger,
    undo,
    dismiss,
  }
}
