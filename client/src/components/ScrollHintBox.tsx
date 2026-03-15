import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

interface Props {
  children: ReactNode
  maxHeight?: number | string
  style?: CSSProperties
  contentStyle?: CSSProperties
}

export function ScrollHintBox({ children, maxHeight, style, contentStyle }: Props) {
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [showTop, setShowTop] = useState(false)
  const [showBottom, setShowBottom] = useState(false)

  useEffect(() => {
    const node = contentRef.current
    if (!node) return

    const sync = () => {
      const nextShowTop = node.scrollTop > 6
      const nextShowBottom = node.scrollTop + node.clientHeight < node.scrollHeight - 6
      setShowTop(nextShowTop)
      setShowBottom(nextShowBottom)
    }

    sync()
    node.addEventListener('scroll', sync)
    window.addEventListener('resize', sync)

    return () => {
      node.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [children])

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: 0, ...style }}>
      {showTop && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 8,
            height: 18,
            pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(0,229,255,0.18), rgba(0,229,255,0))',
            zIndex: 1,
          }}
        />
      )}
      {showBottom && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 8,
            height: 22,
            pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(0,229,255,0), rgba(0,229,255,0.2))',
            zIndex: 1,
          }}
        />
      )}
      <div
        ref={contentRef}
        style={{
          overflowY: 'auto',
          maxHeight,
          position: 'relative',
          minHeight: 0,
          height: '100%',
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  )
}
