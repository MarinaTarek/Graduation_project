import { useEffect, useRef } from 'react'

// Registry of back handlers. The last registered handler runs first.
type Handler = () => boolean
const handlers: Handler[] = []

export function useBackHandler(fn: Handler) {
  const ref = useRef(fn)
  ref.current = fn

  useEffect(() => {
    const handler: Handler = () => ref.current()
    handlers.push(handler)
    return () => {
      const idx = handlers.lastIndexOf(handler)
      if (idx !== -1) handlers.splice(idx, 1)
    }
  }, [])
}

/** Run registered handlers in LIFO order. Returns true if any handled it. */
export function runBackHandlers(): boolean {
  for (let i = handlers.length - 1; i >= 0; i--) {
    if (handlers[i]()) return true
  }
  return false
}
