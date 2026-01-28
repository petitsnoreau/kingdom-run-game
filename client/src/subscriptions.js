import { init, stop } from './socketService.js'

const listenForSocketMessages = (dispatch, options) => {
  init(options.playerId, options.gameId, (data) => {
    dispatch(options.action, data)
  })

  return () => stop()
}

/*

   keep playerId for each gameId
   with UI, show all games
   with apiService, validate if game exists and state paused
   on server, resume game if all players are present
   on server, add get endpoint for game with id

*/

export { listenForSocketMessages }
