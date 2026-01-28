import { dirname } from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
import workerThreads from 'worker_threads'
import { promises as fs } from 'fs'

const GAMES_PATH_FILE = `${__dirname}/../../data/games.json`

let games = {}
let lockDataFile = false

const dumpGamesData = () => {
  let worker

  if (lockDataFile) return

  try {
    worker = new workerThreads.Worker(`${__dirname}/gameDataPersistorService.js`, {
      workerData: JSON.stringify({ path: GAMES_PATH_FILE, data: games }),
    })
    lockDataFile = true
  } catch (error) {
    console.log(error.message)
    return
  }

  worker.on('exit', () => {
    worker.unref()
    lockDataFile = false
    console.log('Games data persisted to disk.')
  })
  worker.on('error', (error) => {
    console.log(`An error occured while trying to save games data: ${error.message}`)
  })
}

// Api functions

const init = async () => {
  try {
    games = JSON.parse(await fs.readFile(GAMES_PATH_FILE))
  } catch (error) {
    console.log('Games data file not found.')
  }
}

const readGamesData = async (path, games) => {
  try {
    games = await readFile(path)
  } catch (error) {
    console.log(`An error occured while writing games data: ${error.message}`)
  }
}

const remove = (id) => {
  const { [id]: remove, ...updatedGames } = games
  games = updatedGames
}

const save = (game) => {
  games[game.id] = game
  dumpGamesData()
}

const getById = (id) => {
  if (!games.hasOwnProperty(id)) {
    return undefined
  }

  return games[id]
}

const validatePlayerId = (gameId, playerId) => {
  return games.hasOwnProperty(gameId) && games[gameId].players.hasOwnProperty(playerId)
}

export { validatePlayerId, getById, save, init, remove }
