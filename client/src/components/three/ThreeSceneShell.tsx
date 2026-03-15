import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Html, Line, OrbitControls, PerspectiveCamera, Sparkles } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../store/gameStore'
import { MetaGamePhase } from '../../types'

function DeepSpaceRelay() {
  const groupRef = useRef<THREE.Group>(null)
  const metaPhase = useGameStore((s) => s.metaPhase)

  useFrame((state, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += delta * 0.08
    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.06
  })

  const coreColor = metaPhase === MetaGamePhase.MINIGAME_INTRO ? '#9beaff' : '#7fffc7'

  return (
    <group ref={groupRef} position={[0, 0.25, 0]}>
      <mesh>
        <octahedronGeometry args={[0.48, 1]} />
        <meshStandardMaterial color="#e7fbff" emissive={coreColor} emissiveIntensity={1.8} metalness={0.35} roughness={0.12} />
      </mesh>
      <mesh rotation={[0.3, 0.5, Math.PI / 2]}>
        <torusGeometry args={[1.3, 0.03, 10, 100]} />
        <meshStandardMaterial color="#67dfff" emissive="#67dfff" emissiveIntensity={1.15} metalness={0.75} roughness={0.18} />
      </mesh>
      <mesh rotation={[1.1, 0.15, 0.4]}>
        <torusGeometry args={[1.95, 0.018, 8, 80]} />
        <meshStandardMaterial color="#2c4d67" emissive="#335b76" emissiveIntensity={0.42} metalness={0.62} roughness={0.34} />
      </mesh>
    </group>
  )
}

function NebulaClouds() {
  const clouds = useMemo(() => ([
    { key: 'left', position: [-13, 3.5, -22] as [number, number, number], scale: [10, 5, 6] as [number, number, number], color: '#1a3761' },
    { key: 'right', position: [14, 5.5, -24] as [number, number, number], scale: [12, 6, 7] as [number, number, number], color: '#1f3050' },
    { key: 'low', position: [0, -4.5, -19] as [number, number, number], scale: [15, 4, 7] as [number, number, number], color: '#12233e' },
  ]), [])

  return (
    <group>
      {clouds.map((cloud) => (
        <mesh key={cloud.key} position={cloud.position} scale={cloud.scale}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial color={cloud.color} emissive={cloud.color} emissiveIntensity={0.22} transparent opacity={0.16} />
        </mesh>
      ))}
    </group>
  )
}

function PlayerShip({
  color,
  isHost,
  isMe,
}: {
  color: string
  isHost: boolean
  isMe: boolean
}) {
  const accent = isHost ? '#b5f1ff' : isMe ? '#b8ffd9' : color

  return (
    <group>
      <mesh>
        <capsuleGeometry args={[0.16, 0.55, 8, 16]} />
        <meshStandardMaterial color="#eefbff" emissive={accent} emissiveIntensity={0.72} metalness={0.28} roughness={0.12} />
      </mesh>
      <mesh position={[0, 0.02, 0.28]} rotation={[-0.18, 0, 0]}>
        <coneGeometry args={[0.15, 0.3, 18]} />
        <meshStandardMaterial color="#ffffff" emissive="#c6f2ff" emissiveIntensity={0.2} metalness={0.08} roughness={0.08} />
      </mesh>
      <mesh position={[0, 0.02, -0.36]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.11, 0.22, 16]} />
        <meshStandardMaterial color="#8de5ff" emissive={accent} emissiveIntensity={1.05} metalness={0.18} roughness={0.12} />
      </mesh>
      <mesh position={[0, 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.52, 0.05, 0.18]} />
        <meshStandardMaterial color="#17283b" metalness={0.74} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.14, -0.02]}>
        <boxGeometry args={[0.12, 0.05, 0.48]} />
        <meshStandardMaterial color="#152538" metalness={0.76} roughness={0.16} />
      </mesh>
      <mesh position={[0, 0.2, 0.08]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial
          color="#07121a"
          emissive={isHost ? '#88e8ff' : isMe ? '#8dffc8' : '#69dfff'}
          emissiveIntensity={1.3}
          metalness={0.06}
          roughness={0.04}
        />
      </mesh>
      <mesh position={[-0.28, 0.03, -0.1]} rotation={[0.18, 0, 0.22]}>
        <boxGeometry args={[0.1, 0.04, 0.22]} />
        <meshStandardMaterial color="#1a2d40" metalness={0.74} roughness={0.16} />
      </mesh>
      <mesh position={[0.28, 0.03, -0.1]} rotation={[0.18, 0, -0.22]}>
        <boxGeometry args={[0.1, 0.04, 0.22]} />
        <meshStandardMaterial color="#1a2d40" metalness={0.74} roughness={0.16} />
      </mesh>
      <mesh position={[-0.2, -0.02, -0.32]}>
        <boxGeometry args={[0.08, 0.08, 0.08]} />
        <meshStandardMaterial color="#13212d" emissive="#ff6f8d" emissiveIntensity={1.25} />
      </mesh>
      <mesh position={[0.2, -0.02, -0.32]}>
        <boxGeometry args={[0.08, 0.08, 0.08]} />
        <meshStandardMaterial color="#13212d" emissive="#ff6f8d" emissiveIntensity={1.25} />
      </mesh>
    </group>
  )
}

