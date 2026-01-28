import regeneratorRuntime from 'regenerator-runtime'

jest.mock('../src/socketService.js')
jest.mock('../src/apiService.js')
jest.unmock('../src/gameService.js')

import { prepareMessageForGame } from '../src/gameService.js'
import * as STATE_DATA from './state.json'

test('should prepare appropriate message for action: points', () => {
  const message = prepareMessageForGame('points', ['player2'])
  expect(message.action).toEqual('points')
  expect(message.targetPlayer).toEqual('player2')
})

test('should prepare appropriate message for action: sleep', () => {
  const message = prepareMessageForGame('sleep', [0, 0])
  expect(message.action).toEqual('sleep')
  expect(message.targetTile).toEqual(0)
  expect(message.targetTokenIndex).toEqual(0)
})

test('should prepare appropriate message for action: water', () => {
  const message = prepareMessageForGame('water', [0, 0])
  expect(message.action).toEqual('water')
  expect(message.targetTile).toEqual(0)
  expect(message.targetTokenIndex).toEqual(0)
})

test('should prepare appropriate message for action: grapple', () => {
  const message = prepareMessageForGame('grapple', [0, 0])
  expect(message.action).toEqual('grapple')
  expect(message.targetTile).toEqual(0)
  expect(message.targetTokenIndex).toEqual(0)
})

test('should prepare appropriate message for action: boot', () => {
  const message = prepareMessageForGame('boot', [0, 0, 1, 2, 3])
  expect(message.action).toEqual('boot')
  expect(message.targetTile).toEqual(0)
  expect(message.tokenIndexList).toEqual([0, 1, 2, 3])
})

test('should prepare appropriate message for action: repeat', () => {
  let message = prepareMessageForGame('repeat', ['points', 'player2'])
  expect(message.action).toEqual('repeat')
  expect(message.targetAction).toEqual('points')
  expect(message.targetActionOptions).toEqual({ targetPlayer: 'player2' })

  message = prepareMessageForGame('repeat', ['water', 0, 0])
  expect(message.action).toEqual('repeat')
  expect(message.targetAction).toEqual('water')
  expect(message.targetActionOptions).toEqual({
    targetTile: 0,
    targetTokenIndex: 0,
  })

  message = prepareMessageForGame('repeat', ['sleep', 0, 0])
  expect(message.action).toEqual('repeat')
  expect(message.targetAction).toEqual('sleep')
  expect(message.targetActionOptions).toEqual({
    targetTile: 0,
    targetTokenIndex: 0,
  })

  message = prepareMessageForGame('repeat', ['grapple', 0, 0])
  expect(message.action).toEqual('repeat')
  expect(message.targetAction).toEqual('grapple')
  expect(message.targetActionOptions).toEqual({
    targetTile: 0,
    targetTokenIndex: 0,
  })

  message = prepareMessageForGame('repeat', ['boot', 0, 0, 1, 2, 3])
  expect(message.action).toEqual('repeat')
  expect(message.targetAction).toEqual('boot')
  expect(message.targetActionOptions).toEqual({
    targetTile: 0,
    tokenIndexList: [0, 1, 2, 3],
  })
})
