import { useEffect, useRef, useCallback, useState } from 'react'
import { Socket } from 'socket.io-client'
import { useGameStore } from '../store/gameStore'

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
}

export function useWebRTC(socketRef: React.MutableRefObject<Socket | null>) {
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const localRawTrackRef = useRef<MediaStreamTrack | null>(null)
  const localProcessedTrackRef = useRef<MediaStreamTrack | null>(null)
  const localAudioSenderRef = useRef<RTCRtpSender | null>(null)
  const outgoingFxCtxRef = useRef<AudioContext | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0))
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [remoteStreamVersion, setRemoteStreamVersion] = useState(0)
  const animFrameRef = useRef<number>(0)
  const remoteStreamRef = useRef<MediaStream | null>(null)

  // Multi-peer refs for open voice (discussion phase)
  const multiPeerRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const multiAudioRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const multiStreamRef = useRef<MediaStream | null>(null)

  const activeCallPeerId = useGameStore(s => s.activeCallPeerId)
  const playerId = useGameStore(s => s.playerId)
  const shadowInterference = useGameStore(s => s.shadowInterference)
  const voiceDistortion = useGameStore(s => s.voiceDistortion)
  const activeMinigameId = useGameStore(s => s.activeMinigameId)
  const playerVolume = useGameStore(s => s.playerVolume)
  const openVoicePlayerIds = useGameStore(s => s.openVoicePlayerIds)
  const micMuted = useGameStore(s => s.micMuted)

  const cleanup = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    peerRef.current?.close()
    peerRef.current = null
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null
    localRawTrackRef.current = null
    localProcessedTrackRef.current?.stop()
    localProcessedTrackRef.current = null
    localAudioSenderRef.current = null
    if (outgoingFxCtxRef.current) {
      void outgoingFxCtxRef.current.close()
      outgoingFxCtxRef.current = null
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null
      remoteAudioRef.current.muted = false
      remoteAudioRef.current.playbackRate = 1
    }
    remoteStreamRef.current = null
    analyserRef.current = null
    setAudioData(new Uint8Array(0))
    setIsSpeaking(false)
  }, [])

  const cleanupMultiPeer = useCallback(() => {
    multiPeerRef.current.forEach(pc => pc.close())
    multiPeerRef.current.clear()
    multiAudioRef.current.forEach(audio => {
      audio.srcObject = null
      audio.remove()
    })
    multiAudioRef.current.clear()
    if (multiStreamRef.current) {
      multiStreamRef.current.getTracks().forEach(t => t.stop())
      multiStreamRef.current = null
    }
  }, [])

  const startAudioAnalysis = useCallback((stream: MediaStream) => {
    const audioCtx = new AudioContext()
    const source = audioCtx.createMediaStreamSource(stream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    analyserRef.current = analyser

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const update = () => {
      analyser.getByteFrequencyData(dataArray)
      setAudioData(new Uint8Array(dataArray))

      // Check if speaking (average volume > threshold)
      const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength
      setIsSpeaking(avg > 20)

      animFrameRef.current = requestAnimationFrame(update)
    }
    update()
  }, [])

  const setupPeerConnection = useCallback(async (isInitiator: boolean, peerId: string) => {
    cleanup()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      localStreamRef.current = stream
      startAudioAnalysis(stream)

      const pc = new RTCPeerConnection(ICE_SERVERS)
      peerRef.current = pc

      const audioTrack = stream.getAudioTracks()[0]
      localRawTrackRef.current = audioTrack
      localAudioSenderRef.current = pc.addTrack(audioTrack, stream)

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteStreamRef.current = event.streams[0]
          remoteAudioRef.current.srcObject = event.streams[0]
          remoteAudioRef.current.volume = playerVolume
          remoteAudioRef.current.play().catch(() => {})
          setRemoteStreamVersion(v => v + 1)
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit('webrtc_ice_candidate', {
            targetId: peerId,
            candidate: event.candidate.toJSON()
          })
        }
      }

      if (isInitiator) {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socketRef.current?.emit('webrtc_offer', {
          targetId: peerId,
          offer: pc.localDescription!
        })
      }
    } catch (err) {
      console.error('WebRTC setup failed:', err)
    }
  }, [cleanup, playerVolume, socketRef, startAudioAnalysis])

  // Listen for WebRTC signaling (supports both 1-to-1 and multi-peer)
  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    const findPc = (fromId: string): RTCPeerConnection | null => {
      // Check multi-peer map first, then single-peer ref
      return multiPeerRef.current.get(fromId) ?? peerRef.current
    }

    const handleOffer = async ({ fromId, offer }: { fromId: string; offer: RTCSessionDescriptionInit }) => {
      let pc: RTCPeerConnection | null | undefined = multiPeerRef.current.get(fromId)
      if (!pc && !peerRef.current) {
        await setupPeerConnection(false, fromId)
      }
      pc = multiPeerRef.current.get(fromId) ?? peerRef.current
      if (!pc) return

      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      socket.emit('webrtc_answer', {
        targetId: fromId,
        answer: pc.localDescription!
      })
    }

    const handleAnswer = async ({ fromId, answer }: { fromId: string; answer: RTCSessionDescriptionInit }) => {
      const pc = findPc(fromId)
      if (!pc) return
      await pc.setRemoteDescription(new RTCSessionDescription(answer))
    }

    const handleCandidate = async ({ fromId, candidate }: { fromId: string; candidate: RTCIceCandidateInit }) => {
      const pc = findPc(fromId)
      if (!pc) return
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    }

    socket.on('webrtc_offer', handleOffer)
    socket.on('webrtc_answer', handleAnswer)
    socket.on('webrtc_ice_candidate', handleCandidate)

    return () => {
      socket.off('webrtc_offer', handleOffer)
      socket.off('webrtc_answer', handleAnswer)
      socket.off('webrtc_ice_candidate', handleCandidate)
    }
  }, [socketRef, setupPeerConnection])

  // Start call when activeCallPeerId changes
  useEffect(() => {
    if (activeCallPeerId && playerId) {
      // The player with the "lower" ID initiates
      const isInitiator = playerId < activeCallPeerId
      setupPeerConnection(isInitiator, activeCallPeerId)
    } else {
      cleanup()
    }
  }, [activeCallPeerId, playerId, setupPeerConnection, cleanup])

  // Multi-peer: open voice during discussion phase
  useEffect(() => {
    if (!playerId || openVoicePlayerIds.length === 0) {
      cleanupMultiPeer()
      return
    }

    const otherPeers = openVoicePlayerIds.filter(id => id !== playerId)
    if (otherPeers.length === 0) {
      cleanupMultiPeer()
      return
    }

    let cancelled = false

    const setupMultiPeer = async () => {
      try {
        // Get mic stream (shared for all peers)
        if (!multiStreamRef.current) {
          multiStreamRef.current = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          })
        }
        if (cancelled) return

        const stream = multiStreamRef.current!
        const audioTrack = stream.getAudioTracks()[0]

        for (const peerId of otherPeers) {
          if (cancelled) return
          if (multiPeerRef.current.has(peerId)) continue

          const pc = new RTCPeerConnection(ICE_SERVERS)
          multiPeerRef.current.set(peerId, pc)

          pc.addTrack(audioTrack, stream)

          pc.ontrack = (event) => {
            const audio = new Audio()
            audio.srcObject = event.streams[0]
            audio.volume = playerVolume
            audio.play().catch(() => {})
            multiAudioRef.current.set(peerId, audio)
          }

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              socketRef.current?.emit('webrtc_ice_candidate', {
                targetId: peerId,
                candidate: event.candidate.toJSON()
              })
            }
          }

          // Lower ID initiates
          const isInitiator = playerId < peerId
          if (isInitiator) {
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            socketRef.current?.emit('webrtc_offer', {
              targetId: peerId,
              offer: pc.localDescription!
            })
          }
        }
      } catch (err) {
        console.error('Multi-peer WebRTC setup failed:', err)
      }
    }

    setupMultiPeer()

    return () => {
      cancelled = true
      cleanupMultiPeer()
    }
  }, [openVoicePlayerIds, playerId, playerVolume, socketRef, cleanupMultiPeer])

  // Update volume on multi-peer audio elements
  useEffect(() => {
    multiAudioRef.current.forEach(audio => {
      audio.volume = playerVolume
    })
  }, [playerVolume])

  // Mute/unmute mic for multi-peer open voice
  useEffect(() => {
    if (multiStreamRef.current) {
      multiStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !micMuted
      })
    }
  }, [micMuted])

  const buildProcessedOutgoingTrack = useCallback(async (inputStream: MediaStream): Promise<MediaStreamTrack | null> => {
    const ctx = new AudioContext()
    void ctx.resume()
    outgoingFxCtxRef.current = ctx

    const source = ctx.createMediaStreamSource(inputStream)

    // Deep mask: low-heavy, narrow band, AM modulation + saturation.
    const highpass = ctx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = 90

    const lowpass = ctx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 2700

    const lowshelf = ctx.createBiquadFilter()
    lowshelf.type = 'lowshelf'
    lowshelf.frequency.value = 220
    lowshelf.gain.value = 12

    const peaking = ctx.createBiquadFilter()
    peaking.type = 'peaking'
    peaking.frequency.value = 1750
    peaking.Q.value = 1.1
    peaking.gain.value = 0

    const waveshaper = ctx.createWaveShaper()
    const curve = new Float32Array(512)
    for (let i = 0; i < curve.length; i++) {
      const x = (i * 2) / curve.length - 1
      curve[i] = Math.tanh(3.6 * x)
    }
    waveshaper.curve = curve

    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -28
    compressor.ratio.value = 5
    compressor.attack.value = 0.002
    compressor.release.value = 0.2

    // Makeup gain to avoid near-silent processed voice in some devices/browsers.
    const postGain = ctx.createGain()
    postGain.gain.value = 1.8

    let disguiseNode: AudioWorkletNode | null = null
    try {
      await ctx.audioWorklet.addModule('/audio/voice-disguise-worklet.js')
      disguiseNode = new AudioWorkletNode(ctx, 'voice-disguise-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      })
      disguiseNode.port.postMessage({ pitch: 0.7, grainSize: 1152 })
    } catch (error) {
      console.warn('AudioWorklet unavailable, using fallback disguise chain', error)
    }

    const amGain = ctx.createGain()
    amGain.gain.value = 0.88
    const amOsc = ctx.createOscillator()
    amOsc.type = 'sine'
    amOsc.frequency.value = 18
    const amDepth = ctx.createGain()
    amDepth.gain.value = 0.08
    amOsc.connect(amDepth).connect(amGain.gain)
    amOsc.start()

    const destination = ctx.createMediaStreamDestination()

    source.connect(highpass)
    highpass.connect(lowpass)
    lowpass.connect(lowshelf)
    lowshelf.connect(peaking)
    peaking.connect(waveshaper)
    if (disguiseNode) {
      waveshaper.connect(disguiseNode)
      disguiseNode.connect(amGain)
    } else {
      waveshaper.connect(amGain)
    }
    amGain.connect(compressor)
    compressor.connect(postGain)
    postGain.connect(destination)

    const track = destination.stream.getAudioTracks()[0] ?? null
    if (!track) {
      amOsc.stop()
      void ctx.close()
      outgoingFxCtxRef.current = null
      return null
    }
    track.enabled = true
    return track
  }, [])

  const applyOutgoingVoiceMode = useCallback(async (enabled: boolean) => {
    const sender = localAudioSenderRef.current
    const rawTrack = localRawTrackRef.current
    if (!sender || !rawTrack) return

    if (!enabled) {
      try {
        await sender.replaceTrack(rawTrack)
      } catch {
        // keep current track if replace fails
      }
      if (localProcessedTrackRef.current) {
        localProcessedTrackRef.current.stop()
        localProcessedTrackRef.current = null
      }
      if (outgoingFxCtxRef.current) {
        await outgoingFxCtxRef.current.close()
        outgoingFxCtxRef.current = null
      }
      return
    }

    if (!localProcessedTrackRef.current && localStreamRef.current) {
      localProcessedTrackRef.current = await buildProcessedOutgoingTrack(localStreamRef.current)
    }
    if (localProcessedTrackRef.current) {
      try {
        await sender.replaceTrack(localProcessedTrackRef.current)
        return
      } catch {
        // fallback below
      }
    }
    // Fallback safety: never leave sender in a broken/silent state.
    try {
      await sender.replaceTrack(rawTrack)
    } catch {
      // ignore
    }
  }, [buildProcessedOutgoingTrack])

  // Distortion is applied on sender side before WebRTC transport.
  // Guarded to only run during Adivina la Linea.
  useEffect(() => {
    const shouldDistort = voiceDistortion && activeMinigameId === 'adivina-linea'
    void applyOutgoingVoiceMode(shouldDistort)
  }, [voiceDistortion, activeMinigameId, activeCallPeerId, remoteStreamVersion, applyOutgoingVoiceMode])

  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = playerVolume
      if (activeCallPeerId && remoteAudioRef.current.srcObject) {
        void remoteAudioRef.current.play().catch(() => {})
      }
    }
  }, [playerVolume, voiceDistortion, activeCallPeerId])

  // Apply audio distortion when shadow interference is active
  useEffect(() => {
    if (remoteAudioRef.current) {
      const baseRate = 1
      if (shadowInterference) {
        remoteAudioRef.current.playbackRate = Math.max(0.6, baseRate - 0.2) + Math.random() * 0.4
      } else {
        remoteAudioRef.current.playbackRate = baseRate
      }
    }
  }, [shadowInterference, voiceDistortion])

  return {
    remoteAudioRef,
    audioData,
    isSpeaking,
  }
}
