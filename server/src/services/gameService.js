import { createNewPath, getPathGridSize } from '../utils/pathCreator.js'
import * as randomString from 'randomstring'

import { colors, statuses, actions, ROLL_DICE, END_TURN } from '../constants/general.js'
import * as socketService from './socketService.js'
import * as gameDataService from './gameDataService.js'
import { updateFinishTiles } from './../utils/pathHelper.js'
import { shuffleList } from './../utils/utils.js'
import { doAction } from './gameActions.js'
import {
  validateActionAvailability,
  validateActionOptions,
  validateTurn,
  validateActionName,
  validateEndOfTurn,
  validateEndOfGame,
} from '../utils/gameServiceValidation.js'

const FINISH_TILE_POINTS_MAP = {
  0: 13,
  1: 12,
  2: 11,
  3: 10,
  4: 10,
  5: 9,
  6: 8,
  7: 7,
}

const prepareGameStateForClients = (game) => {
  return { ...updateFinishTiles(game)}
}

const refineGameState = (game) => {
  let updatedPlayers = { ...game.players }
  
  Object.values(game.players).forEach((player) => {
    updatedPlayers[player.id].pathPoints = getPlayerPathPoints(game, player.id)
  })

  return { ...game, players: updatedPlayers }
}

const getPlayerPathPoints = (game, playerId) => {
  if (game.path.length === 0) return 0

  const pathPoints = game.path.slice(0, -1).reduce((accumulator, tile) => {
    const tokenList = tile.tokens.filter((token) => token.playerId === playerId)
    if (tokenList.length > 0) {
      return tokenList.length * tile.value + accumulator
    }

    return accumulator
  }, 0)

  if (game.path[game.path.length - 1].tokens.length > 0) {
    return (
      pathPoints +
      game.path[game.path.length - 1].tokens.reduce(
        (accumulator, token, index) =>
          token.playerId === playerId ? accumulator + FINISH_TILE_POINTS_MAP[index] : accumulator,
        0
      )
    )
  }

  return pathPoints
}

const getNewToken = (color, playerId) => {
  return {
    awake: true,
    color: color,
    playerId: playerId,
  }
}

const addPlayerTokensToPath = (path, color, playerId) => {
  return [
    ...path.slice(0, 4).map((tile) => {
      return { ...tile, tokens: [...tile.tokens, getNewToken(color, playerId)] }
    }),
    ...path.slice(4),
  ]
}

const addPlayer = (game) => {
  const color = game.colors[0]
  const newPlayer = getNewPlayer(colors[color])
  const updatedPath = addPlayerTokensToPath(game.path, color, newPlayer.id)

  return {
    ...game,
    path: updatedPath,
    players: { ...game.players, [newPlayer.id]: newPlayer },
    colors: game.colors.slice(1),
  }
}

const getDices = () => {
  return Array(4).fill({ value: '', rolls: 0, played: false, repeatValue: '' })
}

const getNewPlayer = (color) => {
  const playerId = randomString.default.generate(10)
  return {
    id: playerId,
    points: 6,
    pathPoints: 0,
    color: color,
    connected: false,
  }
}

const getNewGame = () => {
  const newPath = createNewPath()
  const gridSize = getPathGridSize(newPath)

  return {
    id: randomString.default.generate(10),
    startDate: new Date(),
    path: newPath,
    gridSize: gridSize,
    dices: getDices(),
    colors: shuffleList(Object.keys(colors)),
    players: {},
    status: statuses.OPEN,
    turn: getPlayerTurn(''),
  }
}

const create = () => {
  return addPlayer(getNewGame())
}

const getFirstPlayer = (players) => {
  return players[Object.keys(players)[0]]
}

const getPlayerTurn = (playerId) => {
  let actionsMap = {}
  for (const action of Object.values(actions)) actionsMap[action] = 0

  return {
    playerId: playerId,
    rolls: 0,
    actions: actionsMap,
  }
}

