import { h, text } from 'hyperapp'

import { checkForCommand } from './actions.js'
import { printPath, printDices, printPlayers, addNewLines } from './utils.js'
import { renderPathView } from './pathView.js'

// Components

const gameState = (gameState, playerId) => {
  return h('textarea', {
    class: { 'game-status': true },
    disabled: true,
    value: addNewLines([
      ...printDices(gameState.dices),
      '\n',
      ...printPlayers(gameState.players),
      `TURN: ${gameState.turn.playerId}`,
      `PLAYER ID: ${playerId}`,
      `GAME ID: ${gameState.id}`,
      `STATUS: ${gameState.status}`,
    ]),
  })
}

const gameHistory = (history) => {
  return h('textarea', {
    class: { 'game-history': true },
    disabled: true,
    value: addNewLines(history),
  })
}

const commandLine = (state) => {
  return h('input', {
    onkeyup: checkForCommand,
    autofocus: true,
    value: state.commandLine.value,
    class: { 'command-line': true },
  })
}

const appView = (state) =>
  h('main', {}, [
    h('div', { class: { 'flex-container-col': true } }, [
      h('div', { class: { 'flex-container': true } }, [
        gameHistory(state.gameHistory),
        h('div', { class: { 'flex-container-col': true } }, [
          state.gameState && state.gameState.path && renderPathView(state.gameState),
          gameState(state.gameState, state.playerId),
        ]),
      ]),
      commandLine(state),
    ]),
  ])

export { appView }
