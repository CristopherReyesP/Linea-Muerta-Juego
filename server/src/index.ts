import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { GameManager } from './GameManager'
import { registerEvents } from './events'

const app = express()
app.use(cors())

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
})

const gameManager = new GameManager(io)
registerEvents(io, gameManager)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', games: Array.from((gameManager as any).games?.keys?.() ?? []) })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`[LINEA MUERTA] Servidor activo en puerto ${PORT}`)
})
