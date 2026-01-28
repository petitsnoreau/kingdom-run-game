import * as GAME_STATE_DATA from './gameStateData.json'
import { doAction } from '../src/services/gameActions.js'
import { LAST_TILE } from '../src/constants/general.js'

jest.disableAutomock()

test('action roll dice', () => {
  let updatedGame = doAction(
    {
      ...GAME_STATE_DATA,
      dices: Array(4).fill({ value: '', rolls: 0, played: false, repeatValue: '' }),
    },
    { action: 'rollDice', dices: [0, 1, 2, 3] },
    'player1'
  )

  updatedGame.dices.map((dice) => {
    expect(dice.rolls).toEqual(1)
  })

  updatedGame = doAction(
    {
      ...GAME_STATE_DATA,
      dices: Array(4).fill({ value: '', rolls: 1, played: false, repeatValue: '' }),
    },
    { action: 'rollDice', dices: [0, 1, 2, 3] },
    'player1'
  )

  updatedGame.dices.map((dice) => {
    expect(dice.rolls).toEqual(2)
  })

  expect(() =>
    doAction(
      {
        ...GAME_STATE_DATA,
        dices: Array(4).fill({ value: '', rolls: 2, played: false, repeatValue: '' }),
      },
      { action: 'rollDice', dices: [0, 1, 2, 3] },
      'player1'
    )
  ).toThrow()

  // One dice has been played, invalid

  expect(() =>
    doAction(
      {
        ...GAME_STATE_DATA,
        dices: [
          { value: '', rolls: 0, played: false, repeatValue: '' },
          { value: '', rolls: 0, played: false, repeatValue: '' },
          { value: '', rolls: 0, played: false, repeatValue: '' },
          { value: 'water', rolls: 1, played: true, repeatValue: '' },
        ],
      },
      { action: 'rollDice', dices: [0, 1, 2, 3] },
      'player1'
    )
  ).toThrow('roll dice action invalid, a dice has already been played')
})

test('action points', () => {
  const updatedGame = doAction(
    { ...GAME_STATE_DATA, players: { player1: { points: 2 }, player2: { points: 2 } } },
    { action: 'points', targetPlayer: 'player2' },
    'player1'
  )

  expect(updatedGame.players['player1'].points).toEqual(4)
  expect(updatedGame.players['player2'].points).toEqual(0)

  expect(() => {
    doAction(
      { players: { player1: { points: 2 }, player2: { points: 0 } } },
      { action: 'points', targetPlayer: 'player2' },
      'player1'
    )
  }).toThrow()
})

test('action sleep', () => {
  let updatedGame = doAction(
    { ...GAME_STATE_DATA },
    { action: 'sleep', targetTile: 0, targetTokenIndex: 1 },
    'player2'
  )

  expect(updatedGame.path[0].tokens[1].awake).toBeFalsy()

  updatedGame = doAction(
    updatedGame,
    { action: 'sleep', targetTile: 0, targetTokenIndex: 1 },
    'player2'
  )

  expect(updatedGame.path[0].tokens[1].awake).toBeTruthy()
})

test('action water', () => {
  let updatedGame = doAction(
    { ...GAME_STATE_DATA },
    { action: 'water', targetTile: 0, targetTokenIndex: 0 },
    'player1'
  )

  expect(updatedGame.path[6].tokens.length).toEqual(1)

  updatedGame = doAction(
    updatedGame,
    { action: 'water', targetTile: 6, targetTokenIndex: 0 },
    'player1'
  )

  expect(updatedGame.path[7].tokens.length).toEqual(1)

  updatedGame.path[12].tokens = [{ awake: true, color: 'yellow', playerId: 'player1' }]
  expect(() =>
    doAction(updatedGame, { action: 'water', targetTile: 12, targetTokenIndex: 0 }, 'player1')
  )
})

