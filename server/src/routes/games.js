import express from 'express'
import * as GameController from '../controllers/gameController.js'

const router = express.Router()

router.post('/games', GameController.createGame)
router.put('/games/:id/', GameController.updateGame)
router.get('/games/:id/', GameController.getGame)

export { router as gameRoutes }
