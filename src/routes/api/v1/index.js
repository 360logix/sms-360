import { Router } from 'express'

import modem from './modem'

const router = Router()

router.use('/modem', modem)

export default router