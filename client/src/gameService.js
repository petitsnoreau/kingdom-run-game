import * as apiService from './apiService.js'
import { isConnected } from './socketService.js'
import {
  addMessageToHistory,
  saveGameToStorage,
  removeGameFromStorage,
  clearStorage,
} from './utils.js'
import { sendMessage } from './socketService.js'

const prepareRepeatMessage = (commandArguments) => {
  if (commandArguments.length < 2) {
    throw new Error(`ERROR: repeat requires at least 2 arguments`)
  }

  const { action: remove, ...gameMessage } = prepareMessageForGame(
    commandArguments[0],
    commandArguments.slice(1)
  )

  return { action: 'repeat', targetAction: commandArguments[0], targetActionOptions: gameMessage }
}

const prepareBootMessage = (commandArguments) => {
  let gameMessage = { action: 'boot' }

  if (commandArguments.length < 2) {
    throw new Error(`ERROR: boot requires at least 2 arguments`)
  }

  if (commandArguments.length > 5) {
    throw new Error(`ERROR: water requires at most 5 arguments`)
  }

  gameMessage['targetTile'] = parseInt(commandArguments[0])
  gameMessage['tokenIndexList'] = commandArguments.slice(1).map((argument) => parseInt(argument))

  return gameMessage
}

const actionMap = {
  repeat: {
    customFunction: prepareRepeatMessage,
  },
  points: {
    totalArguments: 1,
    type: 'string',
    argumentToPropertyList: ['targetPlayer'],
  },
  water: {
    totalArguments: 2,
    type: 'number',
    argumentToPropertyList: ['targetTile', 'targetTokenIndex'],
  },
  sleep: {
    totalArguments: 2,
    type: 'number',
    argumentToPropertyList: ['targetTile', 'targetTokenIndex'],
  },
  grapple: {
    totalArguments: 2,
    type: 'number',
    argumentToPropertyList: ['targetTile', 'targetTokenIndex'],
  },
  boot: {
    customFunction: prepareBootMessage,
  },
}

const prepareMessageForGame = (action, commandArguments) => {
  const actionDefinition = actionMap[action]
  const minArguments = actionDefinition.minArguments
  const maxArguments = actionDefinition.maxArguments
  const totalArguments = actionDefinition.totalArguments

  let gameMessage = {}

  if (
    (minArguments && commandArguments.length < minArguments) ||
    (totalArguments && commandArguments.length < totalArguments)
  ) {
    throw new Error(
      `ERROR: ${action} requires ${minArguments ? minArguments : totalArguments} arguments`
    )
  }

  if (maxArguments && commandArguments.length > maxArguments) {
    throw new Error(`ERROR: ${action} takes ${maxArguments} arguments`)
  }

  if (actionDefinition.hasOwnProperty('customFunction')) {
    gameMessage = actionDefinition.customFunction(commandArguments)
    if (gameMessage) return gameMessage
  }

  gameMessage.action = action
  actionDefinition.argumentToPropertyList.forEach((argumentToProperty, index) => {
    const parsedArgument =
      actionDefinition.type === 'number'
        ? parseInt(commandArguments[index])
        : commandArguments[index]

    gameMessage[argumentToProperty] = parsedArgument
  })

  return gameMessage
}

const actionCommand = (name, commandArguments, state) => {
  let gameMessage = {}
  try {
    gameMessage = prepareMessageForGame(name, commandArguments.slice(1))
  } catch (error) {
    return addMessageToHistory(state, error.message)
  }

  sendMessage(gameMessage)
  return state
}

const rollDicesCommand = (commandArguments, state) => {
  if (state.gameState.status !== 'started') {
    return addMessageToHistory(state, `ERROR: game not started`)
  }

  if (commandArguments < 2) {
    return addMessageToHistory(state, `ERROR: roll command takes at least two arguments`)
  }

  dices = commandArguments
    .slice(1)
    .slice(0, 4)
    .map((dice) => parseInt(dice))

  sendMessage({
    action: 'rollDice',
    dices: dices,
  })

  return state
}

const startGameCommand = async (commandArguments, state) => {
  if (commandArguments.length < 2) {
    return addMessageToHistory(state, `ERROR: start command takes one argument`)
  }

  if (!isConnected()) {
    return addMessageToHistory(state, `ERROR: socket not connected to game server`)
  }

  let response

  try {
    response = await apiService.startGame(commandArguments[1])
  } catch (error) {
    return addMessageToHistory(state, error.message)
  }

  return addMessageToHistory(state, `Started game ${commandArguments[1]}`)
}

