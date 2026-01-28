import * as GAME_STATE_DATA from './gameStateData.json'
import { getNextAvailableTile } from '../src/utils/pathHelper.js'

jest.disableAutomock()

test('next available tile', () => {
  let path = JSON.parse(JSON.stringify(GAME_STATE_DATA)).path

  path[4].tokens = [{ awake: true, color: 'yellow', playerId: 'player2' }]
  let nextAvailableTile = getNextAvailableTile(path, 4)
  expect(nextAvailableTile).toEqual(4)

  path[4].tokens = []
  nextAvailableTile = getNextAvailableTile(path, 4)
  expect(nextAvailableTile).toEqual(4)

  path[4].tokens = [
    { awake: true, color: 'yellow', playerId: 'player2' },
    { awake: true, color: 'yellow', playerId: 'player2' },
  ]
  path[5].tokens = [
    { awake: true, color: 'red', playerId: 'player1' },
    { awake: true, color: 'red', playerId: 'player1' },
  ]
  nextAvailableTile = getNextAvailableTile(path, 5)
  expect(nextAvailableTile).toEqual(5)

  path[4].tokens = [
    { awake: true, color: 'red', playerId: 'player1' },
    { awake: true, color: 'red', playerId: 'player1' },
    { awake: true, color: 'yellow', playerId: 'player2' },
    { awake: true, color: 'yellow', playerId: 'player2' },
  ]
  path[5].tokens = [
    { awake: true, color: 'red', playerId: 'player1' },
    { awake: true, color: 'red', playerId: 'player1' },
  ]
  nextAvailableTile = getNextAvailableTile(path, 4)
  expect(nextAvailableTile).toEqual(5)
})
