import { h, text } from 'hyperapp'

const renderPathView = (gameState) => {
  return h('div', {}, [
    ...mapPathTilesToGrid(gameState.path, gameState.gridSize).map((gridLine, rowIndex) =>
      h('div', { class: { 'flex-container': true } }, [
        ...gridLine.map((tile) => {
          return renderTile(tile)
        }),
      ])
    ),
  ])
}

const renderTile = (tile) => {
  return (
    tile &&
    h('div', { class: { tile: true, [tile.type]: true } }, [
      ...renderTokenList(tile.tokens),
      h(
        'div',
        { class: { 'tile-index-container': true } },
        h(
          'span',
          { class: { 'tile-index': true } },
          text(tile.index === undefined ? 0 : tile.index)
        )
      ),
    ])
  )
}

const renderTokenList = (tokens) => {
  if (!tokens) return []

  return tokens.map((token, tokenIndex) => renderToken(token, tokenIndex))
}

const renderToken = (token, index) => {
  return h(
    'div',
    {
      class: { token: true, [token.color.toLowerCase()]: true, sleep: !token.awake },
    },
    [h('span', {}, text(index))]
  )
}

const mapPathTilesToGrid = (path, gridSize) => {
  let newGrid = []

  for (let i = 0; i < gridSize.h; i++) {
    newGrid.push(Array(gridSize.w).fill({}))
  }

  path.forEach((tile, index) => (newGrid[tile.y][tile.x] = { ...tile, index: index }))

  return newGrid
}

export { renderPathView }
