import { Server } from 'socket.io'

import { validatePlayerId } from './gameDataService.js'
import { handleCommand, handleLostPlayer, handlePlayerConnection } from './gameService.js'
import { prettifyData } from './../utils/utils.js'

let io
let gameRooms = {}

const handleNewConnection = (socket) => {
  const playerId = socket.handshake.query.playerId
  const gameId = socket.handshake.query.gameId

  if (!validatePlayerId(gameId, playerId)) {
    socket.disconnect(true)
    return
  }

  if (!gameRooms.hasOwnProperty(gameId)) {
    gameRooms[gameId] = {
      [playerId]: socket,
    }
  } else {
    gameRooms[gameId][playerId] = socket
  }

  socket.playerId = playerId
  socket.gameId = gameId

  socket.on('message', (data) => {
    handleMessage(gameId, playerId, data)
  })

  socket.on('disconnect', () => {
    handleLostPlayer(socket.gameId, socket.playerId)
    removePlayer(socket.gameId, socket.playerId)
  })

  socket.join(gameId)

  handlePlayerConnection(gameId, playerId)

  console.log(`Player ${playerId} connected to game ${gameId}`)
}

const handleMessage = (gameId, playerId, data) => {
  console.log(`data received from ${playerId} in game ${gameId}: ${prettifyData(data)}`)

  if (data.hasOwnProperty('chat')) {
    sendMessageToGame({ message: data.chat }, gameId)
  } else {
    handleCommand(gameId, playerId, data)
  }
}

// Service functions

const init = (httpServer, origin) => {
  io = new Server(httpServer, {
    cors: {
      origin: origin,
      methods: ['PUT', 'POST'],
    },
  })

  console.log('Socket service initialized.')

  io.on('connection', (socket) => {
    handleNewConnection(socket)
  })
}

const removeGame = (gameId) => {
  const { [gameId]: remove, ...newRoomList } = gameRooms
  gameRooms = { ...newRoomList }
}

const removePlayer = (gameId, playerId) => {
  const { [playerId]: remove, ...newGameRoom } = gameRooms[gameId]
  gameRooms = { ...gameRooms, [gameId]: newGameRoom }

  console.log(`Player ${playerId} left game ${gameId}`)
}

const sendMessageToGame = (data, gameId) => {
  io.to(gameId).emit('message', data)
}

const sendMessageToPlayer = (data, gameId, playerId) => {
  console.log(`sending message to player ${playerId} in ${gameId}`, prettifyData(data))
  gameRooms[gameId][playerId].emit('message', data)
}

export { init, sendMessageToGame, sendMessageToPlayer, removeGame }
