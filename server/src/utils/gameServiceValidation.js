import {
  actionDefinitions,
  ROLL_DICE,
  END_TURN,
  actions,
  tiles,
  LAST_TILE,
  FINISH_MAX_TOKENS,
} from '../constants/general.js'
import { validateAction } from '../utils/actionsValidator.js'

const validateEndOfGame = (game) => {
  const finishTile = game.path[LAST_TILE]

  if (finishTile.tokens.length === 0) return false

  if (Object.keys(game.players).length > 2) {
    return finishTile.tokens.length === FINISH_MAX_TOKENS
  }

  const playerTokenTotalMap = finishTile.tokens.reduce((accumulator, token) => {
    const newAccumulator = { ...accumulator }
    if (!accumulator.hasOwnProperty(token.playerId)) {
      newAccumulator[token.playerId] = 0
    }
    return {
      ...newAccumulator,
      [token.playerId]: newAccumulator[token.playerId] + 1,
    }
  }, {})

  let max = 0
  let highestPlayer
  for (const player in playerTokenTotalMap) {
    if (playerTokenTotalMap[player] > max) {
      max = playerTokenTotalMap[player]
      highestPlayer = player
    }
  }

  return max === 4
}

const validateEndOfTurn = (game) => {
  const playedDices = game.dices.filter((dice) => dice.played)
  if (playedDices.length === 4) return true

  const availableDices = game.dices.filter(
    (dice) => !dice.played && game.turn.actions[dice.value] < 2
  )
  if (availableDices.length === 0) return true

  return false
}

const validateTurn = (game, playerId) => {
  const isPlayersTurn = game.turn.playerId === playerId

  if (!isPlayersTurn) {
    throw new Error('invalid turn')
  }
}

const validateActionOptions = (data) => {
  if (!validateAction(data)) {
    throw new Error(`invalid options for action ${data.action}`)
  }

  if (
    data.action === actions.REPEAT &&
    !validateAction({ ...data.targetActionOptions, action: data.targetAction })
  ) {
    throw new Error(`invalid options for action ${data.action}`)
  }
}

const actionPlayedCount = (action, dices) =>
  dices.filter(
    (dice) =>
      (dice.played && dice.value === action) ||
      (dice.value === actions.REPEAT && dice.repeatValue === action)
  ).length

const getDiceToPlay = (dices, action) => dices.find((dice) => dice.value === action && !dice.played)

const validateActionAvailability = (action, game, targetAction) => {
  if (action === END_TURN) return

  if (action === ROLL_DICE) {
    if (game.turn.rolls >= 2) {
      throw new Error('dices cannot be rolled more than two times')
    }
    return
  }

  if (actionPlayedCount(action, game.dices) >= 2) {
    throw new Error(`${action} action has already been played twice`)
  }

  if (!getDiceToPlay(game.dices, action)) {
    throw new Error(`${action} action is not available`)
  }
}

const validateActionName = (action) => {
  const valid = Object.keys(actionDefinitions).includes(action)

  if (!valid) {
    throw new Error(`invalid action ${action}`)
  }
}

const validateTokenAndTileIndex = (tileIndex, tokenIndex, path) => {
  return path[tileIndex].tokens.length > 0 && tokenIndex < path[tileIndex].tokens.length
}

export {
  validateTurn,
  validateEndOfTurn,
  validateEndOfGame,
  validateActionOptions,
  validateActionAvailability,
  validateActionName,
  validateTokenAndTileIndex,
  actionPlayedCount,
}