function ActiveSignalLines() {
  const lobbyPlayers = useGameStore((s) => s.lobbyPlayers)
  const players = useGameStore((s) => s.players)
  const activeCalls = useGameStore((s) => s.activeCalls)
  const metaPhase = useGameStore((s) => s.metaPhase)
  const pulseRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!pulseRef.current) return
    pulseRef.current.children.forEach((child, index) => {
      const material = (child as THREE.Mesh).material
      if (material && 'opacity' in material) {
        ;(material as THREE.Material & { opacity: number }).opacity = 0.22 + Math.sin(state.clock.elapsedTime * 1.5 + index) * 0.1
      }
    })
  })

  const sourcePlayers = metaPhase === MetaGamePhase.MINIGAME_IN_PROGRESS ? players : lobbyPlayers
  const nodeMap = useMemo(() => {
    const count = Math.max(sourcePlayers.length, 4)
    const map = new Map<string, [number, number, number]>()

    sourcePlayers.forEach((player, index) => {
      const angle = (index / count) * Math.PI * 2
      const radius = 9.2
      const key = 'id' in player ? player.id : player.playerId
      map.set(key, [
        Math.cos(angle) * radius,
        Math.sin(index * 1.7) * 0.65 + 0.95,
        Math.sin(angle) * radius,
      ])
    })

    return map
  }, [sourcePlayers, metaPhase])

  const lobbyBeams = useMemo(() => {
    if (metaPhase === MetaGamePhase.MINIGAME_IN_PROGRESS) return []
    return sourcePlayers.map((player) => {
      const key = 'id' in player ? player.id : player.playerId
      const target = nodeMap.get(key)
      if (!target) return null
      return {
        key,
        color: player.avatarColor,
        points: [
          [0, 0.55, 0] as [number, number, number],
          [target[0] * 0.35, 1.8, target[2] * 0.35] as [number, number, number],
          [target[0], target[1], target[2]] as [number, number, number],
        ],
      }
    }).filter((beam): beam is { key: string; color: string; points: [number, number, number][] } => Boolean(beam))
  }, [sourcePlayers, metaPhase, nodeMap])

  const callBeams = useMemo(() => {
    if (metaPhase !== MetaGamePhase.MINIGAME_IN_PROGRESS) return []
    return activeCalls.map((call) => {
      const from = nodeMap.get(call.callerId)
      const to = nodeMap.get(call.receiverId)
      if (!from || !to) return null
      const midX = (from[0] + to[0]) / 2
      const midY = Math.max(from[1], to[1]) + (call.active ? 2.2 : 1.3)
      const midZ = (from[2] + to[2]) / 2
      return {
        key: call.id,
        active: call.active,
        points: [
          [from[0], from[1], from[2]] as [number, number, number],
          [midX, midY, midZ] as [number, number, number],
          [to[0], to[1], to[2]] as [number, number, number],
        ],
      }
    }).filter((beam): beam is { key: string; active: boolean; points: [number, number, number][] } => Boolean(beam))
  }, [activeCalls, metaPhase, nodeMap])

  return (
    <group ref={pulseRef}>
      {lobbyBeams.map((beam) => (
        <Line key={beam.key} points={beam.points} color={beam.color} lineWidth={1.2} transparent opacity={0.22} />
      ))}
      {callBeams.map((beam) => (
        <Line
          key={beam.key}
          points={beam.points}
          color={beam.active ? '#ff688b' : '#7de4ff'}
          lineWidth={beam.active ? 2.4 : 1.7}
          transparent
          opacity={beam.active ? 0.78 : 0.46}
        />
      ))}
    </group>
  )
}

