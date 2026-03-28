const express = require('express')
const { z } = require('zod')

const { requireAuth } = require('../middleware/auth')
const { sendEmail, sendSMS } = require('../services/notificationService')
const { predictPrice } = require('../services/predictionService')

const Crop = require('../models/Crop')
const PriceAlert = require('../models/PriceAlert')
const NotificationLog = require('../models/NotificationLog')
const NotificationPreference = require('../models/NotificationPreference')

const { badRequest } = require('../utils/httpErrors')
const User = require('../models/User')

const alertsRouter = express.Router()
alertsRouter.use(requireAuth)

alertsRouter.get('/', async (req, res, next) => {
  try {
    const alerts = await PriceAlert.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean()

    const cropIds = alerts.map((a) => a.cropId)
    const crops = await Crop.find({ _id: { $in: cropIds } }).lean()
    const cropById = new Map(crops.map((c) => [String(c._id), c]))

    const enriched = alerts.map((a) => {
      const crop = cropById.get(String(a.cropId))
      return {
        ...a,
        cropName: crop?.name || '',
      }
    })

    res.json({ alerts: enriched })
  } catch (err) {
    next(err)
  }
})

alertsRouter.get('/count', async (req, res, next) => {
  try {
    const count = await PriceAlert.countDocuments({
      userId: req.user.id,
      enabled: true,
    })
    res.json({ count })
  } catch (err) {
    next(err)
  }
})

alertsRouter.get('/preferences', async (req, res, next) => {
  try {
    const pref = await NotificationPreference.findOne({ userId: req.user.id })
    res.json({
      smsEnabled: pref?.smsEnabled ?? false,
      emailEnabled: pref?.emailEnabled ?? true,
    })
  } catch (err) {
    next(err)
  }
})

alertsRouter.post('/preferences', async (req, res, next) => {
  try {
    const schema = z.object({
      smsEnabled: z.boolean(),
      emailEnabled: z.boolean(),
    })
    const body = schema.parse(req.body)

    const pref = await NotificationPreference.findOneAndUpdate(
      { userId: req.user.id },
      { $set: body },
      { upsert: true, new: true },
    )

    res.json({
      smsEnabled: pref.smsEnabled,
      emailEnabled: pref.emailEnabled,
    })
  } catch (err) {
    next(err)
  }
})

alertsRouter.post('/', async (req, res, next) => {
  try {
    const schema = z.object({
      cropId: z.string(),
      direction: z.enum(['above', 'below']),
      thresholdRwfPerKg: z.number().nonnegative(),
      windowDays: z.number().int().min(7).max(60).optional(),
      notifySMS: z.boolean().optional().default(false),
      notifyEmail: z.boolean().optional().default(true),
    })
    const body = schema.parse(req.body)

    const crop = await Crop.findOne({ _id: body.cropId, userId: req.user.id })
    if (!crop) throw badRequest('Invalid cropId')

    const alert = await PriceAlert.create({
      userId: req.user.id,
      cropId: body.cropId,
      direction: body.direction,
      thresholdRwfPerKg: body.thresholdRwfPerKg,
      windowDays: body.windowDays ?? 14,
      notifySMS: Boolean(body.notifySMS),
      notifyEmail: Boolean(body.notifyEmail),
    })

    res.status(201).json({ alert })
  } catch (err) {
    next(err)
  }
})

alertsRouter.post('/check', async (req, res, next) => {
  try {
    const alerts = await PriceAlert.find({
      userId: req.user.id,
      enabled: true,
    })
    if (alerts.length === 0) return res.json({ triggered: 0, checked: 0 })

    const pref = await NotificationPreference.findOne({ userId: req.user.id })
    const smsEnabled = pref?.smsEnabled ?? false
    const emailEnabled = pref?.emailEnabled ?? true
    const user = await User.findById(req.user.id).lean()

    const cropIds = alerts.map((a) => a.cropId)
    const crops = await Crop.find({ _id: { $in: cropIds } })
    const cropById = new Map(crops.map((c) => [String(c._id), c]))

    const now = Date.now()
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000)

    let triggered = 0
    const events = []

    for (const alert of alerts) {
      const crop = cropById.get(String(alert.cropId))
      if (!crop) continue

      const predicted = predictPrice({
        cropName: crop.name,
        cropId: String(crop._id),
        windowDays: alert.windowDays ?? 14,
      })

      const shouldTrigger =
        (alert.direction === 'above' && predicted.predictedPriceRwfPerKg >= alert.thresholdRwfPerKg) ||
        (alert.direction === 'below' && predicted.predictedPriceRwfPerKg <= alert.thresholdRwfPerKg)

      if (!shouldTrigger) continue

      const channels = []
      if (alert.notifySMS && smsEnabled) channels.push('sms')
      if (alert.notifyEmail && emailEnabled) channels.push('email')
      if (channels.length === 0) continue

      for (const channel of channels) {
        const recent = await NotificationLog.findOne({
          userId: req.user.id,
          priceAlertId: alert._id,
          channel,
          createdAt: { $gte: dayAgo },
        })
        if (recent) continue

        const message = `Ikiguzi alert: ${crop.name} is predicted at RWF ${predicted.predictedPriceRwfPerKg}/kg (rule: ${alert.direction} ${alert.thresholdRwfPerKg})`

        if (channel === 'sms') {
          const to = user?.phone
          await sendSMS({ to, text: message })
        } else {
          await sendEmail({ to: user?.email, subject: 'Ikiguzi price alert', text: message })
        }

        await NotificationLog.create({
          userId: req.user.id,
          cropId: crop._id,
          priceAlertId: alert._id,
          channel,
          direction: alert.direction,
          thresholdRwfPerKg: alert.thresholdRwfPerKg,
          predictedPriceRwfPerKg: predicted.predictedPriceRwfPerKg,
          message,
        })

        triggered += 1
        events.push({ channel, crop: crop.name, predicted: predicted.predictedPriceRwfPerKg })
      }
    }

    res.json({ triggered, checked: alerts.length, events })
  } catch (err) {
    next(err)
  }
})

module.exports = { alertsRouter }