const start = (game) => {
  const totalFakePlayers = 4 - Object.keys(game.players).length
  let updatedPath = game.path

  if (totalFakePlayers > 0) {
    for (let i = 0; i < totalFakePlayers; i++) {
      updatedPath = addPlayerTokensToPath(updatedPath, game.colors[i], 'fake')
    }
  }

  const newGameState = {
    ...game,
    path: updatedPath,
    status: statuses.STARTED,
    turn: getPlayerTurn(getFirstPlayer(game.players).id),
  }

  setTimeout(() => {
    socketService.sendMessageToGame({ game: newGameState }, game.id)
  }, 1000)

  return newGameState
}

const getNextTurn = (game) => {
  const playerIds = Object.keys(game.players)
  const currentPlayerIndex = playerIds.findIndex((index) => index === game.turn.playerId)

  let nextPlayerIndex = currentPlayerIndex + 1
  if (nextPlayerIndex >= playerIds.length) {
    nextPlayerIndex = 0
  }

  return getPlayerTurn(playerIds[nextPlayerIndex])
}

const getWinner = (game) => {
  let winner = ''
  let maxPoints = 0
  Object.values(game.players).forEach((player) => {
    const playerPoints = player.points + player.pathPoints
    if (playerPoints > maxPoints) {
      maxPoints = playerPoints
      winner = player.id
    }
  })

  return { playerId: winner, points: maxPoints }
}

const handleCommand = (gameId, playerId, data) => {
  let game = gameDataService.getById(gameId)

  if (!game) {
    socketService.sendMessageToPlayer({ message: `game ${gameId} not found` }, gameId, playerId)
    return
  }

  if (game.status === statuses.PAUSED) {
    socketService.sendMessageToPlayer({ message: `game ${gameId} is paused.` }, gameId, playerId)
    return
  }

  try {
    validateActionName(data.action)
    validateActionAvailability(data.action, game, data.targetAction)
    validateActionOptions(data)
    validateTurn(game, playerId)
  } catch (error) {
    socketService.sendMessageToPlayer({ message: error.message }, game.id, playerId)
    return
  }

  try {
    game = doAction(game, data, playerId)
  } catch (error) {
    socketService.sendMessageToPlayer({ message: error.message }, game.id, playerId)
    return
  }

  if (data.action !== ROLL_DICE && (data.action === END_TURN || validateEndOfTurn(game))) {
    game = { ...game, turn: getNextTurn(game), dices: getDices() }
  }

  let messageToSend = `player ${playerId} played ${data.action}`
  
  if (validateEndOfGame(game)) {
    game.status = statuses.FINISHED
    game.winner = getWinner(game)
    messageToSend = `${messageToSend}\n${game.winner.playerId} won with ${game.winner.points}`
  }

  socketService.sendMessageToGame(
    { message: messageToSend, game: prepareGameStateForClients(game) },
    game.id
  )

  gameDataService.save(refineGameState(game))
}

const handleLostPlayer = (gameId, playerId) => {
  let game = gameDataService.getById(gameId)

  if (!game) return

  if (game.status === statuses.STARTED) {
    game.status = statuses.PAUSED
    game.players[playerId].connected = false
  } else {
    const { [playerId]: remove, ...newPlayerList } = game.players
    game.players = newPlayerList
  }

  const gameEmpty = Object.values(game.players).every((player) => !player.connected)
  if (gameEmpty && game.status === statuses.OPEN) {
    gameDataService.remove(game.id)
    return
  }

  gameDataService.save(game)
  socketService.sendMessageToGame({ message: `Lost player ${playerId}`, game: game }, game.id)
}

const handlePlayerConnection = (gameId, playerId) => {
  let game = gameDataService.getById(gameId)

  if (!game) return

  game.players[playerId].connected = true

  if (
    game.status === statuses.PAUSED &&
    Object.values(game.players).every((player) => player.connected)
  ) {
    game.status = statuses.STARTED
    socketService.sendMessageToGame({ message: `${game.id} game resumed`, game: game }, gameId)
  } else {
    socketService.sendMessageToGame(
      { message: `${playerId} connected to game`, game: game },
      gameId
    )
  }

  gameDataService.save(game)
}

export {
  create,
  addPlayer,
  start,
  handleCommand,
  handleLostPlayer,
  handlePlayerConnection,
  getWinner,
  getPlayerPathPoints,
}
