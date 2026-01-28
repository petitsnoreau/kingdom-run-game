import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'

import dotenv from 'dotenv'

import { gameRoutes } from './routes/games.js'
import { init as initSocketService } from './services/socketService.js'
import { init as initGameDataService } from './services/gameDataService.js'

dotenv.config()

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
  })
)
app.use(bodyParser.json())
app.use('/api', gameRoutes)

const server = app.listen(3000, 'localhost', () => {
  startSocketService()
  startGameDataService()
  console.log('Kingdom Run server started.')
})

const startSocketService = () => {
  initSocketService(server, process.env.CLIENT_ORIGIN)
}

const startGameDataService = () => {
  initGameDataService()
}
