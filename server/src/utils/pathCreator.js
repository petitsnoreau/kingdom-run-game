import { tiles, MAX_TOKENS, FINISH_MAX_TOKENS } from './../constants/general.js'

const EMPTY = 0
const USED = 1
const UP = 0
const DOWN = 1
const LEFT = 2
const RIGHT = 3

const updateTileProperty = (tile, property, newValue) => {
  return Object.assign({}, tile, { [property]: newValue })
}

const getPathCreationBoard = () => {
  let board = {}

  const positionList = [
    ...[...Array(40).keys()].slice(1).map((key) => {
      return -key
    }),
    0,
    ...[...Array(40).keys()].slice(1),
  ]

  positionList.forEach((positionY) => {
    board[positionY] = {}

    positionList.forEach((positionX) => {
      board[positionY][positionX] = EMPTY
    })
  })

  return board
}

const updatePathCreationBoard = (board, path) => {
  let newBoard = { ...board }

  path.forEach((tile) => {
    newBoard[tile.y][tile.x] = USED
  })

  return newBoard
}

const getTile = (x, y, value, type, length = MAX_TOKENS) => {
  return {
    x: x,
    y: y,
    value: value,
    type: type,
    tokens: [],
    length: length,
  }
}

const getPathStart = () => {
  return [
    getTile(0, 1, 0, tiles.START),
    getTile(0, 0, 0, tiles.START),
    getTile(1, 0, 0, tiles.START),
    getTile(1, 1, 0, tiles.START),
  ]
}

const tilePositionEmpty = (tile, referenceBoard) => {
  return referenceBoard[tile.y][tile.x] === EMPTY
}

const getSurroundingTileByDirection = (tile, direction, type) => {
  let positionArguments = []

  switch (direction) {
    case UP:
      positionArguments = [tile.x, tile.y - 1]
      break
    case DOWN:
      positionArguments = [tile.x, tile.y + 1]
      break
    case LEFT:
      positionArguments = [tile.x - 1, tile.y]
      break
    case RIGHT:
      positionArguments = [tile.x + 1, tile.y]
      break
  }

  return getTile(
    ...positionArguments,
    0,
    type,
    type === tiles.FINISH ? FINISH_MAX_TOKENS : undefined
  )
}

const getNextTileList = (tile, referenceBoard) => {
  return [UP, DOWN, LEFT, RIGHT]
    .map((direction) => {
      return getSurroundingTileByDirection(tile, direction, tiles.GROUND)
    })
    .filter((tile) => {
      return tilePositionEmpty(tile, referenceBoard)
    })
}

const tilePositionIsValid = (tile, referenceBoard) => {
  return getNextTileList(tile, referenceBoard).length === 3
}

const getRandomNextTile = (tile, referenceBoard) => {
  const nextTileList = getNextTileList(tile, referenceBoard).filter((tile) =>
    tilePositionIsValid(tile, referenceBoard)
  )

  return nextTileList.length > 0
    ? nextTileList[Math.floor(Math.random() * nextTileList.length)]
    : undefined
}

const getPathCore = (tile, referenceBoard) => {
  // do not trust destructuring!
  let workingBoard = JSON.parse(JSON.stringify(referenceBoard))
  let pathCore = [tile]
  let randomTile = tile
  let i = 0

  do {
    workingBoard = updatePathCreationBoard(workingBoard, [randomTile])
    randomTile = getRandomNextTile(pathCore[i], workingBoard)
    pathCore.push(randomTile)
    i += 1
  } while (i < 10 && randomTile !== undefined)

  if (!randomTile) {
    // last tile if missing, parent function will recall this one
    return pathCore.slice(0, -2)
  }

  return pathCore.slice(0, -1)
}

const getLastDirection = (path) => {
  const lastTile = path[path.length - 1]
  const nextTolastTile = path[path.length - 2]

  if (lastTile.x === nextTolastTile.x) {
    return lastTile.y > nextTolastTile.y ? DOWN : UP
  } else {
    return lastTile.x > nextTolastTile.x ? RIGHT : LEFT
  }
}

