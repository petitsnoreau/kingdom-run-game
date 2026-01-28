const API_URL = `${process.env.API_URL}/api`
const API_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
}

const getGame = async (gameId) => {
  const response = await fetch(`${API_URL}/games/${gameId}`, {
    method: 'GET',
    headers: API_HEADERS,
  })

  if (response.status === 404) {
    throw new Error(`ERROR: game ${gameId} not found`)
  }

  return await response.json()
}

const startGame = async (gameId) => {
  const response = await fetch(`${API_URL}/games/${gameId}`, {
    method: 'PUT',
    headers: API_HEADERS,
    body: JSON.stringify({
      action: 'start',
    }),
  })

  if (response.status === 404) {
    throw new Error(`ERROR: game ${gameId} not found`)
  } else if (response.status === 400) {
    throw new Error(`ERROR: game ${gameId} cannot be started`)
  }

  return await response.json()
}

const joinGame = async (gameId) => {
  const response = await fetch(`${API_URL}/games/${gameId}`, {
    method: 'PUT',
    headers: API_HEADERS,
    body: JSON.stringify({
      action: 'join',
    }),
  })

  if (response.status === 404) {
    throw new Error(`ERROR: game ${gameId} not found`)
  } else if (response.status === 400) {
    throw new Error(`ERROR: game ${gameId} is full`)
  }

  return await response.json()
}

const createGame = async () => {
  const response = await fetch(`${API_URL}/games`, { method: 'POST' })

  if (response.status !== 200) {
    throw new Error(`ERROR: game could not be created.`)
  }

  return await response.json()
}

export { createGame, joinGame, startGame, getGame }
