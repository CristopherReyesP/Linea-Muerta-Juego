import { CallData, PlayerState } from './types'
import { Player } from './Player'
import { v4 as uuid } from 'uuid'
import { Server } from 'socket.io'

export class CallManager {
  private calls: Map<string, CallData> = new Map()
  // playerId -> callId for ACTIVE (connected) calls only
  private activeCalls: Map<string, string> = new Map()
  // playerId -> callId for players who initiated a call and are waiting
  private pendingOutgoing: Map<string, string> = new Map()

  getActiveCalls(): CallData[] {
    return Array.from(this.calls.values()).filter(c => c.active)
  }

  getPlayerCall(playerId: string): CallData | null {
    const callId = this.activeCalls.get(playerId)
    if (!callId) return null
    return this.calls.get(callId) ?? null
  }

  isPlayerInActiveCall(playerId: string): boolean {
    return this.activeCalls.has(playerId)
  }

  isPlayerWaitingOutgoing(playerId: string): boolean {
    return this.pendingOutgoing.has(playerId)
  }

  initiateCall(caller: Player, receiver: Player, io: Server): CallData | null {
    // Block if caller already has an active call or pending outgoing call
    if (this.isPlayerInActiveCall(caller.id) || this.isPlayerWaitingOutgoing(caller.id)) {
      return null
    }
    // Block if receiver is already in an active call
    if (this.isPlayerInActiveCall(receiver.id)) {
      return null
    }

    const call: CallData = {
      id: uuid(),
      callerId: caller.id,
      receiverId: receiver.id,
      active: false
    }

    this.calls.set(call.id, call)
    this.pendingOutgoing.set(caller.id, call.id)

    caller.state = PlayerState.IN_CALL

    // Send incoming call to receiver
    io.to(receiver.socketId).emit('incoming_call', {
      callId: call.id,
      callerId: caller.id,
      callerName: caller.name
    })

    return call
  }

  acceptCall(callId: string, players: Map<string, Player>, io: Server): boolean {
    const call = this.calls.get(callId)
    if (!call || call.active) return false

    const caller = players.get(call.callerId)
    const receiver = players.get(call.receiverId)
    if (!caller || !receiver) return false

    call.active = true

    // Move to active calls
    this.activeCalls.set(caller.id, callId)
    this.activeCalls.set(receiver.id, callId)
    this.pendingOutgoing.delete(caller.id)

    caller.state = PlayerState.IN_CALL
    receiver.state = PlayerState.IN_CALL

    // Reject all other pending calls TO this receiver
    this.rejectOtherPendingCalls(receiver.id, callId, players, io)

    // Notify both that call started
    io.to(caller.socketId).emit('call_started', { callId, peerId: receiver.id })
    io.to(receiver.socketId).emit('call_started', { callId, peerId: caller.id })

    return true
  }

  rejectCall(callId: string, players: Map<string, Player>, io: Server): void {
    const call = this.calls.get(callId)
    if (!call) return

    const caller = players.get(call.callerId)
    if (caller) {
      caller.setActive()
      io.to(caller.socketId).emit('call_rejected')
    }

    this.cleanupCall(callId)
  }

  hangUp(playerId: string, players: Map<string, Player>, io: Server): void {
    // Check active call first
    const activeCallId = this.activeCalls.get(playerId)
    if (activeCallId) {
      this.endCall(activeCallId, players, io)
      return
    }

    // Check if they have a pending outgoing call
    const pendingCallId = this.pendingOutgoing.get(playerId)
    if (pendingCallId) {
      const call = this.calls.get(pendingCallId)
      if (call) {
        const receiver = players.get(call.receiverId)
        if (receiver) {
          io.to(receiver.socketId).emit('call_cancelled', { callId: pendingCallId })
        }
      }
      const player = players.get(playerId)
      if (player) player.setActive()
      this.cleanupCall(pendingCallId)
    }
  }

  endCall(callId: string, players: Map<string, Player>, io: Server): void {
    const call = this.calls.get(callId)
    if (!call) return

    const caller = players.get(call.callerId)
    const receiver = players.get(call.receiverId)

    if (caller) {
      caller.setActive()
      io.to(caller.socketId).emit('call_ended', { callId })
    }
    if (receiver) {
      receiver.setActive()
      io.to(receiver.socketId).emit('call_ended', { callId })
    }

    this.cleanupCall(callId)
  }

  endAllCalls(players: Map<string, Player>, io: Server): void {
    for (const [callId] of this.calls) {
      const call = this.calls.get(callId)
      if (!call) continue

      if (call.active) {
        this.endCall(callId, players, io)
      } else {
        // Pending call - notify both parties
        const caller = players.get(call.callerId)
        const receiver = players.get(call.receiverId)
        if (caller) {
          caller.setActive()
          io.to(caller.socketId).emit('call_ended', { callId })
        }
        if (receiver) {
          io.to(receiver.socketId).emit('call_cancelled', { callId })
        }
        this.cleanupCall(callId)
      }
    }
  }

  private rejectOtherPendingCalls(receiverId: string, acceptedCallId: string, players: Map<string, Player>, io: Server): void {
    for (const [callId, call] of this.calls) {
      if (callId === acceptedCallId) continue
      if (call.receiverId === receiverId && !call.active) {
        const caller = players.get(call.callerId)
        if (caller) {
          caller.setActive()
          io.to(caller.socketId).emit('call_rejected')
        }
        this.cleanupCall(callId)
      }
    }
  }

  private cleanupCall(callId: string): void {
    const call = this.calls.get(callId)
    if (!call) return

    // Clean active calls
    if (this.activeCalls.get(call.callerId) === callId) {
      this.activeCalls.delete(call.callerId)
    }
    if (this.activeCalls.get(call.receiverId) === callId) {
      this.activeCalls.delete(call.receiverId)
    }

    // Clean pending outgoing
    if (this.pendingOutgoing.get(call.callerId) === callId) {
      this.pendingOutgoing.delete(call.callerId)
    }

    this.calls.delete(callId)
  }
}