test('action grapple', () => {
  let updatedGame = doAction(
    JSON.parse(JSON.stringify(GAME_STATE_DATA)),
    { action: 'grapple', targetTile: 0, targetTokenIndex: 0 },
    'player1'
  )

  // Two tokens on first tile: 1 on first and 3 and second

  expect(updatedGame.path[0].tokens.length).toEqual(1)
  expect(updatedGame.path[1].tokens.length).toEqual(3)

  const gameData = JSON.parse(JSON.stringify(GAME_STATE_DATA))
  gameData.path[0].tokens = [{ awake: false, color: 'blue', playerId: 'player1' }]

  // Cannot grapple with sleeping token

  expect(() => {
    doAction(gameData, { action: 'grapple', targetTile: 0, targetTokenIndex: 0 }, 'player1')
  }).toThrow()

  updatedGame.path[4].tokens = [{ awake: true, color: 'yellow', playerId: 'player1' }]
  updatedGame.path[5].tokens = [
    { awake: true, color: 'yellow', playerId: 'player1' },
    { awake: true, color: 'red', playerId: 'player2' },
    { awake: true, color: 'green', playerId: 'player3' },
    { awake: true, color: 'blue', playerId: 'player4' },
  ]
  updatedGame.path[6].tokens = []

  updatedGame = doAction(
    {
      ...updatedGame,
      dices: [
        { value: '', rolls: 0, played: false, repeatValue: '' },
        { value: '', rolls: 0, played: false, repeatValue: '' },
        { value: '', rolls: 0, played: false, repeatValue: '' },
        { value: 'grapple', rolls: 0, played: false, repeatValue: '' },
      ],
    },
    { action: 'grapple', targetTile: 4, targetTokenIndex: 0 },
    'player1'
  )

  // Grappled token in full tile, lands on next

  expect(updatedGame.path[4].tokens.length).toEqual(0)
  expect(updatedGame.path[6].tokens.length).toEqual(1)
  expect(updatedGame.path[6].tokens[0]).toEqual({
    awake: true,
    color: 'yellow',
    playerId: 'player1',
  })

  updatedGame.path[4].tokens = [{ awake: true, color: 'yellow', playerId: 'player1' }]
  updatedGame.path[5].tokens = [
    { awake: true, color: 'yellow', playerId: 'player1' },
    { awake: true, color: 'red', playerId: 'player2' },
    { awake: true, color: 'green', playerId: 'player3' },
    { awake: true, color: 'blue', playerId: 'player4' },
  ]
  updatedGame.path[6].tokens = [
    { awake: true, color: 'yellow', playerId: 'player1' },
    { awake: true, color: 'red', playerId: 'player2' },
    { awake: true, color: 'green', playerId: 'player3' },
    { awake: true, color: 'blue', playerId: 'player4' },
  ]
  updatedGame.path[7].tokens = [{ awake: true, color: 'red', playerId: 'player2' }]

  updatedGame = doAction(
    {
      ...updatedGame,
      dices: [
        { value: '', rolls: 0, played: false, repeatValue: '' },
        { value: '', rolls: 0, played: false, repeatValue: '' },
        { value: '', rolls: 0, played: false, repeatValue: '' },
        { value: 'grapple', rolls: 0, played: false, repeatValue: '' },
      ],
    },
    { action: 'grapple', targetTile: 4, targetTokenIndex: 0 },
    'player1'
  )

  // Grappled token in full tile, next is full, lands on second next

  expect(updatedGame.path[4].tokens.length).toEqual(0)
  expect(updatedGame.path[7].tokens.length).toEqual(2)
  expect(updatedGame.path[7].tokens[1]).toEqual({
    awake: true,
    color: 'yellow',
    playerId: 'player1',
  })

  updatedGame.path[LAST_TILE - 2].tokens = [{ awake: true, color: 'yellow', playerId: 'player1' }]
  updatedGame.path[LAST_TILE].tokens = [
    { awake: true, color: 'yellow', playerId: 'player1' },
    { awake: true, color: 'red', playerId: 'player2' },
    { awake: true, color: 'green', playerId: 'player3' },
    { awake: true, color: 'blue', playerId: 'player4' },
  ]

  updatedGame = doAction(
    {
      ...updatedGame,
      dices: [
        { value: '', rolls: 0, played: false, repeatValue: '' },
        { value: '', rolls: 0, played: false, repeatValue: '' },
        { value: '', rolls: 0, played: false, repeatValue: '' },
        { value: 'grapple', rolls: 0, played: false, repeatValue: '' },
      ],
    },
    { action: 'grapple', targetTile: LAST_TILE - 2, targetTokenIndex: 0 },
    'player1'
  )

  // Grappled token in finish tile, lands in it

  expect(updatedGame.path[LAST_TILE - 2].tokens.length).toEqual(0)
  expect(updatedGame.path[LAST_TILE].tokens.length).toEqual(5)
  expect(updatedGame.path[LAST_TILE].tokens[4]).toEqual({
    awake: true,
    color: 'yellow',
    playerId: 'player1',
  })
})

