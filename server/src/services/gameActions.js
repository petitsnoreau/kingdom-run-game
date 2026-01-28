import { actions, ROLL_DICE, END_TURN, LAST_TILE, tiles } from './../constants/general.js'
import { shuffleList, getRandomNumber } from './../utils/utils.js'
import {
  validateTokenAndTileIndex,
  validateActionOptions,
  actionPlayedCount,
} from '../utils/gameServiceValidation.js'
import {
  updateTileInPath,
  updateTokenInTile,
  addTokenToTile,
  removeTokensFromTile,
  moveTokenToTile,
  getNextWaterTile,
  getNextAvailableTile,
  getNextOccupiedTile,
} from '../utils/pathHelper.js'

let actionMap = {}

const getNext = (next, game, options) => {
  if (next.length === 0) {
    return game
  }

  return next[0](game, options, next.slice(1))
}

const rollDices = (game, options, playerId, next) => {
  const actionNames = Object.values(actions)
  const dices = game.dices

  if (!options.dices.every((index) => dices[index].rolls < 2)) {
    throw new Error('roll dice action invalid, a dice has already been rolled twice')
  }

  if (!options.dices.every((index) => !dices[index].played)) {
    throw new Error('roll dice action invalid, a dice has already been played')
  }

  let rolledDices = []
  ;[...Array(4).keys()].forEach((index) => {
    if (options.dices.includes(index)) {
      rolledDices.push({
        played: false,
        value: shuffleList(actionNames)[getRandomNumber(actionNames.length)],
        rolls: dices[index].rolls + 1,
      })
    } else {
      rolledDices.push(dices[index])
    }
  })

  return getNext(
    next,
    { ...game, dices: rolledDices, turn: { ...game.turn, rolls: game.turn.rolls + 1 } },
    options
  )
}

const repeat = (game, options, playerId, next) => {
  const targetActionDiceList = game.dices.filter((dice) => dice.value === options.targetAction)

  if (
    targetActionDiceList.length === 0 ||
    actionPlayedCount(options.targetAction, game.dices) === 2
  ) {
    throw new Error(`${options.targetAction} has already been played twice, cannot be repeated`)
  }

  let updatedGame = actionMap[options.targetAction].fn(
    game,
    options.targetActionOptions,
    playerId,
    []
  )

  const repeatActionDiceIndex = game.dices.findIndex((dice) => dice.value === options.targetAction)
  let updatedDices = [...game.dices]
  updatedDices[repeatActionDiceIndex].repeatValue = options.targetAction

  return getNext(next, updatedGame, options)
}

const boot = (game, options, playerId, next) => {
  let newTileIndex = options.targetTile // we start looking right after targetTile for space
  let updatedPath = [...game.path]
  const targetTile = game.path[options.targetTile]

  if (targetTile.type === tiles.WATER) {
    throw new Error('invalid boot action')
  }

  // each token on a separate next available tile

  options.tokenIndexList.forEach((tokenIndex) => {
    newTileIndex = getNextAvailableTile(updatedPath, newTileIndex + 1)
    if (newTileIndex === -1 || !targetTile.tokens[tokenIndex].awake) {
      throw new Error('invalid boot action')
    } else {
      const tileToUpdate = updatedPath[newTileIndex]

      updatedPath = updateTileInPath(
        addTokenToTile(targetTile.tokens[tokenIndex], tileToUpdate),
        newTileIndex,
        updatedPath
      )

      if (newTileIndex === LAST_TILE) {
        newTileIndex = LAST_TILE - 1
      }
    }
  })

  updatedPath = updateTileInPath(
    removeTokensFromTile(options.tokenIndexList, targetTile),
    options.targetTile,
    updatedPath
  )

  return getNext(next, { ...game, path: updatedPath }, options)
}

const grapple = (game, options, playerId, next) => {
  const targetTile = options.targetTile
  const targetTokenIndex = options.targetTokenIndex
  const targetToken = game.path[targetTile].tokens[targetTokenIndex]

  let newTileIndex = getNextOccupiedTile(game.path, targetTile + 1)
  if (game.path[newTileIndex].tokens.length === game.path[newTileIndex].length) {
    newTileIndex = getNextAvailableTile(game.path, newTileIndex + 1)
  }

  if (
    !validateTokenAndTileIndex(targetTile, targetTokenIndex, game.path) ||
    newTileIndex === -1 ||
    !targetToken.awake
  ) {
    throw new Error('invalid grapple action')
  }

  return getNext(
    next,
    {
      ...game,
      path: moveTokenToTile(targetTile, targetTokenIndex, game.path, newTileIndex),
    },
    options
  )
}