function PlayerNodes() {
  const lobbyPlayers = useGameStore((s) => s.lobbyPlayers)
  const players = useGameStore((s) => s.players)
  const metaPhase = useGameStore((s) => s.metaPhase)
  const hostId = useGameStore((s) => s.hostId)
  const myPlayerId = useGameStore((s) => s.playerId)

  const sourcePlayers = metaPhase === MetaGamePhase.MINIGAME_IN_PROGRESS ? players : lobbyPlayers
  const nodes = useMemo(() => {
    const count = Math.max(sourcePlayers.length, 4)
    return Array.from({ length: count }).map((_, index) => {
      const angle = (index / count) * Math.PI * 2
      const radius = 9.2
      const player = sourcePlayers[index]
      const playerKey = player ? ('id' in player ? player.id : player.playerId) : null
      return {
        key: playerKey ?? `empty-${index}`,
        name: player?.name ?? 'Sector vacio',
        color: player?.avatarColor ?? '#203040',
        x: Math.cos(angle) * radius,
        y: Math.sin(index * 1.7) * 0.65,
        z: Math.sin(angle) * radius,
        active: Boolean(player),
        isHost: playerKey === hostId,
        isMe: playerKey === myPlayerId,
      }
    })
  }, [sourcePlayers, hostId, myPlayerId])

  return (
    <group>
      {nodes.map((node, index) => (
        <Float key={node.key} speed={0.8 + index * 0.06} rotationIntensity={0.18} floatIntensity={0.55}>
          <group position={[node.x, node.y + (node.active ? 0.7 : 0.45), node.z]} rotation={[0, Math.atan2(-node.x, -node.z), 0]}>
            {node.active && (
              <mesh rotation-x={-Math.PI / 2} position={[0, -0.56, 0]}>
                <ringGeometry args={[0.62, 0.86, 32]} />
                <meshStandardMaterial
                  color={node.isHost ? '#b5f1ff' : node.isMe ? '#b8ffd9' : '#355772'}
                  emissive={node.isHost ? '#88e8ff' : node.isMe ? '#8dffc8' : '#416a89'}
                  emissiveIntensity={0.72}
                  transparent
                  opacity={0.75}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
            <mesh position={[0, -0.16, 0]}>
              <cylinderGeometry args={[0.22, 0.08, node.active ? 0.8 : 0.44, 10]} />
              <meshStandardMaterial
                color="#122233"
                emissive={node.active ? '#59d7ff' : '#1b2d3a'}
                emissiveIntensity={node.active ? 0.82 : 0.14}
                metalness={0.18}
                roughness={0.5}
              />
            </mesh>
            {node.active ? (
              <PlayerShip color={node.color} isHost={node.isHost} isMe={node.isMe} />
            ) : (
              <mesh position={[0, 0.42, 0]}>
                <octahedronGeometry args={[0.11, 0]} />
                <meshStandardMaterial color="#14202c" emissive="#1c2d3b" emissiveIntensity={0.18} metalness={0.16} roughness={0.4} />
              </mesh>
            )}
            {node.active && (
              <Html
                position={[0, 1.5, 0]}
                center
                distanceFactor={11}
                transform
                sprite
                occlude={false}
                zIndexRange={[5, 0]}
              >
                <div
                  style={{
                    minWidth: 112,
                    padding: '6px 8px',
                    borderRadius: 8,
                    border: `1px solid ${node.isHost ? 'rgba(170, 239, 255, 0.88)' : node.isMe ? 'rgba(167, 255, 208, 0.88)' : 'rgba(214, 227, 238, 0.58)'}`,
                    background: 'rgba(3, 6, 10, 0.98)',
                    boxShadow: '0 12px 26px rgba(0, 0, 0, 0.54)',
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      lineHeight: 1.2,
                      color: '#ffffff',
                      whiteSpace: 'nowrap',
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.95)',
                    }}
                  >
                    {node.name}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: 1.1,
                      color: node.isHost ? '#bdf4ff' : node.isMe ? '#b8ffd8' : '#d1dbe3',
                      textTransform: 'uppercase',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.9)',
                    }}
                  >
                    {node.isHost ? 'Nave guia' : node.isMe ? 'Tu nave' : 'En la deriva'}
                  </div>
                </div>
              </Html>
            )}
          </group>
        </Float>
      ))}
    </group>
  )
}

