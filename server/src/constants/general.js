const actions = {
  POINTS: 'points',
  SLEEP: 'sleep',
  WATER: 'water',
  GRAPPLE: 'grapple',
  BOOT: 'boot',
  REPEAT: 'repeat',
}

const tiles = { GROUND: 'ground', WATER: 'water', START: 'start', FINISH: 'finish' }

const statuses = { OPEN: 'open', STARTED: 'started', PAUSED: 'paused', FINISHED: 'finished' }

const colors = { BLUE: 'blue', RED: 'red', GREEN: 'green', YELLOW: 'yellow' }

const ROLL_DICE = 'rollDice'
const END_TURN = 'endTurn'

const actionDefinitions = {
  [END_TURN]: {},
  [ROLL_DICE]: {
    dices: {
      type: 'array',
      arrayType: 'number',
      minimum: 0,
      maximum: 3,
    },
  },
  [actions.POINTS]: {
    targetPlayer: {
      type: 'string',
    },
  },
  [actions.SLEEP]: {
    targetTile: {
      type: 'number',
      minimum: 0,
      maximum: 13,
    },
    targetTokenIndex: {
      type: 'number',
      minimum: 0,
      maximum: 3,
    },
  },
  [actions.WATER]: {
    targetTile: {
      type: 'number',
      minimum: 0,
      maximum: 13,
    },
    targetTokenIndex: {
      type: 'number',
      minimum: 0,
      maximum: 3,
    },
  },
  [actions.GRAPPLE]: {
    targetTile: {
      type: 'number',
      minimum: 0,
      maximum: 13,
    },
    targetTokenIndex: {
      type: 'number',
      minimum: 0,
      maximum: 3,
    },
  },
  [actions.BOOT]: {
    targetTile: {
      type: 'number',
      minimum: 0,
      maximum: 13,
    },
    tokenIndexList: {
      type: 'array',
      arrayType: 'number',
      minimum: 0,
      maximum: 3,
    },
  },
  [actions.REPEAT]: {
    targetAction: {
      type: 'string',
    },
    targetActionOptions: {
      type: 'object',
    },
  },
}

const MAX_TOKENS = 4
const FINISH_MAX_TOKENS = 8
const LAST_TILE = 15

export {
  colors,
  actions,
  tiles,
  statuses,
  actionDefinitions,
  ROLL_DICE,
  END_TURN,
  MAX_TOKENS,
  FINISH_MAX_TOKENS,
  LAST_TILE,
}
