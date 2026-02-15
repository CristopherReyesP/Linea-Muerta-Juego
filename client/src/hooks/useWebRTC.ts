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
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0))
  const [isSpeaking, setIsSpeaking] = useState(false)
  const animFrameRef = useRef<number>(0)

  const activeCallPeerId = useGameStore(s => s.activeCallPeerId)
  const playerId = useGameStore(s => s.playerId)
  const shadowInterference = useGameStore(s => s.shadowInterference)
  const voiceDistortion = useGameStore(s => s.voiceDistortion)
  const playerVolume = useGameStore(s => s.playerVolume)

  // Voice distortion nodes
  const distortionCtxRef = useRef<AudioContext | null>(null)
  const distortionSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const distortionOutputGainRef = useRef<GainNode | null>(null)

  const cleanup = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    peerRef.current?.close()
    peerRef.current = null
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null
    }
    analyserRef.current = null
    setAudioData(new Uint8Array(0))
    setIsSpeaking(false)
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream
      startAudioAnalysis(stream)

      const pc = new RTCPeerConnection(ICE_SERVERS)
      peerRef.current = pc

      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0]
        remoteAudioRef.current.volume = playerVolume
        remoteAudioRef.current.play().catch(() => {})
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

  // Listen for WebRTC signaling
  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    const handleOffer = async ({ fromId, offer }: { fromId: string; offer: RTCSessionDescriptionInit }) => {
      if (!peerRef.current) {
        await setupPeerConnection(false, fromId)
      }
      const pc = peerRef.current
      if (!pc) return

      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      socket.emit('webrtc_answer', {
        targetId: fromId,
        answer: pc.localDescription!
      })
    }

    const handleAnswer = async ({ answer }: { fromId: string; answer: RTCSessionDescriptionInit }) => {
      const pc = peerRef.current
      if (!pc) return
      await pc.setRemoteDescription(new RTCSessionDescription(answer))
    }

    const handleCandidate = async ({ candidate }: { fromId: string; candidate: RTCIceCandidateInit }) => {
      const pc = peerRef.current
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

  // Apply heavy voice distortion for AdivinaLinea minigame
  useEffect(() => {
    const audioEl = remoteAudioRef.current
    if (!audioEl) return

    if (voiceDistortion && audioEl.srcObject) {
      const ctx = new AudioContext()
      const source = ctx.createMediaElementSource(audioEl)

      // Ring modulator: multiply voice with a sine wave to make it completely unrecognizable
      // This shifts all frequencies, destroying the natural voice timbre
      const ringOscillator = ctx.createOscillator()
      ringOscillator.type = 'sine'
      ringOscillator.frequency.value = 180 // frequency shift amount
      const ringGain = ctx.createGain()
      ringGain.gain.value = 1.0
      ringOscillator.connect(ringGain.gain) // modulate the gain
      ringOscillator.start()

      // Second ring mod at different frequency for extra mangling
      const ringOsc2 = ctx.createOscillator()
      ringOsc2.type = 'square'
      ringOsc2.frequency.value = 35 // tremolo-like pulsing
      const ringGain2 = ctx.createGain()
      ringGain2.gain.value = 0.6
      ringOsc2.connect(ringGain2.gain)
      ringOsc2.start()

      // Aggressive bandpass filter - removes identifying high and low frequencies
      const bandpass = ctx.createBiquadFilter()
      bandpass.type = 'bandpass'
      bandpass.frequency.value = 1200
      bandpass.Q.value = 0.8

      // Waveshaper for harsh distortion
      const waveshaper = ctx.createWaveShaper()
      const curve = new Float32Array(256)
      for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 256 - 1
        // Harsh clipping for robotic sound
        curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.3)
      }
      waveshaper.curve = curve

      // Resonant notch filter to remove more voice characteristics
      const notch = ctx.createBiquadFilter()
      notch.type = 'notch'
      notch.frequency.value = 800
      notch.Q.value = 2

      // Final output gain
      const outputGain = ctx.createGain()
      outputGain.gain.value = 0.7 * playerVolume

      // Chain: source -> ringMod -> ringMod2 -> bandpass -> waveshaper -> notch -> output
      source.connect(ringGain)
      ringGain.connect(ringGain2)
      ringGain2.connect(bandpass)
      bandpass.connect(waveshaper)
      waveshaper.connect(notch)
      notch.connect(outputGain)
      outputGain.connect(ctx.destination)

      distortionCtxRef.current = ctx
      distortionSourceRef.current = source
      distortionOutputGainRef.current = outputGain

      return () => {
        try {
          ringOscillator.stop()
          ringOsc2.stop()
          source.disconnect()
          ringGain.disconnect()
          ringGain2.disconnect()
          bandpass.disconnect()
          waveshaper.disconnect()
          notch.disconnect()
          outputGain.disconnect()
          ctx.close()
        } catch {}
        distortionCtxRef.current = null
        distortionSourceRef.current = null
        distortionOutputGainRef.current = null
      }
    } else {
      // Clean up distortion if it was active
      if (distortionCtxRef.current) {
        try {
          distortionSourceRef.current?.disconnect()
          distortionCtxRef.current.close()
        } catch {}
        distortionCtxRef.current = null
        distortionSourceRef.current = null
        distortionOutputGainRef.current = null
      }
    }
  }, [voiceDistortion, activeCallPeerId, playerVolume])

  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = playerVolume
    }
    if (distortionOutputGainRef.current && distortionCtxRef.current) {
      distortionOutputGainRef.current.gain.setTargetAtTime(
        0.7 * playerVolume,
        distortionCtxRef.current.currentTime,
        0.05
      )
    }
  }, [playerVolume])

  // Apply audio distortion when shadow interference is active
  useEffect(() => {
    if (remoteAudioRef.current) {
      if (shadowInterference) {
        remoteAudioRef.current.playbackRate = 0.7 + Math.random() * 0.6
      } else {
        remoteAudioRef.current.playbackRate = 1.0
      }
    }
  }, [shadowInterference])

  return {
    remoteAudioRef,
    audioData,
    isSpeaking,
  }
}
