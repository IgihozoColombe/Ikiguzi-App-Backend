const express = require('express')
const { z } = require('zod')

const CostEntry = require('../models/CostEntry')
const Crop = require('../models/Crop')
const { requireAuth } = require('../middleware/auth')
const { badRequest } = require('../utils/httpErrors')

const costsRouter = express.Router()
costsRouter.use(requireAuth)

costsRouter.get('/', async (req, res, next) => {
  try {
    const schema = z.object({
      cropId: z.string().optional(),
    })
    const q = schema.parse(req.query)
    const filter = { userId: req.user.id }
    if (q.cropId) filter.cropId = q.cropId

    const costs = await CostEntry.find(filter).sort({ occurredAt: -1, createdAt: -1 })
    res.json({ costs })
  } catch (err) {
    next(err)
  }
})

costsRouter.post('/', async (req, res, next) => {
  try {
    const schema = z.object({
      cropId: z.string(),
      category: z.enum([
        'seeds',
        'fertilizer',
        'labor',
        'pesticide',
        'irrigation',
        'transport',
        'other',
      ]),
      amountRwf: z.number().nonnegative(),
      note: z.string().optional(),
      occurredAt: z.coerce.date().optional(),
    })
    const body = schema.parse(req.body)

    const crop = await Crop.findOne({ _id: body.cropId, userId: req.user.id })
    if (!crop) throw badRequest('Invalid cropId')

    const cost = await CostEntry.create({
      userId: req.user.id,
      cropId: body.cropId,
      category: body.category,
      amountRwf: body.amountRwf,
      note: body.note ?? '',
      occurredAt: body.occurredAt ?? new Date(),
    })

    res.status(201).json({ cost })
  } catch (err) {
    next(err)
  }
})

module.exports = { costsRouter }

