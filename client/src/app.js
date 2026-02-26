import { app } from 'hyperapp'

import { appView } from './view.js'
import { listenForSocketMessages } from './subscriptions.js'
import { handleGameMessage } from './actions.js'
import { loadGamesFromStorage } from './utils.js'

app({
  init: {
    games: loadGamesFromStorage(),
    playerId: undefined,
    gameState: {
      dices: [],
      players: {},
      turn: {},
    },
    gameHistory: [],
    commandLine: {
      currentIndex: -1,
      history: [],
      value: '',
    },
  },
  subscriptions: (state) => [
    state.playerId !== undefined && [
      listenForSocketMessages,
      {
        gameId: state.gameState.id,
        playerId: state.playerId,
        action: handleGameMessage,
      },
    ],
  ],
  view: appView,
  node: document.body,
})
