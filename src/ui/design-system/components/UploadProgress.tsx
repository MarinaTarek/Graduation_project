'use client'

import React from 'react'
import { CheckCircle2, FileText, RefreshCw, X } from 'lucide-react'

export interface UploadProgressProps {
  fileName: string
  fileSize?: string
  progress: number // 0 to 100
  status: 'uploading' | 'success' | 'error'
  onCancel?: () => void
  onRetry?: () => void
}

export function UploadProgress({
  fileName,
  fileSize,
  progress,
  status,
  onCancel,
  onRetry,
}: UploadProgressProps) {
  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: '12px',
        background: 'var(--input-bg)',
        border: '1px solid var(--border-subtle)',
        marginTop: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <FileText style={{ width: '18px', height: '18px', color: 'var(--ocean)', flexShrink: 0 }} />
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading-text)' }}>
              {fileName}
            </div>
            {fileSize && (
              <div style={{ fontSize: '11px', color: 'var(--muted-text)' }}>{fileSize}</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {status === 'success' && (
            <CheckCircle2 style={{ width: '18px', height: '18px', color: 'var(--story-em)' }} />
          )}
          {status === 'error' && onRetry && (
            <button
              onClick={onRetry}
              title="Retry upload"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ocean)' }}
            >
              <RefreshCw style={{ width: '16px', height: '16px' }} />
            </button>
          )}
          {status === 'uploading' && onCancel && (
            <button
              onClick={onCancel}
              title="Cancel upload"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)' }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            flex: 1,
            height: '6px',
            borderRadius: '99px',
            background: 'rgba(63, 101, 147, 0.15)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              borderRadius: '99px',
              background:
                status === 'error'
                  ? 'var(--rose)'
                  : status === 'success'
                  ? 'var(--story-em)'
                  : 'var(--ocean)',
              transition: 'width 0.2s ease',
            }}
          />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-text)', minWidth: '32px', textAlign: 'right' }}>
          {status === 'error' ? 'Failed' : `${progress}%`}
        </span>
      </div>
    </div>
  )
}
