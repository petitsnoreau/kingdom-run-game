import { tiles, MAX_TOKENS, LAST_TILE } from './../constants/general.js'

const updateTokenInTile = (updatedToken, tokenIndex, tile) => {
  return {
    ...tile,
    tokens: tile.tokens.map((token, index) => (index === tokenIndex ? updatedToken : token)),
  }
}

const updateTileInPath = (updatedTile, tileIndex, path) => {
  return path.map((tile, index) => (index === tileIndex ? updatedTile : tile))
}

const removeTokensFromTile = (tokenIndexList, tile) => {
  return { ...tile, tokens: tile.tokens.filter((token, index) => !tokenIndexList.includes(index)) }
}

const addTokenToTile = (token, tile) => {
  return { ...tile, tokens: [...tile.tokens, token] }
}

const moveTokenToTile = (tileIndex, tokenIndex, path, newIndex) => {
  const token = path[tileIndex].tokens[tokenIndex]

  return updateTileInPath(
    addTokenToTile(token, path[newIndex]),
    newIndex,
    updateTileInPath(removeTokensFromTile([tokenIndex], path[tileIndex]), tileIndex, path)
  )
}

const getNextAvailableTile = (path, startIndex) => {
  const index = path
    .slice(startIndex)
    .findIndex(
      (tile) =>
        tile.length > 0 && ((tile.tokens && tile.tokens.length < tile.length) || !tile.tokens)
    )

  return index !== -1 ? index + startIndex : index
}

const getNextWaterTile = (path, startIndex) => {
  const index = path
    .slice(startIndex)
    .findIndex((tile) => tile.type === tiles.WATER && tile.tokens.length < MAX_TOKENS)

  return index !== -1 ? index + startIndex : index
}

const getNextOccupiedTile = (path, startIndex) => {
  const index = path.slice(startIndex).findIndex((tile) => tile.tokens && tile.tokens.length > 0)

  return index !== -1 ? index + startIndex : index
}

const updateFinishTiles = (game) => {
  if (!game.path[LAST_TILE].tokens || game.path[LAST_TILE].tokens.length <= 4) return game

  return {
    ...game,
    path: [
      ...game.path.slice(0, 14),
      { ...game.path[14], tokens: game.path[LAST_TILE].tokens.slice(4) },
      { ...game.path[LAST_TILE], tokens: game.path[LAST_TILE].tokens.slice(0, 4) },
    ],
  }
}

export {
  updateTileInPath,
  updateTokenInTile,
  addTokenToTile,
  removeTokensFromTile,
  moveTokenToTile,
  getNextWaterTile,
  getNextAvailableTile,
  getNextOccupiedTile,
  updateFinishTiles,
}
