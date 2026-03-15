import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import path from 'path'
import { GameManager } from './GameManager'
import { registerEvents } from './events'

const app = express()
app.use(cors())

const httpServer = createServer(app)

const isProduction = process.env.NODE_ENV === 'production'

const io = new Server(httpServer, {
  cors: isProduction ? undefined : {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
})

const gameManager = new GameManager(io)
registerEvents(io, gameManager)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', games: Array.from((gameManager as any).games?.keys?.() ?? []) })
})

// In production, serve the client build
if (isProduction) {
  const clientPath = path.join(__dirname, '../../client/dist')
  app.use(express.static(clientPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'))
  })
}

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`[LINEA MUERTA] Servidor activo en puerto ${PORT} (${isProduction ? 'produccion' : 'desarrollo'})`)
})
