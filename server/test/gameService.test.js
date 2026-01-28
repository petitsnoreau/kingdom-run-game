jest.mock('../src/services/socketService.js')

jest.mock('../src/services/gameService.js', () => ({
  ...jest.requireActual('../src/services/gameService.js'),
}))

jest.mock('../src/utils/gameServiceValidation.js', () => ({
  ...jest.requireActual('../src/utils/gameServiceValidation.js'),
}))

jest.unmock('./testGameStateService.js')
jest.unmock('../src/utils/actionsValidator.js')
jest.unmock('../src/constants/general.js')
jest.unmock('../src/utils/gameServiceValidation.js')
jest.unmock('../src/utils/utils.js')
jest.unmock('../src/utils/pathHelper.js')
jest.unmock('../src/services/gameActions.js')
jest.unmock('../src/services/gameService.js')
jest.unmock('./gameStateData.json')
jest.unmock('./gameFinishedData.json')

import { updateGameState, getGameState } from './testGameStateService.js'

import {
  handleCommand,
  start,
  getWinner,
  getPlayerPathPoints,
} from '../src/services/gameService.js'
import * as GAME_STATE_DATA from './gameStateData.json'
import * as FINISHED_GAME_DATA from './gameFinishedData.json'
import * as socketService from '../src/services/socketService.js'
import { updateFinishTiles } from '../src/utils/pathHelper.js'
import { validateEndOfGame } from '../src/utils/gameServiceValidation.js'
import { LAST_TILE } from '../src/constants/general.js'

test('roll dice', () => {
  const playerId = 'player1'

  let gameState = {
    ...GAME_STATE_DATA,
    turn: { ...GAME_STATE_DATA.turn, playerId: playerId, rolls: 0 },
    dices: Array(4).fill({ value: '', rolls: 0, played: false, repeatValue: '' }),
  }

  updateGameState(gameState)

  const spy = jest.spyOn(socketService, 'sendMessageToPlayer')

  handleCommand(gameState.id, playerId, {
    action: 'rollDice',
    dices: [0, 1, 2, 3],
  })

  gameState = getGameState()

  // First full roll
  expect(gameState.turn.rolls).toEqual(1)

  handleCommand(gameState.id, playerId, {
    action: 'rollDice',
    dices: [0, 1, 2, 3],
  })

  gameState = getGameState()

  // Second full roll
  expect(gameState.turn.rolls).toEqual(2)

  handleCommand(gameState.id, playerId, {
    action: 'rollDice',
    dices: [0, 1, 2, 3],
  })

  // Third full roll, invalid
  expect(spy).toHaveBeenCalledWith(
    { message: 'dices cannot be rolled more than two times' },
    'RB4bzSQUcd',
    'player1'
  )

  spy.mockRestore()
})

test('turns', () => {
  const playerId = 'player1'

  let gameState = {
    ...GAME_STATE_DATA,
    turn: { ...GAME_STATE_DATA.turn, playerId: playerId, rolls: 0 },
    dices: Array(4).fill({ value: '', rolls: 0, played: false, repeatValue: '' }),
  }

  updateGameState(gameState)

  const spy = jest.spyOn(socketService, 'sendMessageToPlayer')

  handleCommand(gameState.id, playerId, {
    action: 'points',
    targetPlayer: 'doesnotexist',
  })

  // Dices not rolled

  expect(spy).toHaveBeenCalledWith(
    { message: 'points action is not available' },
    'RB4bzSQUcd',
    'player1'
  )

  spy.mockRestore()

  gameState = {
    ...GAME_STATE_DATA,
    turn: { ...GAME_STATE_DATA.turn, playerId: playerId, rolls: 2 },
    dices: [
      { value: 'points', rolls: 0, played: true, repeatValue: '' },
      { value: 'points', rolls: 0, played: true, repeatValue: '' },
      { value: 'water', rolls: 0, played: true, repeatValue: '' },
      { value: 'repeat', rolls: 0, played: false, repeatValue: '' },
    ],
  }

  updateGameState(gameState)

  handleCommand(gameState.id, playerId, {
    action: 'repeat',
    targetAction: 'water',
    targetActionOptions: {
      targetTile: 0,
      targetTokenIndex: 0,
    },
  })

  // Last action played, give turn to next player

  gameState = getGameState()
  expect(gameState.turn.playerId).toEqual('player2')
  expect(gameState.turn.rolls).toEqual(0)

  gameState = {
    ...gameState,
    dices: [
      { value: 'boot', rolls: 0, played: true, repeatValue: '' },
      { value: 'points', rolls: 0, played: true, repeatValue: '' },
      { value: 'water', rolls: 0, played: true, repeatValue: '' },
      { value: 'repeat', rolls: 0, played: false, repeatValue: '' },
    ],
  }

  updateGameState(gameState)

  handleCommand(gameState.id, 'player2', {
    action: 'repeat',
    targetAction: 'points',
    targetActionOptions: {
      targetPlayer: 'player1',
    },
  })

  // Same thing, this time after player2 comes player1

  gameState = getGameState()
  expect(gameState.turn.playerId).toEqual('player1')
  expect(gameState.turn.rolls).toEqual(0)

  gameState = {
    ...GAME_STATE_DATA,
    turn: { ...GAME_STATE_DATA.turn, playerId: 'player1', rolls: 1 },
    dices: [
      { value: 'points', rolls: 0, played: true, repeatValue: '' },
      { value: 'points', rolls: 0, played: true, repeatValue: '' },
      { value: 'water', rolls: 0, played: true, repeatValue: '' },
      { value: 'repeat', rolls: 0, played: false, repeatValue: '' },
    ],
  }

  updateGameState(gameState)

  handleCommand(gameState.id, gameState.turn.playerId, {
    action: 'endTurn',
  })

  // Player ends turn, but could still play

  gameState = getGameState()
  expect(gameState.turn.playerId).toEqual('player2')
  expect(gameState.turn.rolls).toEqual(0)

  spy.mockRestore()
})

