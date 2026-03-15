import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { setAmbientVolume } from '../audio/SoundEngine'
import { useI18n } from '../i18n'

export function AudioControls() {
  const { tr } = useI18n()
  const ambientVolume = useGameStore((s) => s.ambientVolume)
  const playerVolume = useGameStore((s) => s.playerVolume)
  const setStoreAmbientVolume = useGameStore((s) => s.setAmbientVolume)
  const setStorePlayerVolume = useGameStore((s) => s.setPlayerVolume)

  useEffect(() => {
    setAmbientVolume(ambientVolume)
  }, [ambientVolume])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        border: '1px solid #223',
        background: 'rgba(0,0,0,0.35)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 72 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 10v4h4l5 4V6L9 10H5z" stroke="#00e5ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 9c1.3 1.3 1.3 4.7 0 6" stroke="#00e5ff" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M19.5 6.5c2.6 2.7 2.6 8.3 0 11" stroke="#00e5ff" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: 1 }}>{tr('SONIDO')}</span>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'var(--gray-text)' }}>
        {tr('FONDO')}
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(ambientVolume * 100)}
          onChange={(e) => setStoreAmbientVolume(Number(e.target.value) / 100)}
        />
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'var(--gray-text)' }}>
        {tr('JUGADORES')}
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(playerVolume * 100)}
          onChange={(e) => setStorePlayerVolume(Number(e.target.value) / 100)}
        />
      </label>
    </div>
  )
}
