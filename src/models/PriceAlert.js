const mongoose = require('mongoose')

const priceAlertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' },
    cropId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'Crop' },

    direction: { type: String, required: true, enum: ['above', 'below'] },
    thresholdRwfPerKg: { type: Number, required: true, min: 0 },
    windowDays: { type: Number, default: 14 },

    enabled: { type: Boolean, default: true },
    notifySMS: { type: Boolean, default: false },
    notifyEmail: { type: Boolean, default: true },
  },
  { timestamps: true },
)

module.exports = mongoose.model('PriceAlert', priceAlertSchema)

