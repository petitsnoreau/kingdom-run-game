let testGameState = {}

const updateGameState = (state) => {
  testGameState = { ...state }
}

const getGameState = () => {
  return testGameState
}

export { updateGameState, getGameState }