const getPathEnd = (path) => {
  let pathEnd = []

  const lastDirection = getLastDirection(path)
  const firstFinishTile = updateTileProperty(
    getSurroundingTileByDirection(path[path.length - 1], lastDirection, tiles.FINISH),
    'length',
    0
  )
  const secondFinishTile = getSurroundingTileByDirection(
    firstFinishTile,
    lastDirection,
    tiles.FINISH
  )

  pathEnd.push(firstFinishTile, secondFinishTile)

  return pathEnd
}

const setTileValues = (path) => {
  function* valueGenerator() {
    const values = [2, 2, 3, 3, 4, 4, 5, 5, 6, 6]
    for (let i = 0; i < values.length; i++) {
      yield values[i]
    }
  }

  const generator = valueGenerator()
  return path.map((tile) => {
    return updateTileProperty(tile, 'value', generator.next().value)
  })
}

const tryWaterTiles = (path) => {
  const newPath = JSON.parse(JSON.stringify(path))
  const indexList = [...Array(10).keys()]
  let shuffledIndexList = indexList.sort(() => 0.5 - Math.random())

  for (let i = 0; i < 3; i++) {
    let index = shuffledIndexList[0]
    newPath[index].type = tiles.WATER
    shuffledIndexList = shuffledIndexList.slice(1)
  }

  return newPath
}

const validateWaterTiles = (path) => {
  let lastTile = { type: tiles.GROUND }
  let valid = true

  for (let i = 0; i < path.length; i++) {
    let currentTile = path[i]

    if (lastTile.type === tiles.WATER && currentTile.type === tiles.WATER) {
      valid = false
      break
    }

    lastTile = currentTile
  }

  return valid
}

const addWaterTiles = (path) => {
  let valid = false
  let newPath = []

  while (!valid) {
    newPath = tryWaterTiles(path)
    valid = validateWaterTiles(newPath)
  }

  return newPath
}

const createNewPath = () => {
  let referenceBoard = getPathCreationBoard()

  // First ground tile is statically choosen

  const staticTile = getTile(1, 2, 0, tiles.GROUND)
  referenceBoard = updatePathCreationBoard(referenceBoard, [...getPathStart(), staticTile])

  let pathCore
  let pathIsValid = false

  while (!pathIsValid) {
    console.log('trying ')
    pathCore = []

    while (pathCore.length < 10) {
      pathCore = getPathCore(staticTile, referenceBoard)
    }

    let wholePath = recenterPath([...getPathStart(), ...pathCore, ...getPathEnd(pathCore)])

    let maxY = Math.max(
      ...wholePath.map((tile) => {
        return tile.y
      })
    )

    if (maxY <= 5) {
      pathIsValid = true
    }
    console.log(pathIsValid)
  }

  pathCore = setTileValues(addWaterTiles(pathCore))

  return recenterPath([...getPathStart(), ...pathCore, ...getPathEnd(pathCore)])
}

const recenterPath = (path) => {
  const shiftX = Math.abs(
    Math.min(
      ...path.map((tile) => {
        return tile.x
      })
    )
  )
  const shiftY = Math.abs(
    Math.min(
      ...path.map((tile) => {
        return tile.y
      })
    )
  )

  return path.map((tile) => {
    return updateTileProperty(updateTileProperty(tile, 'x', tile.x + shiftX), 'y', tile.y + shiftY)
  })
}

const getPathGridSize = (path) => {
  return path.reduce(
    (accumulator, tile) => {
      const newSize = { ...accumulator }
      if (tile.x >= accumulator.w) {
        newSize.w = tile.x + 1
      }
      if (tile.y >= accumulator.h) {
        newSize.h = tile.y + 1
      }
      return newSize
    },
    { w: 0, h: 0 }
  )
}

export { createNewPath, getPathGridSize }
