const express = require('express')
const { z } = require('zod')

const Crop = require('../models/Crop')
const { requireAuth } = require('../middleware/auth')
const { badRequest } = require('../utils/httpErrors')
const { predictPrice } = require('../services/predictionService')

const predictionsRouter = express.Router()
predictionsRouter.use(requireAuth)

predictionsRouter.post('/', async (req, res, next) => {
  try {
    const schema = z.object({
      cropId: z.string(),
      windowDays: z.number().int().min(7).max(60).optional(),
    })
    const body = schema.parse(req.body)

    const crop = await Crop.findOne({ _id: body.cropId, userId: req.user.id })
    if (!crop) throw badRequest('Invalid cropId')

    const windowDays = body.windowDays ?? 14

    const { predictedPriceRwfPerKg, confidence } = predictPrice({
      cropName: crop.name,
      cropId: String(crop._id),
      windowDays,
    })

    res.json({
      cropId: String(crop._id),
      cropName: crop.name,
      windowDays,
      predictedPriceRwfPerKg,
      confidence,
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    next(err)
  }
})

module.exports = { predictionsRouter }