const joinGameCommand = async (commandArguments, state) => {
  if (state.playerId) {
    return addMessageToHistory(
      state,
      `ERROR: cannot join game ${commandArguments[1]}, already in a game`
    )
  }

  if (commandArguments.length < 2) {
    return addMessageToHistory(state, `ERROR: join command takes one argument`)
  }

  let response

  try {
    response = await apiService.joinGame(commandArguments[1])
  } catch (error) {
    return addMessageToHistory(state, error.message)
  }

  return {
    ...addMessageToHistory(
      state,
      `Joined game ${commandArguments[1]}. PLAYER ID: ${response.playerId}`
    ),
    ...saveGameToStorage(response.game.id, response.playerId, state),
    gameState: response.game,
    playerId: response.playerId,
  }
}

const createGameCommand = async (commandArguments, state) => {
  if (state.playerId) {
    return addMessageToHistory(state, `ERROR: cannot create game, already in a game`)
  }

  let response

  try {
    response = await apiService.createGame()
  } catch (error) {
    return addMessageToHistory(state, error.message)
  }

  return {
    ...addMessageToHistory(
      state,
      `Game created. ID: ${response.game.id}, PLAYER ID: ${response.playerId}`
    ),
    ...saveGameToStorage(response.game.id, response.playerId, state),
    gameState: response.game,
    playerId: response.playerId,
  }
}

const listSavedGamesCommand = (commandArguments, state) => {
  if (state.games.length === 0) {
    return { ...addMessageToHistory(state, 'No saved games') }
  }

  let updatedState = { ...state }
  state.games
    .map((game) => {
      return `Game id: ${game.id}, player id: ${game.playerId}`
    })
    .forEach((line) => {
      updatedState = addMessageToHistory(updatedState, line)
    })

  return updatedState
}

const endTurnCommand = (commandArguments, state) => {
  sendMessage({
    action: 'endTurn',
  })

  return state
}

const clearStorageCommand = (commandArguments, state) => {
  return addMessageToHistory(clearStorage(state), 'Games cleared')
}

const chatCommand = (commandArguments, state) => {
  sendMessage({ chat: commandArguments.slice(1).join(' ') })

  return state
}

const resumeGameCommand = async (commandArguments, state) => {
  if (commandArguments.length < 2) {
    return addMessageToHistory(state, `ERROR: resume command requires 1 argument`)
  }

  if (state.playerId) {
    return addMessageToHistory(
      state,
      `ERROR: cannot resume game ${commandArguments[1]}, already in a game`
    )
  }

  const gameId = commandArguments[1]
  const playerId = state.games.find((game) => game.id === gameId).playerId

  let response

  try {
    response = await apiService.getGame(gameId)
  } catch (error) {
    return addMessageToHistory(state, error.message)
  }

  const game = response.game
  if (game.status === 'started' || Object.keys(game.players).length === 0) {
    return {
      ...removeGameFromStorage(gameId, addMessageToHistory(state, 'Cannot resume')),
    }
  }

  return { ...state, playerId: playerId, gameState: game }
}

// Api functions

const executeCommand = async (state, command) => {
  const commandArguments = command.trim().split(' ')
  const commandName = commandArguments[0]
  let historyMessage = ''
  let newState = {}

  const commandMap = {
    create: createGameCommand,
    join: joinGameCommand,
    start: startGameCommand,
    roll: rollDicesCommand,
    action: actionCommand,
    list: listSavedGamesCommand,
    clear: clearStorageCommand,
    resume: resumeGameCommand,
    endturn: endTurnCommand,
    chat: chatCommand,
    points: (commandArguments, state) => {
      return actionCommand('points', commandArguments, state)
    },
    boot: (commandArguments, state) => {
      return actionCommand('boot', commandArguments, state)
    },
    water: (commandArguments, state) => {
      return actionCommand('water', commandArguments, state)
    },
    grapple: (commandArguments, state) => {
      return actionCommand('grapple', commandArguments, state)
    },
    sleep: (commandArguments, state) => {
      return actionCommand('sleep', commandArguments, state)
    },
    repeat: (commandArguments, state) => {
      return actionCommand('repeat', commandArguments, state)
    },
  }

  if (!commandMap.hasOwnProperty(commandName)) {
    return addMessageToHistory(state, `ERROR: invalid command ${command}`)
  } else {
    return await commandMap[commandName](commandArguments, state)
  }
}

export { executeCommand, prepareMessageForGame }