test('end of game', () => {
  let gameState = {
    ...GAME_STATE_DATA,
  }

  gameState.path[LAST_TILE].tokens = [
    { playerId: 'player1' },
    { playerId: 'player1' },
    { playerId: 'player1' },
    { playerId: 'player1' },
    { playerId: 'player2' },
    { playerId: 'player2' },
  ]

  // Two players, 4 tokens from same player needed
  let gameEnded = validateEndOfGame(gameState)
  expect(gameEnded).toBeTruthy()

  gameState.players = {
    player1: {},
    player2: {},
    player3: {},
  }
  gameState.path[LAST_TILE].tokens = [
    { playerId: 'player1' },
    { playerId: 'player1' },
    { playerId: 'player1' },
    { playerId: 'player1' },
    { playerId: 'player2' },
    { playerId: 'player2' },
    { playerId: 'player3' },
  ]

  // Three players, 7 tokens in finish tile
  gameEnded = validateEndOfGame(gameState)
  expect(gameEnded).toBeFalsy()

  gameState.path[LAST_TILE].tokens = [
    { playerId: 'player1' },
    { playerId: 'player1' },
    { playerId: 'player1' },
    { playerId: 'player1' },
    { playerId: 'player2' },
    { playerId: 'player2' },
    { playerId: 'player3' },
    { playerId: 'player3' },
  ]

  // Three players, 8 tokens in finish tile
  gameEnded = validateEndOfGame(gameState)
  expect(gameEnded).toBeTruthy()
})

test('start', () => {
  const playerId = 'player1'

  let gameState = {
    ...GAME_STATE_DATA,
    turn: {},
    dices: Array(4).fill({ value: '', rolls: 0, played: false, repeatValue: '' }),
  }

  gameState = start(gameState)

  expect(gameState.status).toEqual('started')
  expect(gameState.turn.playerId).toEqual(Object.keys(gameState.players)[0])
  gameState.path.slice(0, 4).forEach((tile) => {
    expect(tile.tokens.length).toEqual(4)
  })
})

test('player path points', () => {
  let playerPathPoints = getPlayerPathPoints(FINISHED_GAME_DATA, 'player1')
  expect(playerPathPoints).toEqual(29)

  playerPathPoints = getPlayerPathPoints(FINISHED_GAME_DATA, 'player2')
  expect(playerPathPoints).toEqual(31)

  playerPathPoints = getPlayerPathPoints(FINISHED_GAME_DATA, 'player3')
  expect(playerPathPoints).toEqual(21)

  playerPathPoints = getPlayerPathPoints(FINISHED_GAME_DATA, 'player4')
  expect(playerPathPoints).toEqual(15)
})

test('end of game winner', () => {
  const winner = getWinner({
    ...FINISHED_GAME_DATA,
    players: {
      player1: {
        ...FINISHED_GAME_DATA.players.player1,
        pathPoints: getPlayerPathPoints(FINISHED_GAME_DATA, 'player1'),
      },
      player2: {
        ...FINISHED_GAME_DATA.players.player2,
        pathPoints: getPlayerPathPoints(FINISHED_GAME_DATA, 'player2'),
      },
      player3: {
        ...FINISHED_GAME_DATA.players.player3,
        pathPoints: getPlayerPathPoints(FINISHED_GAME_DATA, 'player3'),
      },
      player4: {
        ...FINISHED_GAME_DATA.players.player4,
        pathPoints: getPlayerPathPoints(FINISHED_GAME_DATA, 'player4'),
      },
    },
  })

  expect(winner.playerId).toEqual('player2')
})

test('update finish tiles', () => {
  let updatedGame = JSON.parse(JSON.stringify(GAME_STATE_DATA))
  updatedGame.path[LAST_TILE] = {
    tokens: [{ test: 0 }, { test: 0 }, { test: 0 }, { test: 0 }],
  }

  updatedGame = updateFinishTiles(updatedGame)
  expect(updatedGame.path[LAST_TILE - 1].tokens.length).toEqual(0)

  updatedGame.path[LAST_TILE] = {
    tokens: [{ test: 0 }, { test: 0 }, { test: 0 }, { test: 0 }, { test: 0 }],
  }

  updatedGame = updateFinishTiles(updatedGame)

  expect(updatedGame.path[LAST_TILE - 1].tokens.length).toEqual(1)
  expect(updatedGame.path[LAST_TILE].tokens.length).toEqual(4)

  updatedGame.path[LAST_TILE] = {
    tokens: [{ test: 0 }, { test: 0 }, { test: 0 }, { test: 0 }, { test: 0 }, { test: 0 }],
  }

  updatedGame = updateFinishTiles(updatedGame)

  expect(updatedGame.path[LAST_TILE - 1].tokens.length).toEqual(2)
  expect(updatedGame.path[LAST_TILE].tokens.length).toEqual(4)

  updatedGame.path[LAST_TILE] = {
    tokens: [{ test: 0 }, { test: 0 }, { test: 0 }, { test: 0 }, { test: 0 }, { test: 0 }, { test: 0 }, { test: 0 }],
  }

  updatedGame = updateFinishTiles(updatedGame)

  expect(updatedGame.path[LAST_TILE - 1].tokens.length).toEqual(4)
  expect(updatedGame.path[LAST_TILE].tokens.length).toEqual(4)
})