const goToOrLeaveWater = (game, options, playerId, next) => {
  const targetTile = options.targetTile
  const targetTokenIndex = options.targetTokenIndex
  const tile = game.path[targetTile]

  let updatedPath

  if (
    validateTokenAndTileIndex(targetTile, targetTokenIndex, game.path) &&
    tile.tokens[targetTokenIndex].awake
  ) {
    if (tile.type === tiles.WATER) {
      const nextTileIndex = getNextAvailableTile(game.path, targetTile + 1)
      if (nextTileIndex >= 0) {
        updatedPath = moveTokenToTile(targetTile, targetTokenIndex, game.path, nextTileIndex)
      }
    } else {
      const waterTile = getNextWaterTile(game.path, targetTile)
      if (waterTile >= 0) {
        updatedPath = moveTokenToTile(targetTile, targetTokenIndex, game.path, waterTile)
      }
    }
  }

  if (!updatedPath) {
    throw new Error('invalid water action')
  }

  return getNext(next, { ...game, path: updatedPath }, options)
}

const sleepOrWake = (game, options, playerId, next) => {
  const targetTile = options.targetTile
  const targetTokenIndex = options.targetTokenIndex
  const tile = game.path[targetTile]
  const targetToken = tile.tokens[targetTokenIndex]

  if (!validateTokenAndTileIndex(targetTile, targetTokenIndex, game.path)) {
    throw new Error('invalid options for sleep action')
  }

  return getNext(
    next,
    {
      ...game,
      path: updateTileInPath(
        updateTokenInTile(
          { ...targetToken, awake: targetToken.awake ? false : true },
          targetTokenIndex,
          tile
        ),
        targetTile,
        game.path
      ),
    },
    options
  )
}

const takePoints = (game, options, playerId, next) => {
  const targetPlayer = options.targetPlayer

  if (game.players[targetPlayer].points === 0) {
    throw new Error(`player ${targetPlayer} does not have enough points`)
  }

  const players = {
    ...game.players,
    [targetPlayer]: {
      ...game.players[targetPlayer],
      points: game.players[targetPlayer].points - 2,
    },
    [playerId]: { ...game.players[playerId], points: game.players[playerId].points + 2 },
  }

  return getNext(next, { ...game, players: players }, options)
}

const markDiceAsPlayed = (game, options, next) => {
  const diceIndex = game.dices.findIndex((dice) => dice.value === options.action && !dice.played)

  return getNext(
    next,
    {
      ...game,
      dices: game.dices.map((dice, index) => {
        return index === diceIndex ? { ...dice, played: true } : dice
      }),
    },
    options
  )
}

const endTurn = (game, options, playerId, next) => {
  return getNext(
    next,
    {
      ...game,
      dices: game.dices.map((dice) => {
        return { ...dice, played: true }
      }),
    },
    options
  )
}

const incrementAction = (game, options, next) => {
  return getNext(
    next,
    {
      ...game,
      turn: {
        ...game.turn,
        actions: { ...game.turn.actions, [options.action]: game.turn.actions[options.action] + 1 },
      },
    },
    options
  )
}

const updateDiceRepeatValue = (game, options, next) => {
  const diceIndex = game.dices.findIndex(
    (dice) => dice.value === actions.REPEAT && dice.repeatValue === ''
  )

  return getNext(
    next,
    {
      ...game,
      dices: game.dices.map((dice, index) => {
        return index === diceIndex ? { ...dice, repeatValue: options.targetAction } : dice
      }),
    },
    options
  )
}

const defaultActionCalls = [markDiceAsPlayed, incrementAction]

actionMap = {
  [ROLL_DICE]: { fn: rollDices, next: [] },
  [actions.POINTS]: {
    fn: takePoints,
    next: defaultActionCalls,
  },
  [actions.WATER]: {
    fn: goToOrLeaveWater,
    next: defaultActionCalls,
  },
  [actions.SLEEP]: {
    fn: sleepOrWake,
    next: defaultActionCalls,
  },
  [actions.GRAPPLE]: {
    fn: grapple,
    next: defaultActionCalls,
  },
  [actions.BOOT]: {
    fn: boot,
    next: defaultActionCalls,
  },
  [actions.REPEAT]: {
    fn: repeat,
    next: [updateDiceRepeatValue, ...defaultActionCalls],
  },
  [END_TURN]: {
    fn: endTurn,
    next: [],
  },
}

const doAction = (game, options, playerId) => {
  const action = actionMap[options.action]

  return action.fn(game, options, playerId, action.next)
}

export { doAction }