function SceneContent({ interactive }: { interactive: boolean }) {
  const ambientPulseRef = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    if (!ambientPulseRef.current) return
    ambientPulseRef.current.intensity = 10 + Math.sin(state.clock.elapsedTime * 1.2) * 2
  })

  return (
    <>
      <color attach="background" args={['#02050b']} />
      <fog attach="fog" args={['#02050b', 20, 60]} />
      <PerspectiveCamera makeDefault position={[0, 5.8, 18]} fov={42} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={0.95}
        maxPolarAngle={1.45}
        minAzimuthAngle={-1.1}
        maxAzimuthAngle={1.1}
        rotateSpeed={0.65}
        autoRotate={!interactive}
        autoRotateSpeed={0.22}
      />

      <ambientLight intensity={0.45} color="#88b8ff" />
      <directionalLight position={[8, 12, 5]} intensity={1.15} color="#dcefff" />
      <pointLight ref={ambientPulseRef} position={[0, 1.6, 0]} intensity={10} distance={14} color="#48d8ff" />
      <pointLight position={[0, 2.8, 0]} intensity={5} distance={7} color="#ff496d" />
      <pointLight position={[-12, 5, -10]} intensity={8} distance={22} color="#4fa7ff" />
      <pointLight position={[12, 4, -12]} intensity={6} distance={20} color="#79ffd0" />

      <Sparkles count={240} scale={[80, 44, 80]} size={2.1} speed={0.18} color="#d9efff" />
      <Sparkles count={180} scale={[110, 60, 30]} position={[0, 0, -26]} size={1.25} speed={0.06} color="#ffffff" />

      <NebulaClouds />
      <ActiveSignalLines />
      <DeepSpaceRelay />
      <PlayerNodes />
    </>
  )
}

export function ThreeSceneShell({
  interactive = false,
  onSceneTap,
}: {
  interactive?: boolean
  onSceneTap?: () => void
}) {
  const pointerStateRef = useRef<{ x: number; y: number; moved: boolean; startedAt: number } | null>(null)

  return (
    <div
      onPointerDown={(event) => {
        pointerStateRef.current = {
          x: event.clientX,
          y: event.clientY,
          moved: false,
          startedAt: Date.now(),
        }
      }}
      onPointerMove={(event) => {
        const current = pointerStateRef.current
        if (!current) return
        if (Math.abs(event.clientX - current.x) > 6 || Math.abs(event.clientY - current.y) > 6) {
          current.moved = true
        }
      }}
      onPointerUp={() => {
        const current = pointerStateRef.current
        pointerStateRef.current = null
        if (!current || current.moved) return
        if (Date.now() - current.startedAt > 250) return
        onSceneTap?.()
      }}
      style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(circle at 50% 10%, rgba(44, 94, 154, 0.15), transparent 28%),
          radial-gradient(circle at 50% 24%, rgba(12, 34, 56, 0.32), transparent 48%),
          linear-gradient(180deg, #01030a 0%, #03060d 100%)
        `,
      }}
    >
      <Canvas dpr={[1, 1.75]} gl={{ antialias: true }}>
        <SceneContent interactive={interactive} />
      </Canvas>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(circle at 50% 50%, transparent 0%, transparent 58%, rgba(2, 4, 8, 0.4) 100%),
            linear-gradient(180deg, rgba(2, 4, 8, 0.2) 0%, transparent 18%, transparent 82%, rgba(2, 4, 8, 0.34) 100%)
          `,
        }}
      />
    </div>
  )
}
