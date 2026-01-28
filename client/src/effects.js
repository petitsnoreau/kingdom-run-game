import * as gameService from './gameService.js'

const executeCommand = async (dispatch, options) => {
  dispatch(await gameService.executeCommand(options.state, options.command))
}

export { executeCommand }
