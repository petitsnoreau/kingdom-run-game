import * as commandManager from './commandManager.js'
import { executeCommand } from './effects.js'
import { addMessageToHistory, prettifyData } from './utils.js'

const keysToWatch = ['Enter', 'ArrowUp', 'ArrowDown']

const checkForCommand = (state, event) => {
  if (!keysToWatch.includes(event.code)) return state

  const command = event.target.value

  if (event.code === 'Enter' && command) {
    return [
      state,
      [
        executeCommand,
        {
          state: { ...state, commandLine: commandManager.addToHistory(state.commandLine, command) },
          command: command,
          action: (state) => state,
        },
      ],
    ]
  }

  return { ...state, commandLine: commandManager.updateCommandLine(event.code, state.commandLine) }
}

const handleGameMessage = (state, data) => {
  let message

  if (data.hasOwnProperty('chat')) {
    message = data.chat
  } else {
    message = data.message ? data.message : ''
  }

  return {
    ...state,
    gameState: data.game ? data.game : state.gameState,
    gameHistory: [...state.gameHistory, message],
  }
}

export { checkForCommand, handleGameMessage }
