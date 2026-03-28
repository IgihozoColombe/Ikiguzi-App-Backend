const mongoose = require('mongoose')

const notificationLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' },
    cropId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'Crop' },
    priceAlertId: { type: mongoose.Schema.Types.ObjectId, index: true, ref: 'PriceAlert' },

    channel: { type: String, required: true, enum: ['sms', 'email'] },
    direction: { type: String, required: true, enum: ['above', 'below'] },
    thresholdRwfPerKg: { type: Number, required: true },
    predictedPriceRwfPerKg: { type: Number, required: true },
    message: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

module.exports = mongoose.model('NotificationLog', notificationLogSchema)

