interface Props {
  audioData: Uint8Array
  width?: number
  height?: number
  color?: string
}

export function Waveform({ audioData, width = 200, height = 60, color = '#00ff41' }: Props) {
  const bars = 32
  const barWidth = width / bars - 2

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      height,
    }}>
      {Array.from({ length: bars }).map((_, i) => {
        const dataIndex = Math.floor((i / bars) * audioData.length)
        const value = audioData[dataIndex] ?? 0
        const barHeight = Math.max(3, (value / 255) * height)

        return (
          <div
            key={i}
            style={{
              width: barWidth,
              height: barHeight,
              background: color,
              opacity: 0.3 + (value / 255) * 0.7,
              transition: 'height 0.05s ease',
              borderRadius: 1,
            }}
          />
        )
      })}
    </div>
  )
}
