import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  active?: boolean
}

export function GlitchEffect({ children, active = true }: Props) {
  if (!active) return <>{children}</>

  return (
    <div style={{
      position: 'relative',
    }}
    className="glitch"
    >
      <div style={{
        position: 'relative',
        zIndex: 1,
      }}>
        {children}
      </div>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(100,100,100,0.1) 2px, rgba(100,100,100,0.1) 4px)',
        pointerEvents: 'none',
        zIndex: 2,
      }} />
    </div>
  )
}
