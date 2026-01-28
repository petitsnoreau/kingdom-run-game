import { io } from 'socket.io-client'

let socket

const onConnected = () => {}

// Service functions

const isConnected = () => {
  return socket.connected
}

const init = (playerId, gameId, messageHandler) => {
  socket = io(`${process.env.API_URL}`, {
    query: { playerId: playerId, gameId: gameId },
  })
  socket.on('connect', onConnected)
  socket.on('message', messageHandler)
}

const stop = () => {
  socket.disconnect()
}

const sendMessage = (data) => {
  socket.emit('message', data)
}

export { init, isConnected, stop, sendMessage }
