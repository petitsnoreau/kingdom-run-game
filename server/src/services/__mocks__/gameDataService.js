import { getGameState, updateGameState } from '../../../test/testGameStateService.js'

const getById = (id) => {
  return getGameState()
}

const save = (state) => {
  updateGameState(state)
}

export { getById, save }
