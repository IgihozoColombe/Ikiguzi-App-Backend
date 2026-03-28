const express = require('express')
const { z } = require('zod')

const Crop = require('../models/Crop')
const { requireAuth } = require('../middleware/auth')

const cropsRouter = express.Router()
cropsRouter.use(requireAuth)

cropsRouter.get('/', async (req, res, next) => {
  try {
    const crops = await Crop.find({ userId: req.user.id }).sort({ createdAt: -1 })
    res.json({ crops })
  } catch (err) {
    next(err)
  }
})

cropsRouter.post('/', async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      areaHa: z.number().nonnegative().optional(),
      season: z.string().optional(),
      expectedYieldKg: z.number().nonnegative().optional(),
    })
    const body = schema.parse(req.body)

    const crop = await Crop.create({
      userId: req.user.id,
      name: body.name,
      areaHa: body.areaHa ?? 0,
      season: body.season ?? '',
      expectedYieldKg: body.expectedYieldKg ?? 0,
    })
    res.status(201).json({ crop })
  } catch (err) {
    next(err)
  }
})

cropsRouter.patch('/:id', async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2).optional(),
      areaHa: z.number().nonnegative().optional(),
      season: z.string().optional(),
      expectedYieldKg: z.number().nonnegative().optional(),
    })
    const body = schema.parse(req.body)

    const crop = await Crop.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: body },
      { new: true },
    )
    if (!crop) return res.status(404).json({ error: 'Not found' })
    res.json({ crop })
  } catch (err) {
    next(err)
  }
})

cropsRouter.delete('/:id', async (req, res, next) => {
  try {
    const result = await Crop.deleteOne({ _id: req.params.id, userId: req.user.id })
    res.json({ deleted: result.deletedCount === 1 })
  } catch (err) {
    next(err)
  }
})

module.exports = { cropsRouter }

