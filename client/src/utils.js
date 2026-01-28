import { h, text } from 'hyperapp'

const assignBoardValues = (board, tile) => {
  let newBoard = { ...board }

  /*
     G0G0
     G0G0

     Each tile is composed of four sections and each section is composed
     of the content and the type.

   */

  const x2 = tile.x * 4
  const y2 = tile.y * 2
  const type = tile.type.slice(0, 1)

  const contentList = Array(4)
    .fill('.')
    .map((content, index) => {
      if (index < tile.tokens.length) {
        return tile.tokens[index].awake
          ? tile.tokens[index].color.slice(0, 1).toUpperCase()
          : tile.tokens[index].color.slice(0, 1).toLowerCase()
      } else {
        return content
      }
    })

  newBoard[y2][x2] = contentList[0]
  newBoard[y2][x2 + 1] = type

  newBoard[y2][x2 + 2] = contentList[1]
  newBoard[y2][x2 + 3] = type

  newBoard[y2 + 1][x2] = contentList[2]
  newBoard[y2 + 1][x2 + 1] = type

  newBoard[y2 + 1][x2 + 2] = contentList[3]
  newBoard[y2 + 1][x2 + 3] = type

  return newBoard
}

const printPath = (path) => {
  if (!path || path.length === 0) return []

  let board = {}
  const positionList = [...Array(50).keys()]

  positionList.forEach((positionY) => {
    board[positionY] = {}

    positionList.forEach((positionX) => {
      board[positionY][positionX] = ' '
    })
  })

  path.forEach((tile) => {
    board = assignBoardValues(board, tile)
  })

  let printArray = []
  for (let line in board) {
    let tmpLine = ''
    for (let tile in board[line]) {
      tmpLine += board[line][tile]
    }

    const isEmpty = tmpLine.split('').every((character) => character === ' ')
    if (!isEmpty) printArray.push(tmpLine)
  }

  return printArray
}

const addNewLines = (list) => {
  if (list.length === 0) return list
  return list.join('\n')
}

const printDices = (dices) => {
  return dices.map((dice) => `${dice.value}: ${dice.rolls}, played: ${dice.played}`)
}

const getPlayerPoints = (player) => player.points + player.pathPoints

const printPlayers = (players) => {
  return Object.values(players).map(
    (player) =>
      `player: ${player.id}, color: ${player.color}, points: ${
        player.points
      }, total points: ${getPlayerPoints(player)} connected: ${player.connected}`
  )
}

const addMessageToHistory = (state, message) => {
  return {
    ...state,
    gameHistory: [...state.gameHistory, message],
  }
}

const prettifyData = (data) => {
  return JSON.stringify(data, null, 2)
}

const saveGameToStorage = (gameId, playerId, state) => {
  const newGameList = [...state.games, { id: gameId, playerId: playerId }]
  localStorage.setItem('games', JSON.stringify(newGameList))
  return { ...state, games: newGameList }
}

const removeGameFromStorage = (gameId, state) => {
  const newGameList = state.games.filter((game) => game.id !== gameId)
  localStorage.setItem('games', JSON.stringify(newGameList))
  return { ...state, games: newGameList }
}

const clearStorage = (state) => {
  localStorage.setItem('games', JSON.stringify([]))
  return { ...state, games: [] }
}

const loadGamesFromStorage = () => {
  const games = localStorage.getItem('games')
  if (!games) {
    return []
  }

  return JSON.parse(games)
}

export {
  printPath,
  printDices,
  addNewLines,
  addMessageToHistory,
  prettifyData,
  printPlayers,
  loadGamesFromStorage,
  saveGameToStorage,
  removeGameFromStorage,
  clearStorage,
}
