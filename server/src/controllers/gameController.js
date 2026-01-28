import StatusCodes from 'http-status-codes'

import * as gameService from '../services/gameService.js'
import * as gameDataService from '../services/gameDataService.js'
import { statuses } from '../constants/general.js'

const handleAction = (action, game) => {
  switch (action) {
    case 'join':
      return joinGame(game)
      break
    case 'start':
      return startGame(game)
      break
    default:
      throw new Error()
  }
}

const joinGame = (game) => {
  if (!gameIsOpen(game)) {
    throw new Error()
  }

  return gameService.addPlayer(game)
}

const startGame = (game) => {
  if (!gameCanStart(game)) {
    throw new Error()
  }

  return gameService.start(game)
}

const getGameById = (id) => {
  let game

  try {
    game = gameDataService.getById(id)
  } catch (error) {
    return undefined
  }

  return game
}

const getNewPlayerId = (game) => {
  const playerIds = Object.keys(game.players)
  return playerIds[playerIds.length - 1]
}

const gameCanStart = (game) => {
  return (
    Object.keys(game.players).length > 1 &&
    Object.values(game.players).every((player) => player.connected) &&
    game.status === statuses.OPEN
  )
}

const gameIsOpen = (game) => {
  return game.status === statuses.OPEN && Object.keys(game.players).length < 4
}

// Controller functions

const getGame = async (req, res, next) => {
  const id = req.params.id

  let game = getGameById(id)
  if (!game) {
    return res.status(StatusCodes.NOT_FOUND).end()
  }

  res.json({ game: game })
}

const createGame = async (req, res, next) => {
  const game = gameService.create()

  gameDataService.save(game)

  res.json({ game: game, playerId: getNewPlayerId(game) })
}

const updateGame = async (req, res, next) => {
  const id = req.params.id
  const action = req.body.action

  let game = getGameById(id)
  if (!game) {
    return res.status(StatusCodes.NOT_FOUND).end()
  }

  try {
    game = handleAction(action, game)
  } catch (error) {
    return res.status(StatusCodes.BAD_REQUEST).end()
  }

  gameDataService.save(game)
  res.json({ game: game, playerId: getNewPlayerId(game) })
}

export { getGame, createGame, updateGame }