test('action boot', () => {
  let updatedGame = doAction(
    JSON.parse(JSON.stringify(GAME_STATE_DATA)),
    { action: 'boot', targetTile: 0, tokenIndexList: [0, 1] },
    'player1'
  )

  // First three tiles have 2 tokens each

  expect(updatedGame.path[0].tokens.length).toEqual(0)
  expect(updatedGame.path[1].tokens.length).toEqual(3)
  expect(updatedGame.path[2].tokens.length).toEqual(3)

  updatedGame.path[6].tokens = [
    { awake: true, color: 'red', playerId: 'player1' },
    { awake: true, color: 'blue', playerId: 'player2' },
    { awake: true, color: 'green', playerId: 'player3' },
    { awake: true, color: 'yellow', playerId: 'player4' },
  ]
  updatedGame.path[6].type = 'ground'

  updatedGame = doAction(updatedGame, {
    action: 'boot',
    targetTile: 6,
    tokenIndexList: [3, 2, 1, 0],
  })

  expect(updatedGame.path[7].tokens.length).toEqual(1)
  expect(updatedGame.path[7].tokens[0].color).toEqual('yellow')
  expect(updatedGame.path[8].tokens.length).toEqual(1)
  expect(updatedGame.path[8].tokens[0].color).toEqual('green')
  expect(updatedGame.path[9].tokens.length).toEqual(1)
  expect(updatedGame.path[9].tokens[0].color).toEqual('blue')
  expect(updatedGame.path[10].tokens.length).toEqual(1)
  expect(updatedGame.path[10].tokens[0].color).toEqual('red')

  updatedGame.path[7].tokens = [
    { awake: true, color: 'red', playerId: 'player1' },
    { awake: true, color: 'blue', playerId: 'player2' },
  ]
  updatedGame.path[7].type = 'water'

  expect(() =>
    doAction(updatedGame, { action: 'boot', targetTile: 7, tokenIndexList: [1, 0] }, 'player1')
  ).toThrow()

  // one token is asleep

  updatedGame.path[0].tokens = [{ awake: false, color: 'yellow', playerId: 'player1' }]

  expect(() =>
    doAction(updatedGame, { action: 'boot', targetTile: 0, tokenIndexList: [0] }, 'player1')
  ).toThrow()

  updatedGame.path[LAST_TILE - 2].tokens = [
    { awake: true, color: 'yellow', playerId: 'player1' },
    { awake: true, color: 'yellow', playerId: 'player1' },
  ]

  // Two in last tile will both land on finish tile

  updatedGame = doAction(
    updatedGame,
    { action: 'boot', targetTile: LAST_TILE - 2, tokenIndexList: [0, 1] },
    'player1'
  )

  expect(updatedGame.path[LAST_TILE].tokens.length).toEqual(2)

  updatedGame.path[LAST_TILE - 2].tokens = [{ awake: true, color: 'yellow', playerId: 'player1' }]

  updatedGame = doAction(
    updatedGame,
    { action: 'boot', targetTile: LAST_TILE - 2, tokenIndexList: [0] },
    'player1'
  )

  expect(updatedGame.path[LAST_TILE].tokens.length).toEqual(3)
})

test('action repeat', () => {
  const gameData = JSON.parse(JSON.stringify(GAME_STATE_DATA))
  gameData.dices[0].value = 'repeat'
  gameData.dices[0].played = false
  gameData.dices[1].value = 'water'
  gameData.dices[1].played = true
  gameData.dices[1].rolls = 0
  gameData.path[6].type = 'water'
  gameData.path[6].tokens = [{ awake: true, color: 'blue', playerId: 'player1' }]

  // Repeat action water

  let updatedGame = doAction(
    gameData,
    {
      action: 'repeat',
      targetAction: 'water',
      targetActionOptions: { targetTile: 6, targetTokenIndex: 0 },
    },
    'player1'
  )

  expect(updatedGame.path[6].tokens.length).toEqual(0)
  expect(updatedGame.path[7].tokens.length).toEqual(1)

  gameData.dices[0].value = 'repeat'
  gameData.dices[0].played = false
  gameData.dices[1].value = 'water'
  gameData.dices[1].played = true
  gameData.dices[2].value = 'water'
  gameData.dices[2].played = true

  // Cannot repeat action water

  expect(() =>
    doAction(
      gameData,
      {
        action: 'repeat',
        targetAction: 'water',
        targetActionOptions: { targetTile: 6, targetTokenIndex: 0 },
      },
      'player1'
    )
  ).toThrow('water has already been played twice, cannot be repeated')

  gameData.dices[0].value = 'repeat'
  gameData.dices[0].played = false
  gameData.dices[1].value = 'water'
  gameData.dices[1].played = true
  gameData.dices[2].value = 'repeat'
  gameData.dices[2].played = true
  gameData.dices[2].repeatValue = 'water'

  // Cannot repeat action water, repeated + played

  expect(() =>
    doAction(
      gameData,
      {
        action: 'repeat',
        targetAction: 'water',
        targetActionOptions: { targetTile: 6, targetTokenIndex: 0 },
      },
      'player1'
    )
  ).toThrow('water has already been played twice, cannot be repeated')

  gameData.dices[0].value = 'repeat'
  gameData.dices[0].played = false
  gameData.dices[1].value = 'water'
  gameData.dices[1].played = false
  gameData.dices[2].value = 'water'
  gameData.dices[2].played = false
  gameData.path[12].tokens = [{ awake: true, color: 'yellow', playerId: 'player1' }]

  // Cannot repeat action water, invalid

  expect(() =>
    doAction(
      gameData,
      {
        action: 'repeat',
        targetAction: 'water',
        targetActionOptions: { targetTile: 12, targetTokenIndex: 0 },
      },
      'player1'
    )
  ).toThrow()
})
