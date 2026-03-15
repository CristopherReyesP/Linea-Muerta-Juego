import { useEffect, useMemo, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useI18n } from '../i18n'

export function IdleNotesPanel() {
  const { tr } = useI18n()
  const gameId = useGameStore((s) => s.gameId)
  const activeMinigameId = useGameStore((s) => s.activeMinigameId)
  const currentMinigameIndex = useGameStore((s) => s.currentMinigameIndex)

  const storageKey = useMemo(() => {
    if (!gameId || !activeMinigameId) return null
    return `lm_notes:${gameId}:${currentMinigameIndex}:${activeMinigameId}`
  }, [activeMinigameId, currentMinigameIndex, gameId])

  const [collapsed, setCollapsed] = useState(false)
  const [notes, setNotes] = useState('')
  const [consoleExpanded, setConsoleExpanded] = useState(false)

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') {
      setNotes('')
      return
    }

    setNotes(window.sessionStorage.getItem(storageKey) ?? '')
  }, [storageKey])

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return
    window.sessionStorage.setItem(storageKey, notes)
  }, [notes, storageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleVisibility = (event: Event) => {
      const customEvent = event as CustomEvent<{ expanded?: boolean }>
      setConsoleExpanded(Boolean(customEvent.detail?.expanded))
    }

    window.addEventListener('lm-autolog-visibility', handleVisibility as EventListener)
    return () => window.removeEventListener('lm-autolog-visibility', handleVisibility as EventListener)
  }, [])

  if (!storageKey) return null

  return (
    <div
      style={{
        position: 'absolute',
        left: 18,
        bottom: consoleExpanded ? 245 : 64,
        zIndex: 2,
        width: collapsed ? 172 : 288,
        border: '1px solid rgba(0,229,255,0.24)',
        background: 'linear-gradient(180deg, rgba(5,12,18,0.94), rgba(4,8,14,0.9))',
        boxShadow: '0 14px 28px rgba(0,0,0,0.34)',
        transition: 'bottom 0.22s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '8px 10px',
          borderBottom: collapsed ? 'none' : '1px solid rgba(0,229,255,0.14)',
        }}
      >
        <div>
          <div style={{ fontSize: 9, color: 'var(--cyan)', letterSpacing: 2.2 }}>
            {tr('BLOC DE CABINA')}
          </div>
          <div style={{ fontSize: 9, color: 'var(--gray-text)', marginTop: 2 }}>
            {tr('Solo lo ves tu')}
          </div>
        </div>

        <button
          onClick={() => setCollapsed((value) => !value)}
          style={{
            border: '1px solid #2a3948',
            background: 'rgba(255,255,255,0.03)',
            color: 'var(--gray-text)',
            fontSize: 10,
            padding: '4px 8px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {collapsed ? tr('ABRIR') : tr('OCULTAR')}
        </button>
      </div>

      {!collapsed && (
        <div style={{ padding: 10 }}>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={tr('Anota sospechas, promesas, pistas o nombres...')}
            style={{
              width: '100%',
              minHeight: 112,
              resize: 'none',
              padding: 10,
              border: '1px solid #233445',
              background: 'rgba(0,0,0,0.28)',
              color: 'var(--white)',
              fontSize: 11,
              lineHeight: 1.5,
              fontFamily: 'var(--font-mono)',
              outline: 'none',
            }}
          />
          <div style={{ fontSize: 9, color: 'var(--gray-text)', marginTop: 8 }}>
            {tr('Se guarda durante esta sesion del navegador.')}
          </div>
        </div>
      )}
    </div>
  )
}
