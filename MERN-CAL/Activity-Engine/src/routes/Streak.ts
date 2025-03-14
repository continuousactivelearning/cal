import { Router } from 'express';
import { fetchStreak } from '../controllers/FetchStreak'

const router = Router()

router.post("/streak", fetchStreak)

export default router   